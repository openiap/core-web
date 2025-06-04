<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import {
      FilePen,
      FolderDown,
      Pencil,
      SquarePlus,
      Trash2
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});

  function single_item_click(item: any) {
    goto(base + `/package/${item._id}`);
  }
  async function handleAccept() {
    try {
      await auth.client.CustomCommand({
        command: "deletepackage",
        id: deleteData._id,
        jwt: auth.access_token,
      });
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
  async function delete_selected(ids: string[]) {
    let haderror = false;
    loading = true;
    showWarning = false;
    let counter = 0;
    try {
      for (let i = 0; i < ids.length; i++) {
        let id = ids[i];
        var item = entities.find((x: any) => x._id == id);
        if (item) {
          try {
            await auth.client.CustomCommand({
              command: "deletepackage",
              id: item._id,
              jwt: auth.access_token,
            });
            counter++;
            selected_items = selected_items.filter((x: any) => x != item._id);
            ref.reload();
          } catch (error: any) {
            haderror = true;
            toast.error("Error while deleting", {
              description: error.message,
            });
            return;
          }
        }
      }
      if (!haderror) {
        selected_items = [];
        toast.success("Successfully deleted " + counter + " agent(s)", {
          description: "",
        });
      }
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }

  async function downloadFile(fileid: string) {
    try {
      const item: any = await auth.client.FindOne({
        collectionname: "files",
        query: { _id: fileid },
        jwt: auth.access_token,
      });
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
      toast.error("Error downloading file", {
        description: error.message,
      });
    }
  }
</script>

<div class="lg:flex space-y-4 lg:space-y-0 justify-between mb-4 lg:space-x-5">
  <SearchInput bind:searchstring />
  <HotkeyButton
    title="Create Package (Insert Key)"
    data-shortcut="ins"
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="Create Package"
    onclick={() => {
      loading = true;
      goto(base + `/package/new`);
    }}
  >
    <SquarePlus />
    Create Package</HotkeyButton
  >
</div>

<Entities
  collectionname={data.collectionname}
  bind:searchstring
  {single_item_click}
  total_count={data.total_count}
  {delete_selected}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet action(item: any)}
    <HotkeyButton
      aria-label="Download files"
      disabled={loading}
      onclick={() => downloadFile(item.fileid)}
      size="tableicon"
      variant="icon"
    >
      <FolderDown />
    </HotkeyButton>
    <HotkeyButton
      aria-label="Edit files"
      disabled={loading}
      onclick={() => goto(base + `/package/${item._id}/editfiles`)}
      size="tableicon"
      variant="icon"
    >
      <FilePen />
    </HotkeyButton>
    <HotkeyButton
      aria-label="Edit package"
      disabled={loading}
      onclick={() => single_item_click(item)}
      size="tableicon"
      variant="icon"
    >
      <Pencil />
    </HotkeyButton>
    <HotkeyButton
      aria-label="Delete"
      disabled={loading}
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
