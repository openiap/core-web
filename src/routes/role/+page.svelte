<script lang="ts">
  import { Entities } from "$lib/components/ui/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { X } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { settings } from "$lib/stores/settings.svelte";

  function reset() {
    settings.clearall();
    goto(base + `/`);
  }

  let defaultcolumnnames = ["_id", "name", "rparole", "_created"];
  let collectionname = "users";
  let page = "roles";
  let query = { _type: "role" };
  let searchstring = $state("");
  let selected_items = $state([]);
  function deleteitem(item: any) {
    console.log("deleteitem", item);
  }
  function deleteitems(ids: string[]) {
    console.log("deleteitems", ids);
  }
  function single_item_click(item: any) {
    goto(base + `/role/${item._id}`);
  }
</script>

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
  single_item_click={single_item_click}
  bind:selected_items
>
  <!-- {#snippet action(item: any)}
    <Button
      onclick={() => deleteitem(item)}
      size="icon"
      variant="destructive"
      disabled={selected_items.length > 0}
    >
      <X />
    </Button>
  {/snippet} -->
</Entities>
