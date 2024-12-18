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
  import { Pencil, Trash2 } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { data as data1 } from "$lib/entities/data.svelte.js";

  let { data } = $props();
  import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";

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
        action: {
          label: "Undo",
          onClick: () => console.info("Undo"),
        },
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

<h1>All {page}s</h1>
<Hotkeybutton
  aria-label="Add package"
  variant={"outline"}
  onclick={() => goto(base + `/${page}/new`)}>Add {page}</Hotkeybutton
>
<Hotkeybutton
  aria-label="Agents"
  variant={"outline"}
  onclick={() => goto(base + `/agent`)}>Agents</Hotkeybutton
>
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
