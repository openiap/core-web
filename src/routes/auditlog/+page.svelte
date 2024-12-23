<script lang="ts" module>
  export let page = "auditlog";
  export let collectionname = "audit";
  export let query = {};
</script>

<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { MapPinHouse, Pencil, Trash2 } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  let { data } = $props();
  import Button from "$lib/components/ui/button/button.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import Search from "$lib/search/search.svelte";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { SearchInput } from "$lib/searchinput/index.js";

  let searchstring = $state(data.searchstring);
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
    } else {
      console.error(Error("deletecount is " + deletecount));
    }
  }
  function deleteitems(ids: string[]) {}
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
</script>

<div class="mb-4 font-bold">All {page}s</div>
<SearchInput bind:searchstring />
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
      title="View on map"
      aria-label="view"
      onclick={() => {
        window.open(
          `https://www.iplocation.net/?query=${item.remoteip}`,
          "_blank",
        );
      }}
      size="icon"
      variant="secondary"><MapPinHouse /></Button
    >
    <Button
      title="Edit"
      aria-label="edit"
      onclick={() => goto(base + `/${page}/${item._id}`)}
      size="icon"
      variant="secondary"
    >
      <Pencil />
    </Button>
    <Button
      title="Delete"
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

<Warningdialogue {showWarning} type="delete">
  {#snippet action()}
    <Button
      variant="outline"
      onclick={() => {
        showWarning = false;
      }}>Cancel</Button
    >
    <Button
      variant="destructive"
      onclick={async () => {
        await deleteitem(deleteData);
        showWarning = false;
      }}>Delete</Button
    >
  {/snippet}
</Warningdialogue>
