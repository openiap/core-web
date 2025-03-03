<script lang="ts" module>
</script>

<script lang="ts">
  import { goto, replaceState } from "$app/navigation";
  import { base } from "$app/paths";
  import { page as sveltepage } from "$app/state";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { EntitySelector } from "$lib/entityselector";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { Pencil, Plus, Trash2, X } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let collectionname = "workitems";

  let { data } = $props();
  let loading = $state(false);
  let query = $state({ wiqid: data.id });
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});
  let queue: any = $state(data.id);

  async function deleteitem(item: any) {
    const deletecount = await auth.client.DeleteOne({
      id: item._id,
      collectionname,
      jwt: auth.access_token,
    });
    if (deletecount == 1) {
      entities = entities.filter((entity: any) => entity._id != item._id);
      selected_items = selected_items.filter((i) => i !== item._id);
    } else {
      toast.error("Error while deleting", {
        description: "Error while deleting",
      });
    }
  }
  function single_item_click(item: any) {
    goto(base + `/workitem/edit/${item._id}`);
  }
  async function GetData() {
    try {
      entities = await datacomponent.GetData(
        data.page,
        collectionname,
        query,
        auth.access_token,
      );
    } catch (error: any) {
      toast.error("Error getting data", {
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
      await GetData();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  async function filterData() {
    sveltepage.url.pathname = base + `/workitem/${queue}`;
    replaceState(sveltepage.url, sveltepage.state);

    query = { ...query, wiqid: queue };
    if (queue) {
      await GetData();
    }
  }
</script>

<div
  class="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4 xl:grid-cols-8 xl:gap-4 mb-2 md:mb-4"
>
  <div class="col-span-2">
    <SearchInput bind:searchstring class="" />
  </div>
  <div class="xl:col-span-2">
    <EntitySelector
      width="w-full"
      height="h-7"
      collectionname="mq"
      disabled={loading}
      bind:value={queue}
      basefilter={{ _type: "workitemqueue" }}
      handleChangeFunction={filterData}
      name="Queue"
      showType={false}
    />
  </div>
  <HotkeyButton
    class="border-dashed dark:text-bw600"
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="Filter"
    onclick={() => goto(base + `/workitem`)}
  >
    <X />
    Clear</HotkeyButton
  >

  <HotkeyButton
    class="xl:col-start-10"
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="Add Work Item"
    onclick={() => goto(base + `/workitem/new/${queue ? queue : "new"}`)}
  >
    <Plus />
    Add Work Item</HotkeyButton
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
  bind:loading
>
  {#snippet action(item: any)}
    <div class="flex items-center space-x-2 justify-end">
      <HotkeyButton
        aria-label="Edit"
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
    </div>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
