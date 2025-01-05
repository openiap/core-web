<script lang="ts" module>
  export let page = "workspace";
  export let collectionname = "users";
  export let query = { _type: "workspace" };
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
    import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { Pencil, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});

  async function deleteitem(item: any) {
    try {
      await auth.client.CustomCommand({
        command: "deleteworkspace",
        id: item._id,
        jwt: auth.access_token,
      });
      if(usersettings.currentworkspace === item._id){
          usersettings.currentworkspace = "";
          await usersettings.dopersist();
        }

      selected_items = selected_items.filter((i) => i !== item._id);
      entities = await datacomponent.GetData(page, collectionname, query, auth.access_token);
      toast.success("Deleted successfully", {
        description: "",
      });
      datacomponent.persist();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  async function deleteitems(ids: string[]) {
    try {
      for (let id of ids) {
        await auth.client.CustomCommand({
          command: "deleteworkspace",
          id: id,
          jwt: auth.access_token,
        });
        if(usersettings.currentworkspace === id){
          usersettings.currentworkspace = "";
          await usersettings.dopersist();
        }
      }
      entities = await datacomponent.GetData(page, collectionname, query, auth.access_token);
      selected_items = [];
      toast.success("Deleted " + ids.length + " items successfully", {
        description: "",
      });
      datacomponent.persist();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
  async function handleAccept() {
    try {
      await deleteitem(deleteData);
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
</script>

<Hotkeybutton
  class="mb-4"
  aria-label="Add workspace"
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
  total_count={data.total_count}
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
