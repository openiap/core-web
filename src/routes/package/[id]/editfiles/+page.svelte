<script lang="ts">
  import { browser } from "$app/environment";
  import { base } from "$app/paths";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { MonacoEditor } from "$lib/monacoeditor/index.js";
  import { auth } from "$lib/stores/auth.svelte";
  import * as pako from "pako";
  import { toast } from "svelte-sonner";

  // @ts-ignore
  import unpack from "js-untar";
  import { PencilIcon, PlusIcon, Trash2 } from "lucide-svelte";
  import Custominput from "$lib/custominput/custominput.svelte";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";

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
  ``;
  let loading: boolean = $state(false);
  let openDialog = $state(false);
  let loadingDialog = $state(false);

  let entriesLocal: any[] = [];
  let fileList: string[] = $state([]);
  let code: string = $state("");
  let language: string = $state("plaintext");
  // track current file and modifications
  let currentFileName: string = $state("");
  let modifiedFiles: Record<string, string> = {};
  // let modifiedList = $derived(() => Object.keys(modifiedFiles));
  const textEncoder = new TextEncoder();
  let openAddFileDialog: boolean = $state(false);
  let showDeleteFileWarning: boolean = $state(false);

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
  async function repackandUpload() {
    loading = true;
    Object.entries(modifiedFiles).forEach(([name, content]) => {
      const entry = entriesLocal.find((e) => e.name === name);
      if (entry) entry.buffer = textEncoder.encode(content).buffer;
    });
    try {
      let packageData = await auth.client.FindOne<any>({
        collectionname: "agents",
        query: { _id: originalPackageId, _type: "package" },
        jwt: auth.access_token,
      });
      let item = await auth.client.FindOne<any>({
        collectionname: "files",
        query: { _id: packageData.fileid },
        jwt: auth.access_token,
      });
      let name = item.filename;
      const packageJsonEntry = fileList.find(
        (filename: any) => filename == "package/package.json",
      );
      if (packageJsonEntry) {
        const entry = entriesLocal.find(
          (e: any) => e.name === "package/package.json",
        );
        if (!entry) return;
        const packageJson = JSON.parse(new TextDecoder().decode(entry.buffer));
        const versionParts = packageJson.version.split(".");
        versionParts[versionParts.length - 1] = (
          parseInt(versionParts[versionParts.length - 1]) + 1
        ).toString();
        packageJson.version = versionParts.join(".");
        entry.buffer = textEncoder.encode(
          JSON.stringify(packageJson, null, 2),
        ).buffer;
        name = `${name.split("-")[0]}-${packageJson.version}.tgz`;
      }
      console.log("Packing files with name:", name);

      let files = entriesLocal.map((entry: any) => {
        return {
          filename: entry.name,
          content: new TextDecoder().decode(entry.buffer),
        };
      });

      const body = {
        filename: name,
        files,
        jwt: data.access_token,
      };
      let uploadfileid;
      try {
        console.log("Preparing files for upload:", base + "/api/create-tgz");
        console.log("using body:", JSON.stringify(body));
        // const res = await fetch(base + "/api/create-tgz", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(body),
        // });
        // if (!res.ok) {
        //   const errorText = await res.text();
        //   throw new Error(`Failed to prepare files for upload: ${errorText}`);
        // }
        // uploadfileid = (await res.text()).replace('"', "").replace('"', "");

        const filedata = await createTgzFromPayload(body);
        uploadfileid = await auth.client.UploadFile(
          name,
          "application/gzip",
          filedata,
          data.access_token,
        );

        console.log("Created tgz data:", data);
      } catch (error: any) {
        console.error("Error preparing files for upload:", error);
        toast.error("Error preparing files for upload", {
          description: error.message,
        });
        return;
      }

      let originalPackage = await auth.client.FindOne<any>({
        collectionname: "agents",
        query: { _id: originalPackageId, _type: "package" },
        jwt: auth.access_token,
      });

      const oldfileid = originalPackage.fileid;

      originalPackage.fileid = uploadfileid;
      originalPackage = await auth.client.UpdateOne({
        item: originalPackage,
        collectionname: "agents",
        jwt: auth.access_token,
      });
      data.packageData = originalPackage;
      await auth.client.DeleteOne({
        collectionname: "fs.files",
        id: oldfileid,
        jwt: auth.access_token,
      });

      toast.success("Package uploaded successfully", {
        description: `File ID: ${uploadfileid}`,
      });
      // goto(base + `/package/${originalPackageId}`);
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
    let queuename = await auth.client.RegisterQueue(
      { queuename: "", jwt: data.access_token },
      (msg, payload, user, jwt) => {
        console.log("Message received:", payload);
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
    console.log("RegisterQueue", queuename);
    let correlation_id = Math.random().toString(36).substring(2, 11);
    try {
      const build_result = await auth.client.QueueMessage(
        {
          queuename: "fcbuilder",
          data: {
            command: "build",
            packageid: originalPackageId,
            correlation_id: correlation_id,
            queuename,
          },
        },
        true,
      );
      console.log("build_result", build_result);
      if (build_result.success == false) {
        result =
          "Error Building package: " + build_result.result + "\n" + result;
        throw new Error("Error Building package: " + build_result.result);
      }
      result =
        "Image build successfully in " +
        build_result.timetaken +
        " seconds, starting agent\n" +
        result;
    } catch (error: any) {
      loading = false;
      loadingDialog = false;
      console.error("Building package:", error.message);
      throw new Error("Building package: " + error.message);
    } finally {
      loading = false;
      loadingDialog = false;
      console.log("Unregistering queue:", queuename);
      auth.client.UnRegisterQueue({ queuename, jwt: auth.access_token });
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
    // if (currentFileName === name) {
    code = "";
    language = "plaintext";
    currentFileName = "";
    // }
    toast.success(`File ${name} deleted successfully`);
  }
</script>

<div class="grid grid-cols-1 lg:grid-cols-4 lg:h-[calc(100vh-4rem)] gap-4">
  <div
    class="p-4 bg-bw200 dark:bg-bw850 border dark:border-bw600 rounded-[10px] lg:col-span-1 overflow-auto"
  >
    <div class="space-y-2 w-full">
      {#each fileList as name}
        <div class="flex items-center justify-between w-full text-sm">
          <span class="flex-1">{name}</span>
          <HotkeyButton
            class="mx-2"
            size="icon"
            variant="danger"
            onclick={() => {
              showDeleteFileWarning = true;
              currentFileName = name;
            }}
          >
            <Trash2 /></HotkeyButton
          >
          <HotkeyButton
            size="icon"
            onclick={() => {
              loadFile(name);
            }}
          >
            <PencilIcon /></HotkeyButton
          >
        </div>
      {/each}
      <HotkeyButton
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

  <div class="lg:col-span-3">
    {#if code}
      <MonacoEditor
        {code}
        {language}
        on:change={(e) => handleEditorChange(e.detail.code)}
      />
    {:else}
      <div
        class="h-screen md:h-full w-full bg-bw200 dark:bg-bw850 border dark:border-bw600 rounded-[10px] overflow-hidden"
      >
        <p class="text-gray-500 p-4">Select a file to edit</p>
      </div>
    {/if}
  </div>
</div>

<div
  class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 rounded"
>
  <div class="col-span-1 flex justify-end items-end me-4">
    <Hotkeybutton
      disabled={loading}
      variant="success"
      class="w-fit mt-10"
      onclick={() => repackandUpload()}>Pack and upload</Hotkeybutton
    >
  </div>
  <div class="col-span-3 flex justify-end items-end gap-4">
    <Hotkeybutton
      disabled={loading}
      class="w-fit mt-10"
      onclick={() => {
        window.open(
          auth.fnurl(data.packageData.slug || data.packageData.name),
          "_blank",
        );
      }}>Open in browser</Hotkeybutton
    >
    <Hotkeybutton
      disabled={!result}
      class="w-fit mt-10"
      onclick={() => {
        openDialog = true;
      }}>Show logs</Hotkeybutton
    >
    <Hotkeybutton
      disabled={loading}
      variant="success"
      class="w-fit mt-10"
      onclick={() => buildpackage()}
      >Build and deploy to serverless</Hotkeybutton
    >
    
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
        <div class="overflow-y-auto max-h-[60vh] max-w-[100vh]">
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
