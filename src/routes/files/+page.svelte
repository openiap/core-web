<script lang="ts" module>
  export let page = "files";
  export let collectionname = "fs.files";
  export let query = {};
</script>

<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Download, Pencil, Trash2 } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { data as data1 } from "$lib/entities/data.svelte.js";

  let { data } = $props();
  import Button from "$lib/components/ui/button/button.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Input from "$lib/components/ui/input/input.svelte";

  let searchstring = $state(data.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let loading = $state(false);
  let fileData: File | null = $state(null);

  async function deleteitem(item: any) {
    const deletecount = await auth.client.DeleteOne({
      id: item._id,
      collectionname,
      jwt: auth.access_token,
    });
    if (deletecount == 1) {
      entities = entities.filter((entity: any) => entity._id != item._id);
    } else {
      console.error(Error("deletecount is " + deletecount));
    }
  }
  function deleteitems(ids: string[]) {}
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }

  function handleChange(e: any) {
    loading = true;
    const files = e.target.files;
    fileData = files[0];
    console.log("fileData", fileData);
    loading = false;
  }

  async function uploadFile() {
    loading = true;
    const reader = new FileReader();
    if (fileData) {
      reader.onload = async function () {
        if (fileData) {
          const content = new Uint8Array(reader.result as ArrayBuffer);
          var name = fileData.name;
          var type = fileData.type;
          var id = await auth.client.UploadFile(
            name,
            type,
            content,
            auth.access_token,
          );
          console.log("file " + name + " uploaded with id " + id);
          fileData = null;
          entities = await data1.GetData(page, collectionname, query);
          loading = false;
        }
      };
      reader.readAsArrayBuffer(fileData);
    }
    loading = false;
  }

  async function downloadFile(item: any) {
    console.log("downloadFile", item);
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

      // const img = document.createElement('img');
      // img.src = URL.createObjectURL(
      //   new Blob([filecontent], { type: 'image/png' })
      // );
      // document.body.appendChild(img);
    } catch (error) {
      console.error(error);
    }
  }
</script>

<h1>All {page}</h1>
<div class="flex w-full max-w-sm flex-col gap-1.5">
  <Label for="email">Search</Label>
  <div class="flex gap-1.5">
    <HotkeyInput
      type="text"
      id="searchstring"
      placeholder="Searchstring or JSON query"
      bind:value={searchstring}
      data-shortcut={"Control+f,Meta+f"}
    />
  </div>
</div>

<div>Upload New File</div>
<div class="flex">
  <Input
    disabled={loading}
    type="file"
    bind:value={fileData}
    onchange={handleChange}
  />
  <Button
    disabled={loading || !fileData}
    onclick={() => (fileData = null)}
    aria-label="Delete"
  >
    Delete
  </Button>
  <Button
    disabled={loading || !fileData}
    onclick={uploadFile}
    aria-label="Upload"
  >
    Upload
  </Button>
</div>

<Entities
  {collectionname}
  {query}
  bind:searchstring
  {page}
  delete_selected={deleteitems}
  {single_item_click}
  bind:selected_items
  bind:entities
>
  {#snippet action(item: any)}
    <Button
      title="Delete"
      aria-label="delete"
      onclick={() => deleteitem(item)}
      size="icon"
      variant="destructive"
    >
      <Trash2 />
    </Button>
    <Button
      title="Edit"
      aria-label="edit"
      onclick={() => goto(base + `/entities/${item._id}/edit`)}
      size="icon"
      variant="secondary"
    >
      <Pencil />
    </Button>
    <Button
      onclick={() => downloadFile(item)}
      title="download"
      aria-label="download"
      size="icon"
      variant="secondary"><Download /></Button
    >
  {/snippet}
</Entities>
