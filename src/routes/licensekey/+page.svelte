<script lang="ts" module>
  export let page = "licensekey";
  export let collectionname = "config";
  export let query = { _type: "license" };
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
  import { Filter, Pencil, Plus, Trash2 } from "lucide-svelte";
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

  async function deleteitem(item: any) {
    try {
      loading = true;
      await auth.client.CustomCommand({
        command: "deletelicense",
        id: item._id,
        jwt: auth.access_token,
      });
      ref.reload();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
  }
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
  async function handleAccept() {
    try {
      await deleteitem(deleteData);
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
</script>

<div
  class="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4 xl:flex xl:justify-between xl:items-center mb-4"
>
  <SearchInput bind:searchstring />

  <HotkeyButton
    title="Create License Key (Insert Key)"
    data-shortcut="ins"
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="Create License Key"
    onclick={() => {
      loading = true;
      goto(base + `/${page}/new`);
    }}
  >
    <Plus />
    Create License Key</HotkeyButton
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
    <div class="flex items-center justify-end space-x-2">
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
