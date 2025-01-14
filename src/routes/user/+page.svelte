<script lang="ts" module>
  export let page = "user";
  export let collectionname = "users";
  export let query = { _type: "user" };
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { Filter, Pencil, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
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
      entities = entities.filter((entity: any) => entity._id != item._id);
      selected_items = selected_items.filter((i) => i !== item._id);
    } else {
      toast.error("Error", {
        description: "Error deleting item",
      });
    }
  }
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
  async function handleAccept() {
    try {
      await deleteitem(deleteData);
      toast.success("Deleted successfully", {
        description: "",
      });
      entities = await datacomponent.GetData(
        page,
        collectionname,
        query,
        auth.access_token,
      );
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
</script>

<div class="flex justify-between">
  <div class="flex gap-2 w-full">
    <Searchinput {searchstring} />
    <HotkeyButton
      size="new"
      variant="new"
      aria-label="add"
      class="border-dashed dark:text-bw600"
    >
      <Filter />
      Filter</HotkeyButton
    >
  </div>

  <HotkeyButton
    size="new"
    variant="new"
    aria-label="add"
    onclick={() => goto(base + `/${page}/new`)}
  >
    <Plus />
    Add {page}</HotkeyButton
  >
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
>
  {#snippet action(item: any)}
    <Button
      aria-label="edit"
      onclick={() => single_item_click(item)}
      size="icon"
      variant="secondary"
    >
      <Pencil />
    </Button>
    <Button
      aria-label="delete"
      onclick={() => {
        deleteData = item;
        showWarning = !showWarning;
      }}
      size="icon"
      variant="destructive"
    >
      <Trash2 />
    </Button>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
