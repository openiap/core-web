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
  let allowdelete = false;

  async function deleteitem(item: any) {
    if(!allowdelete) return;
    const deletecount = await auth.client.DeleteOne({
      id: item._id,
      collectionname: "llmchat",
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
    goto(base + `/chat/hist/${item._id}`);
  }
  async function handleAccept() {
    try {
      await deleteitem(deleteData);
      ref.reload();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
</script>

<div class="sm:flex space-y-4 sm:space-y-0 justify-between mb-4 sm:space-x-5">
  <SearchInput bind:searchstring />

  <HotkeyButton
    title="Start new chat"
    data-shortcut="ins"
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="Start new chat"
    onclick={() => {
      loading = true;
      goto(base + `/chat`);
    }}
  >
    <SquarePlus />
    Create User</HotkeyButton
  >
</div>

<Entities
  bind:searchstring
  multi_select={false}
  show_delete={allowdelete}
  {single_item_click}
  total_count={data.total_count}
  collectionname={data.collectionname}
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
    <!-- <HotkeyButton
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
    </HotkeyButton> -->
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
