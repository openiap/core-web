<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { MapPinHouse, Pencil, Trash2 } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { settingsState } from "$lib/stores/settings.svelte";
  const settings = new settingsState();
  let { data } = $props();
  import Button from "$lib/components/ui/button/button.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";

  function reset() {
    settings.clearall();
    goto(base + `/`);
  }
  const key = "auditlog";
  let defaultcolumnnames = [
    "_id",
    "name",
    "_type",
    "impostorname",
    "clientagent",
    "clientversion",
    "remoteip",
    "_created",
  ];
  let collectionname = "audit";
  let page = "auditlog";
  let query = {};
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
  function deleteitems(ids: string[]) {
  }
  function single_item_click(item: any) {
    goto(base + `/${key}/${item._id}`);
  }
</script>

<h1>All {key}s</h1>
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
    <HotkeyButton aria-label="reset" onclick={reset}>Reset</HotkeyButton>
  </div>
</div>
<Entities
  {defaultcolumnnames}
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
      title="Delete"
      aria-label="delete"
      onclick={() => deleteitem(item)}
      size="icon"
      variant="destructive"
    >
      <Trash2 />
    </Button>
    <Button
      title="Edit"
      aria-label="edit"
      onclick={() => goto(base + `/${key}/${item._id}`)}
      size="icon"
      variant="secondary"
    >
      <Pencil />
    </Button>
    <Button
      title="View on map"
      href={`https://www.iplocation.net/?query=${item.remoteip}`}
      aria-label="view"
      onclick={() => goto(base + `/${key}/${item._id}`)}
      size="icon"
      variant="secondary"><MapPinHouse /></Button
    >
  {/snippet}
</Entities>
