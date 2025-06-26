<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import { CustomSuperDebug } from "$lib/customsuperdebug";
  import Monacoeditor from "$lib/monacoeditor/monacoeditor.svelte";
  import FS from "@isomorphic-git/lightning-fs";
  import { Buffer } from "buffer";
  import { toast } from "svelte-sonner";

  const { data } = $props();
  const { id, gittype, access_token, path } = data;
  let commit = $state() as any;
  const pathto = $derived(() => (data.path ? data.path : ""));

  async function getfilecontent() {
    // const url = `https://dev.openiap.io/git/${data.item.repo}`;
    const fs = new FS(data.item.repo.split("/").join("_"));
    const dir = "/test-clone";
    console.log("Before reading file:", dir + "/" + pathto());
    try {
      // Ensure the directory exists
      if (pathto() != null && pathto() != "") {
        // Read raw bytes and decode to string
        const raw = await fs.promises.readFile(dir + "/" + pathto());
        commit = new TextDecoder().decode(raw);
      }
    } catch (error) {
      console.error("Failed to read file:", error);
    }
    console.log("After reading file:", dir + "/" + pathto());
  }

  function getLanguageFromExt(name: string) {
    const ext = name.split(".").pop() || "";
    if (name.endsWith("Dockerfile")) {
      return "dockerfile";
    } else {
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
  }

  // Add a function to save editor changes to the browser DB
  async function saveFile() {
    const fs = new FS(data.item._id);
    const dir = "/test-clone";
    if (pathto() != null && pathto() != "") {
      // Write only the content string (cloneable) to avoid DataCloneError
      try {
        // Encode string into Uint8Array for structured cloning
        const encoder = new TextEncoder();
        const dataBuf = encoder.encode(commit);
        await fs.promises.writeFile(dir + "/" + pathto(), dataBuf);
        toast.success("File saved successfully!");
      } catch (err) {
        toast.error("Failed to save file: " + err);
        console.error("Failed to save file:", err);
      }
    }
  }

  if (browser) {
    getfilecontent();
    if (!window.Buffer) {
      window.Buffer = Buffer;
    }
  }
  $effect(() => {
    if (pathto() != null && pathto() != "") {
      getfilecontent();
    }
  });
</script>

<div class="flex flex-col w-100vh h-full">
  <!-- Save button to persist edits -->
  <div class="mb-2 flex items-center justify-between">
    <!-- current file name with path -->
    <span class="">{pathto()}</span>
    <Hotkeybutton onclick={saveFile} variant="success">Save</Hotkeybutton>
  </div>
  {#key $page.url.pathname}
    <Monacoeditor
      code={commit}
      language={getLanguageFromExt(pathto())}
      on:change={(e) => (commit = e.detail.code)}
    />
  {/key}
</div>

<CustomSuperDebug formData={commit} />
