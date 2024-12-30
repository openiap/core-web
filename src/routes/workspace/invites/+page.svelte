<script lang="ts" module>
  export let page = "invites";
  export let collectionname = "users";
  export let query = { _type: "member", "status": {"$in": ["pending", "rejected" ] } };
</script>

<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { Pencil, Plus, Trash2 } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import { data as data1 } from "$lib/entities/data.svelte.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  usersettings.loadpage(data.settings);
  let searchstring = $state(data.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});

  async function deleteitem(item: any) {
    try {
      await auth.client.CustomCommand({ command: "deleteworkspace", id: item._id, jwt: auth.access_token });
      selected_items = selected_items.filter((i) => i !== item._id);
    } catch (error:any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  async function deleteitems(ids: string[]) {
    for (let id of ids) {
      await deleteitem({ _id: id });
      entities = await data1.GetData(page, collectionname, query);
    }
    selected_items = [];
  }
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
  async function handleAccept() {
    try {
      await deleteitem(deleteData);
      toast.success("Deleted successfully", {
        description: "",
      });
      entities = await data1.GetData(page, collectionname, query);
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
</script>

<div class="mb-4 font-bold">All {page}s</div>
<Hotkeybutton
  class="mb-4"
  aria-label="Add workspace"
  variant="default"
  onclick={() => goto(base + `/${page}/new`)}>
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
  {#snippet action(item: any)}
    <Button
      aria-label="Edit"
      onclick={() => goto(base + `/${page}/${item._id}`)}
      size="icon"
      variant="secondary"
    >
      <Pencil />
    </Button>
    <Button
      aria-label="Delete"
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

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
