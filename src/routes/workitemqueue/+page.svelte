<script lang="ts" module>
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { client } from "@openiap/jsapi/dist/client.js";
  import { Eraser, Filter, Pencil, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let collectionname = "mq";
  let page = "workitemqueue";
  let query = { _type: "workitemqueue" };

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
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
    goto(base + `/${page}/${item._id}`);
  }
  async function GetData() {
    ref.reload();
  }
  async function handleAccept() {
    try {
      await deleteitem(deleteData);
      toast.success("Deleted successfully", {
        description: "",
      });
      await GetData();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }

  async function purgeData(item: any) {
    item.purge = true;
    await auth.client.UpdateOne({
      collectionname: "mq",
      item,
      jwt: auth.access_token,
    });
    toast.success("Data purged");
  }
</script>

<div
  class="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4 mb-4 xl:flex xl:justify-between xl:items-center"
>
  <SearchInput bind:searchstring />
  <!-- <HotkeyButton
      size="sm"
      variant="base"
      disabled={loading}
      aria-label="Filter"
      class="border-dashed dark:text-bw600"
    >
      <Filter />
      Filter</HotkeyButton
    > -->
  <HotkeyButton
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="Create Work Item Queue"
    onclick={() => goto(base + `/${page}/new/`)}
  >
    <Plus />
    Create Work Item Queue</HotkeyButton
  >
</div>

<Entities
  {collectionname}
  {query}
  bind:searchstring
  page={data.page}
  {single_item_click}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet action(item: any)}
    <div class="flex items-center justify-end space-x-2">
      <HotkeyButton
        aria-label="edit"
        disabled={loading}
        onclick={() => single_item_click(item)}
        size="tableicon"
        variant="icon"
      >
        <Pencil />
      </HotkeyButton>
      <HotkeyButton
        aria-label="purge"
        disabled={loading}
        onclick={() => purgeData(item)}
        size="tableicon"
        variant="icon"
      >
        <Eraser />
      </HotkeyButton>
      <HotkeyButton
        aria-label="delete"
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
    </div>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
