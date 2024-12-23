<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Pencil, Plus, Trash2 } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";

  let { data } = $props();
  import Button from "$lib/components/ui/button/button.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { SearchInput } from "$lib/searchinput";

  const key = "client";
  let collectionname = "";
  let page = "credential";
  let query = { _type: "credential" };
  let searchstring = $state("");
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
  function deleteitems(ids: string[]) {}
  function single_item_click(item: any) {
    goto(base + `/${key}/${item._id}`);
  }
</script>

<div class="mb-4 font-bold">All {key}s</div>
<Button
  class="mb-4"
  aria-label="add"
  variant="default"
  onclick={() => goto(base + `/${key}/new`)}
>
  <Plus />
  Add {key}</Button
>
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
      aria-label="edit"
      onclick={() => goto(base + `/user/${item.user?._id}`)}
      size="icon"
      variant="secondary"
    >
      <Pencil />
    </Button>
  {/snippet}
</Entities>
