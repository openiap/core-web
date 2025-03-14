<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { Pencil, SquarePlus, Trash2 } from "lucide-svelte";
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
    const deletecount = await auth.client.DeleteOne({
      id: item._id,
      collectionname: "config",
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
    goto(base + `/provider/${item._id}`);
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

<div class="lg:flex space-y-4 lg:space-y-0 justify-between mb-4 lg:space-x-5">
  <SearchInput bind:searchstring />
  <HotkeyButton
    title="Create Provider (Insert Key)"
    data-shortcut="ins"
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="Create Provider"
    onclick={() => {
      loading = true;
      goto(base + `/provider/new`);
    }}
  >
    <SquarePlus />
    Create Provider</HotkeyButton
  >
</div>

<Entities
  bind:searchstring
  {single_item_click}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet action(item: any)}
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
      variant="danger"
      aria-label="Delete"
      disabled={loading}
      onclick={() => {
        deleteData = item;
        showWarning = !showWarning;
      }}
      size="tableicon"
    >
      <Trash2 />
    </HotkeyButton>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
