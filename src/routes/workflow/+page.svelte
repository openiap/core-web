<script lang="ts" module>
  export let page = "workflow";
  export let collectionname = "workflow";
  export let query = { _type: "workflow", web: true };
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
  let toggleData: any = $state({});

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
      toast.error("Error while deleting", {
        description: "Error while deleting",
      });
    }
  }
  function deleteitems(ids: string[]) {}
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
  async function handleAccept() {
    try {
      await deleteitem(deleteData);
      toast.success("Deleted successfully", {
        description: "",
      });
      entities = await datacomponent.GetData(
        page,
        collectionname,
        query,
        auth.access_token,
      );
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  async function handleToggle() {
    try {
      let item = await auth.client.FindOne<any>({
        collectionname,
        query: { _id: toggleData._id },
        jwt: auth.access_token,
      });
      item.enabled = !item.enabled;
      await auth.client.UpdateOne({
        item: item,
        collectionname,
        jwt: auth.access_token,
      });
      toast.success("Updated successfully", {
        description: "",
      });
      entities = await datacomponent.GetData(
        page,
        collectionname,
        query,
        auth.access_token,
      );
    } catch (error: any) {
      undoToggle();
      toast.error("Error while updating", {
        description: error.message,
      });
    }
  }
  function undoToggle() {
    entities = entities.map((entity: any) => {
      if (entity._id == toggleData._id) {
        entity.enabled = !entity.enabled;
      }
      return entity;
    });
  }
</script>

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
    <div class="flex items-center space-x-2">
      <Button
        aria-label="edit"
        onclick={() => goto(base + `/entities/hdrobots/edit/${item._id}`)}
        size="icon"
        variant="secondary"
      >
        <Pencil />
      </Button>
      <Button
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
    </div>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
