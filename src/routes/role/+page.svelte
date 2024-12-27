<script lang="ts" module>
  export let page = "role";
  export let collectionname = "users";
  export let query = { _type: "role" };
</script>

<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Pencil, Plus, Trash2 } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import Searchinput from "$lib/searchinput/searchinput.svelte";

  let { data } = $props();

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
  function deleteitems(ids: string[]) {}
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
</script>

<div class="font-bold mb-4">All {page}s</div>
<Hotkeybutton
class="mb-4"
  aria-label="add"
  variant="default"
  onclick={() => goto(base + `/${page}/new`)}
>
  <Plus />
  Add {page}</Hotkeybutton
>
<Searchinput bind:searchstring />
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
  {#snippet members(item: any)}
    {item.members?.length}
  {/snippet}
  {#snippet action(item: any)}
    <Button
      onclick={() => goto(base + `/${page}/${item._id}`)}
      size="icon"
      variant="secondary"
    >
      <Pencil />
    </Button>
    <Button onclick={() => deleteitem(item)} size="icon" variant="destructive">
      <Trash2 />
    </Button>
  {/snippet}
</Entities>
