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
  import { StatusCard } from "$lib/statuscard/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { Pencil, Plus, Trash2, X } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let collectionname = "workitems";
  let page = "workitem";
  let query = $state({});

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});
  let queue: any = $state("");

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
    goto(base + `/${page}/edit/${item._id}`);
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
  async function filterData() {
    // sveltepage.url.pathname = base + `/${page}/${queue}`;
    // replaceState(sveltepage.url, sveltepage.state);

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
      bind:value={queue}
      basefilter={{ _type: "workitemqueue" }}
      handleChangeFunction={() => goto(base + `/workitem/${queue}`)}
      name="Queue"
    />
  </div>
  <HotkeyButton
    class="xl:col-start-10"
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="add"
    onclick={() => goto(base + `/${page}/new/${queue ? queue : "new"}`)}
  >
    <Plus />
    Add {page}</HotkeyButton
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
  {#snippet wiq(item: any)}
    <HotkeyButton
      class="hover:underline"
      variant="ghostfull"
      onclick={() => goto(base + `/workitem/${item.wiqid}`)}
    >
      {item.wiq}
    </HotkeyButton>
  {/snippet}

  {#snippet state(item: any)}
    {#if item != null && item.state != null && item.state != ""}
      <StatusCard bind:title={item.state as string} />
    {:else}
      <StatusCard title="Unknown" />
    {/if}
  {/snippet}
  {#snippet errortype(item: any)}
    {#if item != null && item.errortype != null && item.errortype != ""}
      <StatusCard bind:title={item.errortype as string} />
    {:else}
      <StatusCard title="No error" />
    {/if}
  {/snippet}
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
