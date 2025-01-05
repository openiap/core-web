<script lang="ts" module>
  export let page = "role";
  export let collectionname = "users";
  export let query = { _type: "role" };
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Pencil, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
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
      entities = entities.filter((entity: any) => entity._id != item._id);
      selected_items = selected_items.filter((i) => i !== item._id);
    } else {
      toast.error("Error", {
        description: "Error deleting item",
      });
    }
  }
  function deleteitems(ids: string[]) {}
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
</script>

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
  aria-label="edit"
  onclick={() => goto(base + `/${page}/${item._id}`)}
  size="icon"
  variant="secondary"
>
  <Pencil />
</Button>
<Button
  aria-label="delete"
  onclick={() => deleteitem(item)}
  size="icon"
  variant="destructive"
>
  <Trash2 />
</Button>
  {/snippet}
</Entities>
