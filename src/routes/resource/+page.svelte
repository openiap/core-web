<script lang="ts" module>
  export let page = "resource";
  export let collectionname = "config";
  export let query = { _type: "resource" };
</script>
<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Pencil, Trash2 } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";

  let { data } = $props();
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";

  let searchstring = $state(data.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);

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
  function deleteitems(ids: string[]) {
  }
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
</script>

<h1>All {page}s</h1>
<!-- <Hotkeybutton
  aria-label="add"
  variant={"outline"}
  onclick={() => goto(base + `/${key}/new`)}>Add {key}</Hotkeybutton
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
  </div>
</div>
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
      aria-label="delete"
      onclick={() => deleteitem(item)}
      size="icon"
      variant="destructive"
    >
      <Trash2 />
    </Button>
    <!-- <Button
      aria-label="edit"
      onclick={() => goto(base + `/${key}/${item._id}`)}
      size="icon"
      variant="secondary"
    >
      <Pencil />
    </Button> -->
  {/snippet}
</Entities>
