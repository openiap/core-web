<script lang="ts">
  import { browser } from "$app/environment";
  import { base } from "$app/paths";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import Custominput from "$lib/custominput/custominput.svelte";
  import { MonacoEditor } from "$lib/monacoeditor/index.js";
  import { auth } from "$lib/stores/auth.svelte";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { PlusIcon } from "lucide-svelte";
  import * as pako from "pako";
  import { toast } from "svelte-sonner";
  import FileTreeNode from "./FileTreeNode.svelte";
  // @ts-ignore
  import unpack from "js-untar";
  import { CustomSuperDebug } from "$lib/customsuperdebug";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";

  let profileroles = auth.profile?.roles || [];
  const isSfUser = profileroles.includes("sf users");

  function stringToUint8Array(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  async function createTgzFromPayload(payload: {
    jwt: string; // (we won’t actually use this in the tar, but you could!)
    filename: string;
    files: { filename: string; content: string }[];
  }): Promise<Uint8Array> {
    if (!browser) {
      throw new Error("createTgzFromPayload() can only run in the browser");
    }

    // ──────── 2a. Dynamically import tar-js (default export = Tar constructor) ────────
    // At runtime in the browser, this yields:
    //   TarModule.default === the Tar class constructor
    // @ts-ignore
    const TarModule: any = await import("tar-js");
    const Tar: new (recordsPerBlock?: number) => {
      append(
        filepath: string,
        input: string | Uint8Array,
        opts?: any,
        callback?: (out: Uint8Array) => any,
      ): Uint8Array;
      clear(): void;
      // After appending, `out` holds the complete raw .tar as a Uint8Array
      out: Uint8Array;
      written: number;
    } = TarModule.default || TarModule;
    //

    // ──────── 2b. Dynamically import gzip from fflate’s ESM/browser build ────────
    // @ts-ignore
    const fflateModule: any = await import("fflate");
    const {
      gzip,
    }: {
      gzip: (
        data: Uint8Array,
        opts: { level: number },
        cb: (err: Error | null, result: Uint8Array) => void,
      ) => void;
    } = fflateModule;
    //

    // ─────────────────── 3. Build the raw .tar with tar-js ───────────────────
    const tarWriter = new Tar();
    for (const { filename: name, content: textContent } of payload.files) {
      // UTF-8 encode each string → Uint8Array
      const dataBytes = stringToUint8Array(textContent);
      // Append a file entry: path `name` + data `dataBytes`
      tarWriter.append(name, dataBytes);
    }
    // After appending all files, tarWriter.out is a Uint8Array of the raw .tar archive
    const tarBytes: Uint8Array = tarWriter.out;
    //

    // ──────────────────── 4. Gzip the raw .tar → get a Uint8Array for .tgz ────────────────────
    const tgzBytes: Uint8Array = await new Promise<Uint8Array>(
      (resolve, reject) => {
        gzip(
          tarBytes,
          { level: 6 },
          (err: Error | null, compressed: Uint8Array) => {
            if (err) reject(err);
            else resolve(compressed);
          },
        );
      },
    );
    //

    return tgzBytes;
  }

  const { data } = $props();

  const originalPackageId = data.packageid;
  // const packageData = data.packageData;
  let result: string = $state("");
  let loading: boolean = $state(false);
  let openDialog = $state(false);
  let loadingDialog = $state(false);

  let entriesLocal: any[] = [];
  let fileList: string[] = $state([]);
  // build a nested file tree for rendering nested folders
  // include `path` for all nodes
  let fileTree: TreeNode[] = $state([]);
  // Build a nested file tree whenever fileList changes
  $effect(() => {
    const tree: TreeNode[] = [];
    for (const path of fileList) {
      const parts = path.split("/");
      let nodes = tree;
      parts.forEach((part, i) => {
        let node = nodes.find((n) => n.name === part);
        if (!node) {
          const nodePath = parts.slice(0, i + 1).join("/");
          node = { name: part, path: nodePath, level: i } as TreeNode;
          if (i === parts.length - 1) {
            node.fullName = path;
          } else {
            node.children = [];
          }
          nodes.push(node);
        }
        if (node.children) {
          nodes = node.children;
        }
      });
    }
    fileTree = tree;
  });
  let code: string = $state("");
  let language: string = $state("");
  // track current file and modifications
  let currentFileName: string = $state("");
  let modifiedFiles: Record<string, string> = {};
  // let modifiedList = $derived(() => Object.keys(modifiedFiles));
  const textEncoder = new TextEncoder();
  let openAddFileDialog: boolean = $state(false);
  let showDeleteFileWarning: boolean = $state(false);

  // Type for file tree nodes
  type TreeNode = {
    name: string;
    path: string;
    fullName?: string;
    children?: TreeNode[];
    level: number;
  };

  // map file extension to monaco language
  function getLanguageFromExt(ext: string) {
    switch (ext.toLowerCase()) {
      case "js":
      case "jsx":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "json":
        return "json";
      case "html":
        return "html";
      case "css":
        return "css";
      case "scss":
        return "scss";
      case "md":
        return "markdown";
      case "py":
        return "python";
      case "php":
        return "php";
      default:
        return "plaintext";
    }
  }

  function loadFile(name: string) {
    const entry = entriesLocal.find((e: any) => e.name === name);
    if (!entry) return;
    const bytes = new Uint8Array(entry.buffer);
    code = new TextDecoder().decode(bytes);
    const ext = name.split(".").pop() || "";
    if (name.endsWith("Dockerfile")) {
      language = "dockerfile";
    } else {
      language = getLanguageFromExt(ext);
    }
    currentFileName = name;
  }

  function handleEditorChange(updatedCode: string) {
    if (!currentFileName) return;
    modifiedFiles[currentFileName] = updatedCode;
    const entry = entriesLocal.find((e: any) => e.name === currentFileName);
    if (entry) {
      entry.buffer = textEncoder.encode(updatedCode).buffer;
    }
  }

  async function unpackPackageFiles() {
    try {
      let packageData = await auth.client.FindOne<any>({
        collectionname: "agents",
        query: { _id: originalPackageId, _type: "package" },
        jwt: auth.access_token,
      });
      const item: any = await auth.client.FindOne({
        collectionname: "files",
        query: { _id: packageData.fileid },
        jwt: auth.access_token,
      });

      const filecontent: any = await auth.client.DownloadFile({
        id: item._id,
        jwt: auth.access_token,
      });

      const blob = new Blob([filecontent], { type: item.contentType });
      const arrayBuffer = await blob.arrayBuffer();
      const binaryData = new Uint8Array(arrayBuffer);
      const decompressedTarData = pako.ungzip(binaryData);
      const entries = await unpack(decompressedTarData.buffer);

      entriesLocal = entries;
      fileList = entries.map((e: any) => e.name);
    } catch (error: any) {
      console.error("Error downloading or decompressing file:", error);
      toast.error("Error downloading file", {
        description: error.message,
      });
      return [];
    }
  }

  async function getSlug(packageJson: any) {
    if (packageJson.openiap) {
      if (!packageJson.openiap.slug) {
        if (
          packageJson.openiap.slug == "" ||
          packageJson.openiap.slug == null
        ) {
          throw new Error("Slug cannot be null or empty in package.json");
        }
        throw new Error("Slug not found in package.json");
      } else {
        return packageJson.openiap.slug;
      }
    } else {
      throw new Error("Openiap object not found in package.json");
    }
  }
  async function repackandUpload() {
    loading = true;
    Object.entries(modifiedFiles).forEach(([name, content]) => {
      const entry = entriesLocal.find((e) => e.name === name);
      if (entry) entry.buffer = textEncoder.encode(content).buffer;
    });
    try {
      const oldfileid = data.packageData.fileid;
      let packageData: any = data.packageData;
      let newfilename = data.packageData.name + ".tgz";
      //  remove special characters from filename and make it lowercase
      newfilename = newfilename.replace(/[^a-zA-Z0-9-_\.]/g, "-").toLowerCase();

      // upload new tgz file
      let files = entriesLocal.map((entry: any) => {
        return {
          filename: entry.name,
          content: new TextDecoder().decode(entry.buffer),
        };
      });
      const body = {
        filename: newfilename,
        files,
        jwt: data.access_token,
      };
      let uploadedfileid;
      try {
        const newfiledata = await createTgzFromPayload(body);
        uploadedfileid = await auth.client.UploadFile(
          newfilename,
          "application/gzip",
          newfiledata,
          data.access_token,
        );
      } catch (error: any) {
        console.error("Error preparing files for upload:", error);
        toast.error("Error preparing files for upload", {
          description: error.message,
        });
        return;
      }
      // upload new tgz file

      // ensure package dataslug
      packageData.fileid = uploadedfileid;

      let uploadedpackagedata: any = await auth.client.CustomCommand({
        command: "ensurepackage",
        data: packageData,
        jwt: auth.access_token,
      });
      uploadedpackagedata = JSON.parse(uploadedpackagedata);
      // ensure package data

      // delete old file move to
      if (oldfileid) {
        await auth.client.DeleteOne({
          collectionname: "fs.files",
          id: oldfileid,
          jwt: auth.access_token,
        });
      }

      data.packageData = uploadedpackagedata;

      // write new slug to packagejson file
      // if (uploadedpackagedata.slug) {
      //   packageJson.openiap.slug = uploadedpackagedata.slug;
      //   packageJsonEntry.buffer = textEncoder.encode(
      //     JSON.stringify(packageJson, null, 2),
      //   ).buffer;
      // }

      toast.success("Package uploaded successfully", {
        description: `File ID: ${uploadedfileid}`,
      });
    } catch (error: any) {
      console.error("Error uploading package:", error);
      toast.error("Error uploading package", {
        description: error.message,
      });
    }
    loading = false;
  }
  async function buildpackage() {
    loading = true;
    openDialog = true;
    loadingDialog = true;
    result = "";

    let workspaceid = usersettings.currentworkspace;

    if (workspaceid == null || workspaceid == "") {
      if (workspaceid == "" || workspaceid == null) {
        toast.error("Error", {
          description: "Please select a workspace",
        });
        return;
      }
    }

    let queuename = "";
    try {
      let packageData = await auth.client.FindOne<any>({
        collectionname: "agents",
        query: { _id: originalPackageId, _type: "package" },
        jwt: auth.access_token,
      });
      console.log("Package data for build:", packageData);
      if (!packageData) {
        throw new Error("Package not found");
      }

      queuename = await auth.client.RegisterQueue(
        { queuename: "", jwt: data.access_token },
        (msg, payload, user, jwt) => {
          if (payload.logs != null) {
            if (!payload.logs.endsWith("\n")) {
              payload.logs += "\n";
            }
            result = payload.logs + result;
          }
          // const chatContainer = document.getElementById("chatcontainer");
          // if (chatContainer) {
          //   chatContainer.scrollTop = chatContainer.scrollHeight;
          // }
        },
      );

      let correlation_id = Math.random().toString(36).substring(2, 11);
      const build_result = await auth.client.QueueMessage(
        {
          queuename: "sfbuilder",
          data: {
            command: "build",
            packageid: packageData._id,
            workspaceid,
            anonymous: true,
            correlation_id: correlation_id,
            queuename,
          },
          jwt: auth.access_token,
        },
        true,
      );
      if (build_result.success == false) {
        result =
          "Error Building package: " + build_result.result + "\n" + result;
        throw new Error("Error Building package: " + build_result.result);
      }
      result =
        "Image build successfully in " +
        build_result.timetaken +
        " seconds\n" +
        result;
    } catch (error: any) {
      loading = false;
      loadingDialog = false;
      console.error("Building package:", error.message);
      throw new Error("Building package: " + error.message);
    } finally {
      loading = false;
      loadingDialog = false;
      if (queuename != "" && queuename != null) {
        auth.client.UnRegisterQueue({ queuename, jwt: auth.access_token });
      }
    }
    loading = false;
    loadingDialog = false;
  }
  unpackPackageFiles();
  function handleAcceptDeleteFile() {
    let name = currentFileName;
    // Handle the deletion of the file
    // Delete the file from entriesLocal and fileList
    entriesLocal = entriesLocal.filter((e: any) => e.name !== name);
    fileList = fileList.filter((f) => f !== name);
    // If the current file is deleted, reset code and language
    code = "";
    language = "plaintext";
    currentFileName = "";
    toast.success(`File ${name} deleted successfully`);
  }

  // Rename a file or folder
  function handleRename(oldPath: string, newName: string) {
    const segments = oldPath.split("/");
    segments[segments.length - 1] = newName;
    const newPath = segments.join("/");
    // update the underlying entries
    entriesLocal = entriesLocal.map((e: any) =>
      e.name === oldPath ? { ...e, name: newPath } : e,
    );
    // update file list to reflect entriesLocal
    fileList = entriesLocal.map((e: any) => e.name);
    // if currently opened file was renamed, update selection
    if (currentFileName === oldPath) {
      currentFileName = newPath;
    }
    toast.success(`Renamed ${oldPath} to ${newPath}`);
  }
</script>

<div
  class="md:flex md:items-start md:justify-between md:h-full md:overflow-auto"
>
  <div
    class="md:h-full flex-shrink-0 p-4 bg-bw200 dark:bg-bw850 border dark:border-bw600 rounded-[10px]"
  >
    <div
      class="space-y-2 max-h-[500px] md:max-h-full md:h-full overflow-auto md:w-[240px] xl:w-[340px]"
    >
      <!-- Use recursive component to render nested file/folder tree -->
      <FileTreeNode
        nodes={fileTree}
        onDelete={(path) => {
          showDeleteFileWarning = true;
          currentFileName = path;
        }}
        onEdit={(path) => loadFile(path)}
        onRename={handleRename}
        currentPath={currentFileName}
      />
      <HotkeyButton
        title="Create new file"
        aria-label="Create new file"
        class="w-full"
        size="sm"
        onclick={() => {
          currentFileName = "";
          code = "";
          openAddFileDialog = true;
        }}
      >
        <PlusIcon class="inline mr-1" />
        Create New file</HotkeyButton
      >
    </div>
  </div>
  <div class="block md:hidden my-10">
    <Hotkeybutton
      aria-label="Pack and upload"
      title="Pack and upload"
      disabled={loading}
      variant="success"
      class="w-fit"
      onclick={() => repackandUpload()}>Pack and upload</Hotkeybutton
    >
  </div>
  <div
    class="md:flex md:flex-col md:h-full md:w-full md:overflow-auto xl:ms-2 md:ps-2 md:pe-1 h-fit"
  >
    <div
      class="p-4 bg-bw200 dark:bg-bw850 border dark:border-bw600 rounded-[10px] md:h-full md:overflow-auto"
    >
      <!-- file name with path of the file we are editing -->
      <h3 class="text-lg font-semibold text-bw900 dark:text-bw100 mb-2">
        {currentFileName || "No file selected"}
      </h3>
      {#if currentFileName}
        <MonacoEditor
          {code}
          {language}
          on:change={(e) => handleEditorChange(e.detail.code)}
        />
      {/if}
    </div>
  </div>
  {#if isSfUser}
    <div class="block md:hidden">
      <div class="my-10 pb-10 gap-4 grid grid-cols-2">
        <Hotkeybutton
          aria-label="Build and deploy to serverless"
          title="Build and deploy to serverless"
          disabled={loading}
          variant="success"
          class="w-fit col-span-2"
          onclick={() => buildpackage()}
          >Build and deploy to serverless</Hotkeybutton
        >
        <Hotkeybutton
          aria-label="Open in browser"
          title="Open in browser"
          disabled={loading}
          class="w-fit"
          onclick={() => {
            window.open(
              auth.fnurl(data.packageData.slug || data.packageData.name),
              "_blank",
            );
          }}>Open in browser</Hotkeybutton
        >
        <Hotkeybutton
          aria-label="Show logs"
          title="Show logs"
          disabled={!result}
          class="w-fit"
          onclick={() => {
            openDialog = true;
          }}>Show logs</Hotkeybutton
        >
      </div>
    </div>
  {/if}
</div>

<div class="hidden md:block">
  <div
    class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:flex lg:items-end lg:justify-between mt-4"
  >
    <div class="lg:flex lg:justify-end lg:items-end lg:w-[240px] xl:w-[370px]">
      <Hotkeybutton
        aria-label="Pack and upload"
        title="Pack and upload"
        disabled={loading}
        variant="success"
        class="w-fit"
        onclick={() => repackandUpload()}>Pack and upload</Hotkeybutton
      >
    </div>
    {#if isSfUser}
      <div
        class="grid grid-cols-1 mt-4 lg:mt-0 lg:flex justify-end items-end gap-4 auto-rows-max"
      >
        <Hotkeybutton
          aria-label="Build and deploy to serverless"
          title="Build and deploy to serverless"
          disabled={loading}
          variant="success"
          class="w-fit"
          onclick={() => buildpackage()}
          >Build and deploy to serverless</Hotkeybutton
        >
        <Hotkeybutton
          aria-label="Open in browser"
          title="Open in browser"
          disabled={loading}
          class="w-fit"
          onclick={() => {
            window.open(
              auth.fnurl(data.packageData.slug || data.packageData.name),
              "_blank",
            );
          }}>Open in browser</Hotkeybutton
        >
        <Hotkeybutton
          aria-label="Show logs"
          title="Show logs"
          disabled={!result}
          class="w-fit"
          onclick={() => {
            openDialog = true;
          }}>Show logs</Hotkeybutton
        >
      </div>
    {/if}
  </div>
</div>

<AlertDialog.Root bind:open={openAddFileDialog}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Create new file</AlertDialog.Title>
      <AlertDialog.Description class="h-fit w-full">
        <div class="">
          <Custominput
            size="md"
            label="File name"
            placeholder="Enter file name (e.g., newfile.js)"
            bind:value={currentFileName}
            class="my-4"
            width="w-full"
          />
        </div>
        <div>
          *Note: For the creation of a file inside a folder, please use the
          format <code>foldername/filename.ext</code>. <br />
          If the folder does not exist, it will be created automatically.
          <br />
        </div>
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <HotkeyButton
        aria-label="Create file"
        title="Create file"
        data-shortcut="enter"
        disabled={!currentFileName}
        variant="success"
        class="w-fit mt-6"
        onclick={() => {
          if (!currentFileName) {
            toast.error("Please enter a file name");
            return;
          }
          if (fileList.includes(currentFileName)) {
            toast.error("File already exists");
            return;
          }
          // create folders
          // // check to see if file has extension
          // if (!currentFileName.includes(".")) {
          //   toast.error("Please include a file extension (e.g., .js)");
          //   return;
          // }
          const newEntry = {
            name: currentFileName,
            buffer: textEncoder.encode(" ").buffer,
          };
          entriesLocal.push(newEntry);
          fileList.push(currentFileName);
          loadFile(currentFileName);
          openAddFileDialog = false;
        }}>Create File</HotkeyButton
      >
      <HotkeyButton
        aria-label="Close dialog"
        title="Close dialog"
        disabled={loadingDialog}
        variant="danger"
        class="w-fit mt-6"
        onclick={() => {
          openAddFileDialog = false;
        }}>Close</HotkeyButton
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={openDialog}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Server logs</AlertDialog.Title>
      <AlertDialog.Description class="h-fit w-full">
        <div class="overflow-auto max-h-[60vh] max-w-[100vh]">
          {#if loading}
            <div class="mt-4 p-4 rounded dark:bg-bw500">
              <p class="text-bw900">Processing...</p>
            </div>
          {:else}
            <div class="mt-4 p-4 bg-gray-100 rounded dark:bg-bw500">
              <p class="text-bw900">Completed</p>
              <p></p>
            </div>
          {/if}

          {#if result}
            <div class="mt-4 p-4 bg-gray-100 rounded dark:bg-bw500">
              <pre class="text-sm text-bw900 whitespace-pre-wrap">{result}</pre>
            </div>
          {/if}
        </div>
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <Hotkeybutton
        aria-label="Open in browser"
        title="Open in browser"
        disabled={loadingDialog}
        variant="success"
        class="w-fit mt-10"
        onclick={() => {
          window.open(
            auth.fnurl(data.packageData.slug || data.packageData.name),
            "_blank",
          );
        }}>Open in browser</Hotkeybutton
      >
      <HotkeyButton
        aria-label="Close dialog"
        title="Close dialog"
        disabled={loadingDialog}
        variant="danger"
        class="w-fit mt-10"
        onclick={() => {
          openDialog = false;
        }}>Close</HotkeyButton
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<Warningdialogue
  bind:showWarning={showDeleteFileWarning}
  type="delete"
  onaccept={handleAcceptDeleteFile}
></Warningdialogue>

<CustomSuperDebug formData={data.packageData} />
