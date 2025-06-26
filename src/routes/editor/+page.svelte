<!-- <script lang="ts">
  import MonacoEditor from "$lib/monacoeditor/monacoeditor.svelte";
  import { auth } from "$lib/stores/auth.svelte";
  import * as pako from "pako";
  import { toast } from "svelte-sonner";
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  // @ts-ignore
  import unpack from "js-untar";

  const packageid = "6838522ad67669abdcc415ed"; // example package ID
  // store all unpacked entries
  let entriesLocal: any[] = [];
  // file list names
  let fileList: string[] = [];
  // code and language for editor
  let code: string = "";
  let language: string = "plaintext";
  // track current file and modifications
  let currentFileName: string = "";
  let modifiedFiles: Record<string, string> = {};
  let showModifiedList: boolean = false;
  $: modifiedList = Object.keys(modifiedFiles);
  const textEncoder = new TextEncoder();

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
      default:
        return "plaintext";
    }
  }

  // load selected file into editor
  function loadFile(name: string) {
    const entry = entriesLocal.find((e: any) => e.name === name);
    if (!entry) return;
    // assume entry.buffer is ArrayBuffer of file
    const bytes = new Uint8Array(entry.buffer);
    code = new TextDecoder().decode(bytes);
    const ext = name.split(".").pop() || "";
    if (name === "dockerfile") {
      language = "dockerfile";
    } else {
      language = getLanguageFromExt(ext);
    }
    // set current file for tracking
    currentFileName = name;
  }

  // handle content changes from editor
  function handleEditorChange(updatedCode: string) {
    if (!currentFileName) return;
    // record updated content
    modifiedFiles[currentFileName] = updatedCode;
    // update buffer in entriesLocal
    const entry = entriesLocal.find((e: any) => e.name === currentFileName);
    if (entry) {
      entry.buffer = textEncoder.encode(updatedCode).buffer;
    }
  }

  async function getPackageFiles(packageid: string) {
    try {
      const item: any = await auth.client.FindOne({
        collectionname: "files",
        query: { _id: packageid },
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
  async function repackandUpload(packageid: string) {
    // merge in any unsaved edits before repacking
    Object.entries(modifiedFiles).forEach(([name, content]) => {
      const entry = entriesLocal.find((e) => e.name === name);
      if (entry) entry.buffer = textEncoder.encode(content).buffer;
    });
    showModifiedList = true;
    try {
      // fetch original file metadata for name and type
      const item: any = await auth.client.FindOne({
        collectionname: "files",
        query: { _id: packageid },
        jwt: auth.access_token,
      });
      let name = item.filename;

      // before packing the files we need to update the version in package.json file inside the original package and also update the let name to include the version
      const packageJsonEntry = fileList.find(
        (filename: any) => filename == "package/package.json",
      );
      if (packageJsonEntry) {
        const entry = entriesLocal.find((e: any) => e.name === "package/package.json");
        if (!entry) return;
        const packageJson = JSON.parse(
          new TextDecoder().decode(entry.buffer),
        );
        // increment version
        const versionParts = packageJson.version.split(".");
        versionParts[versionParts.length - 1] = (
          parseInt(versionParts[versionParts.length - 1]) + 1
        ).toString();
        packageJson.version = versionParts.join(".");
        // update the entry buffer with new package.json content
        entry.buffer = textEncoder.encode(
          JSON.stringify(packageJson, null, 2),
        ).buffer;
        // update name to include version
        name = `${name.split("-")[0]}-${packageJson.version}.tgz`;
      }
      // use original file metadata for upload
      
      const type = item.contentType;
      
      const compressed = pako.deflate(JSON.stringify(entriesLocal));

      // pack modified entries back into tar and gzip
      // const tarData: Uint8Array = await pack(entriesLocal);

      const compressedData: Uint8Array = pako.gzip(compressed);

      // upload the new package using Uint8Array directly
      const uploadResult: any = await auth.client.UploadFile(
        name,
        type,
        compressedData,
        auth.access_token,
      );

      // find all pacakages where fileid is packageid and update it with the new fileid
      let oldPackage: object = await auth.client.FindOne({
        collectionname: "agents",
        query: { fileid: packageid, _type: "package" },
        jwt: auth.access_token,
      });
      oldPackage.fileid = uploadResult;
      await auth.client.UpdateOne({
        item: oldPackage,
        collectionname: "agents",
        update: oldPackage,
        jwt: auth.access_token,
      });

      toast.success("Package uploaded successfully", {
        description: `File ID: ${uploadResult}`,
      })
    } catch (error: any) {
      console.error("Error uploading package:", error);
      toast.error("Error uploading package", {
        description: error.message,
      });
    }
  }
  getPackageFiles(packageid);
</script>

{#if code}
  <MonacoEditor
    {code}
    {language}
    on:change={(e) => handleEditorChange(e.detail.code)}
  />
{:else}
  <p class="text-gray-500 px-4">Select a file to edit</p>
{/if}

<div class="p-4 bg-bw500 rounded">
  <ul class="space-y-1">
    {#each fileList as name}
      <li class="flex items-center text-sm text-gray-800">
        <span class="flex-1">{name}</span>
        <button
          on:click={() => {
            loadFile(name);
          }}
          class="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Edit
        </button>
      </li>
    {/each}
  </ul>
</div>

<Hotkeybutton onclick={() => repackandUpload(packageid)}
  >Pack and upload</Hotkeybutton
>
{#if showModifiedList && modifiedList.length}
  <div class="mt-4 p-4 bg-yellow-100 rounded">
    <p class="font-semibold text-gray-700">
      Modified files ({modifiedList.length}):
    </p>
    <ul class="list-disc list-inside text-gray-800">
      {#each modifiedList as fname}
        <li>{fname}</li>
      {/each}
    </ul>
  </div>
{/if} -->
