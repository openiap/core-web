<script lang="ts">
  import MonacoEditor from "$lib/monacoeditor/monacoeditor.svelte";
  import { auth } from "$lib/stores/auth.svelte";
  import { toast } from "svelte-sonner";
  import * as pako from 'pako';
  // @ts-ignore
  import unpack from 'js-untar';

  // store all unpacked entries
  let entriesLocal: any[] = [];
  // file list names
  let fileList: string[] = [];
  // code and language for editor
  let code: string = '';
  let language: string = 'plaintext';

  // map file extension to monaco language
  function getLanguageFromExt(ext: string) {
    switch (ext.toLowerCase()) {
      case 'js': case 'jsx': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'json': return 'json';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'scss': return 'scss';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  }

  // load selected file into editor
  function loadFile(name: string) {
    const entry = entriesLocal.find((e: any) => e.name === name);
    if (!entry) return;
    // assume entry.buffer is ArrayBuffer of file
    const bytes = new Uint8Array(entry.buffer);
    code = new TextDecoder().decode(bytes);
    const ext = name.split('.').pop() || '';
    language = getLanguageFromExt(ext);
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
     console.log("Blob created:", blob);

     const arrayBuffer = await blob.arrayBuffer();
     console.log("arrayBuffer created:", arrayBuffer);

     // Convert to Uint8Array (assuming filecontent is ArrayBuffer or binary)
     const binaryData = new Uint8Array(arrayBuffer);
     console.log("Binary data length:", binaryData.length);

     // Decompress gzip to Uint8Array of tar archive
     const decompressedTarData = pako.ungzip(binaryData);
     console.log("Decompressed Uint8Array:", decompressedTarData);

     // Unpack the tar entries
     const entries = await unpack(decompressedTarData.buffer);
     entriesLocal = entries;
     fileList = entries.map((e: any) => e.name);
     console.log("File list:", fileList);
     
   } catch (error: any) {
     console.error("Error downloading or decompressing file:", error);
     toast.error("Error downloading file", {
       description: error.message,
     });
     return [];
   }
 }
   getPackageFiles("6836ce5dd67669abdcc41361");

 </script>

{#if code}
  <MonacoEditor {code} {language} />
{:else}
  <p class="text-gray-500 px-4">Select a file to edit</p>
{/if}

<div class="p-4 bg-gray-100 rounded">
  <ul class="space-y-1">
    {#each fileList as name}
      <li class="flex items-center text-sm text-gray-800">
        <span class="flex-1">{name}</span>
        <button
          on:click={() => loadFile(name)}
          class="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Edit
        </button>
      </li>
    {/each}
  </ul>
</div>
