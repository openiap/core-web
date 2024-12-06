<script lang="ts">
  import { Entities } from "$lib/components/ui/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Pencil, Trash2 } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { settings } from "$lib/stores/settings.svelte";

  let { data } = $props();
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  function reset() {
    settings.clearall();
    goto(base + `/`);
  }
  const title = "Mail history";
  const key = "mailhist";
  let defaultcolumnnames = ["_id", "name", "email", "lastseen", "_created"];
  let collectionname = "mailhist";
  let page = "mailhist";
  let query = {};
  let searchstring = $state("");
  let selected_items = $state([]);
  let entities = $state(data.entities);

  function deleteitem(item: any) {
    console.log("deleteitem", item);
  }
  function deleteitems(ids: string[]) {
    console.log("deleteitems", ids);
  }
  function single_item_click(item: any) {
    goto(base + `/user/${item._id}`);
  }
</script>

<h1>All {title}s</h1>
<!-- <Hotkeybutton variant={"outline"} onclick={() => goto(base + `/${key}/new`)}
  >Add {title}</Hotkeybutton
> -->
<div class="flex w-full max-w-sm flex-col gap-1.5">
  <Label for="email">Search</Label>
  <div class="flex gap-1.5">
    <HotkeyInput
      type="text"
      id="searchstring"
      placeholder="Searchstring or JSON query"
      bind:value={searchstring}
      data-shortcut={"Control+f,Meta+f"}
    />
    <HotkeyButton onclick={reset}>Reset</HotkeyButton>
  </div>
</div>
<Entities
  {defaultcolumnnames}
  {collectionname}
  {query}
  bind:searchstring
  {page}
  delete_selected={deleteitems}
  {single_item_click}
  bind:selected_items
>
  <!-- {#snippet action(item: any)}
    <Button onclick={() => deleteitem(item)} size="icon" variant="destructive">
      <Trash2 />
    </Button>
    <Button
      onclick={() => goto(base + `/${key}/${item._id}`)}
      size="icon"
      variant="secondary"
    >
      <Pencil />
    </Button>
  {/snippet} -->
</Entities>
