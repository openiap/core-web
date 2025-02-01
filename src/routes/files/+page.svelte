<script lang="ts" module>
  export let page = "files";
  export let collectionname = "fs.files";
  export let query = {};
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomInput } from "$lib/custominput";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { Download, Pencil, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let ref: any;
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let loading = $state(false);
  let fileData: File | null = $state(null);
  let showWarning = $state(false);
  let deleteData: any = $state({});

  async function deleteitem(item: any) {
    const deletecount = await auth.client.DeleteOne({
      id: item._id,
      collectionname,
      jwt: auth.access_token,
    });
    if (deletecount == 1) {
      selected_items = selected_items.filter((i) => i !== item._id);
      ref.reload();
    } else {
      toast.error("Error while deleting", {
        description: "Error while deleting",
      });
    }
  }
  function single_item_click(item: any) {
    goto(base + `/entities/fs.files/${item._id}`);
  }

  function handleChange(e: any) {
    loading = true;
    const files = e.target.files;
    fileData = files[0];
    loading = false;
  }

  async function uploadFile() {
    loading = true;
    const reader = new FileReader();
    try {
      if (fileData) {
        reader.onload = async function () {
          if (fileData) {
            const content = new Uint8Array(reader.result as ArrayBuffer);
            var name = fileData.name;
            var type = fileData.type;
            await auth.client.UploadFile(
              name,
              type,
              content,
              auth.access_token,
            );
            toast.success("Uploaded successfully", {
              description: "",
            });
            fileData = null;
            ref.reload();
            toast.success("Saved in the database successfully", {
              description: "",
            });
          }
        };
        reader.readAsArrayBuffer(fileData);
      }
    } catch (error: any) {
      toast.error("Error while uploading", {
        description: error.message,
      });
    }

    loading = false;
  }

  async function downloadFile(item: any) {
    try {
      var filecontent: any = await auth.client.DownloadFile({
        id: item._id,
        jwt: auth.access_token,
      });
      var blob = new Blob([filecontent], { type: item.contentType });
      var link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = item.name || item.metadata.name;
      link.click();
    } catch (error: any) {
      toast.error("Error while downloading", {
        description: error.message,
      });
    }
  }
  async function handleAccept() {
    try {
      await deleteitem(deleteData);
      toast.success("Deleted successfully", {
        description: "",
      });
      ref.reload();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
</script>

<div class="flex justify-between">
  <div class="flex gap-2 w-full">
    <SearchInput bind:searchstring />
  </div>
  <div class="flex space-x-5">
    <CustomInput
      height="h-7"
      disabled={loading}
      type="file"
      bind:value={fileData}
      onchangefunction={handleChange}
    />
    <HotkeyButton
      size="sm"
      disabled={loading || !fileData}
      onclick={uploadFile}
      aria-label="Upload"
    >
      Upload
    </HotkeyButton>
  </div>
</div>

<Entities
  {collectionname}
  {query}
  bind:searchstring
  {page}
  {single_item_click}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
  bind:this={ref}
>
  {#snippet action(item: any)}
    <HotkeyButton
      onclick={() => downloadFile(item)}
      title="download"
      aria-label="download"
      size="tableicon"
      variant="icon"><Download /></HotkeyButton
    >
    <HotkeyButton
      title="Edit"
      aria-label="edit"
      onclick={() => single_item_click(item)}
      size="tableicon"
      variant="icon"
    >
      <Pencil />
    </HotkeyButton>

    <HotkeyButton
      title="Delete"
      aria-label="delete"
      onclick={() => {
        deleteData = item;
        showWarning = !showWarning;
      }}
      size="tableicon"
      variant="danger"
    >
      <Trash2 />
    </HotkeyButton>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
