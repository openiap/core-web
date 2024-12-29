<script lang="ts" module>
  export let page = "form";
  export let collectionname = "forms";
  export let query = { _type: "form" };
</script>

<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { Pencil, Trash2 } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";

  let { data } = $props();
  import Button from "$lib/components/ui/button/button.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { toast } from "svelte-sonner";
  import { data as data1 } from "$lib/entities/data.svelte.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import Switch from "$lib/components/ui/switch/switch.svelte";

  let searchstring = $state(data.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let showWarningToggle = $state(false);
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
      console.error(Error("deletecount is " + deletecount));
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
      entities = await data1.GetData(page, collectionname, query);
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
      console.error(error);
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
      entities = await data1.GetData(page, collectionname, query);
    } catch (error: any) {
      undoToggle();
      toast.error("Error while updating", {
        description: error.message,
      });
      console.error(error);
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

<div class="mb-4 font-bold">All {page}s</div>
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
