<script lang="ts" module>
  export let page = "package";
  export let collectionname = "agents";
  export let query = { _type: "package" };
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
  import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});

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
      entities = await datacomponent.GetData(page, collectionname, query, auth.access_token);
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
</script>

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
  multi_select={false}
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
