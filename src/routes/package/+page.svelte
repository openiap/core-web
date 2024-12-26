<script lang="ts" module>
  export let page = "package";
  export let collectionname = "agents";
  export let query = { _type: "package" };
</script>

<script lang="ts">
  import { toast } from "svelte-sonner";
  import { Entities } from "$lib/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { data as data1 } from "$lib/entities/data.svelte.js";

  let { data } = $props();
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import Searchinput from "$lib/searchinput/searchinput.svelte";

  let searchstring = $state(data.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});

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

  async function handleAccept() {
    try {
      await auth.client.CustomCommand({
        command: "deletepackage",
        id: deleteData._id,
      });
      toast.success("Deleted successfully", {
        description: "",
      });
      entities = await data1.GetData(page, collectionname, query);
    } catch (error: any) {
      toast.error("Error white deleting", {
        description: error.message,
      });
      console.error(error);
    }
  }
</script>

<div class="mb-4 font-bold">All {page}s</div>

<div class="mb-4">
  <Hotkeybutton aria-label="Agents" onclick={() => goto(base + `/agent`)}>
    <ArrowLeft />
    Agents</Hotkeybutton
  >
  <Hotkeybutton
    aria-label="Add package"
    onclick={() => goto(base + `/${page}/new`)}
  >
    <Plus />
    Add {page}</Hotkeybutton
  >
</div>

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
