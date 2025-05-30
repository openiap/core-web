<script lang="ts">
  import { auth } from "$lib/stores/auth.svelte";
  import * as pako from "pako";
  import { toast } from "svelte-sonner";
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  // @ts-ignore
  import unpack from "js-untar";
  import { goto } from "$app/navigation";
  import { MonacoEditor } from "$lib/monacoeditor/index.js";
  import { base } from "$app/paths";

  const { data } = $props();

  const fileid = data.fileid;
  const originalPackageId = data.packageid;
  const fileData = data.item || {};

  // store all unpacked entries
  let entriesLocal: any[] = [];
  // file list names
  let fileList: string[] = $state([]);
  // code and language for editor
  let code: string = $state("");
  let language: string = $state("plaintext");
  // track current file and modifications
  let currentFileName: string = "";
  let modifiedFiles: Record<string, string> = {};
  let showModifiedList: boolean = $state(false);
  let modifiedList = $state(Object.keys(modifiedFiles));
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
      const item: any = await auth.client.FindOne({
        collectionname: "files",
        query: { _id: fileid },
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
    Object.entries(modifiedFiles).forEach(([name, content]) => {
      const entry = entriesLocal.find((e) => e.name === name);
      if (entry) entry.buffer = textEncoder.encode(content).buffer;
    });
    showModifiedList = true;
    try {
      let name = fileData.filename;
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
        jwt: auth.access_token,
      };
      const res = await fetch(base + "/api/create-tgz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const uploadfileid = (await res.text()).replace('"', "").replace('"', "");

      let originalPackage = await auth.client.FindOne<any>({
        collectionname: "agents",
        query: { _id: originalPackageId, _type: "package" },
        jwt: auth.access_token,
      });

      const oldfileid = originalPackage.fileid;
      // await auth.client.DeleteOne({
      //   collectionname: "fs.files",
      //   id: oldfileid,
      //   jwt: auth.access_token,
      // });

      originalPackage.fileid = uploadfileid;
      await auth.client.UpdateOne({
        item: originalPackage,
        collectionname: "agents",
        jwt: auth.access_token,
      });

      toast.success("Package uploaded successfully", {
        description: `File ID: ${uploadfileid}`,
      });
      goto(base + `/package/${originalPackageId}`);
    } catch (error: any) {
      console.error("Error uploading package:", error);
      toast.error("Error uploading package", {
        description: error.message,
      });
    }
  }
  unpackPackageFiles();
</script>

<div class="grid grid-cols-4 h-full">
  <div class="p-4 bg-bw500 rounded col-span-1">
    <ul class="space-y-1">
      {#each fileList as name}
        <li class="flex items-center text-sm text-gray-800">
          <span class="flex-1">{name}</span>
          <button
            onclick={() => {
              loadFile(name);
              console.log("Loading file:", name);
            }}
            class="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit
          </button>
        </li>
      {/each}
    </ul>
  </div>

  <div class="col-span-3">
    {#if code}
      <MonacoEditor
        {code}
        {language}
        on:change={(e) => handleEditorChange(e.detail.code)}
      />
    {:else}
      <p class="text-gray-500 px-4">Select a file to edit</p>
    {/if}
  </div>
</div>

<Hotkeybutton
  variant="success"
  class="w-fit mt-10"
  onclick={() => repackandUpload()}>Pack and upload</Hotkeybutton
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
{/if}
