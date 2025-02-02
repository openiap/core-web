<script lang="ts" module>
  export let page = "resource";
  export let collectionname = "config";
  export let query = { _type: "resource" };
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Filter, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);

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
      toast.error("Error", {
        description: "Error deleting item",
      });
    }
  }
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
  async function createcommon() {
    try {
      auth.client.CustomCommand({
        command: "createcommonresources",
        jwt: auth.access_token,
      });
      toast.success("Created common resources", {
        description: "",
      });
      ref.reload();
    } catch (error: any) {
      toast.error("Error while creating", {
        description: error.message,
      });
    }
  }
</script>

<div class="flex justify-between">
  <div class="flex gap-2 w-full">
    <SearchInput bind:searchstring />
    <HotkeyButton
      size="sm"
      variant="base"
      disabled={loading}
      aria-label="Filter"
      class="border-dashed dark:text-bw600"
    >
      <Filter />
      Filter</HotkeyButton
    >
  </div>

  <HotkeyButton
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="add"
    onclick={createcommon}
  >
    <Plus />
    Create common</HotkeyButton
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
  bind:this={ref}
  bind:loading
>
  {#snippet action(item: any)}
    <HotkeyButton
      aria-label="delete"
      disabled={loading}
      onclick={() => deleteitem(item)}
      size="tableicon"
      variant="danger"
    >
      <Trash2 />
    </HotkeyButton>
  {/snippet}
</Entities>
