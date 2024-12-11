<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";

  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { settingsState } from "$lib/stores/settings.svelte";
  const settings = new settingsState();

  import { auth } from "$lib/stores/auth.svelte";

  let { data } = $props();

  function reset() {
    settings.clearall();
    goto(base + `/`);
  }

  let defaultcolumnnames = [
    "_id",
    "name",
    "_type",
    "_createdby",
    "_modified",
    "_created",
  ];
  let collectionname = $state("");
  collectionname = data.collectionname;
  let page = $derived(() => "entities-" + collectionname);
  let query = {};
  let searchstring = $state(data.searchstring);
  let selected_items = $state([]);
  let collections: any[] = $state(data.collections);
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
  function collectionvariant(name: string): any {
    return name == collectionname ? "primary" : "secondary";
  }
  function selectcollection(name: string) {
    collectionname = name;
    settings.setvalue("entities", "collectionname", collectionname);
  }
</script>

collectionname: {collectionname}<br />
<div class="flex min-h-screen items-start justify-center">
  <div id="div1" class="w-full max-w-[300px] flex-shrink-0 hidden sm:block">
    <ScrollArea class="max-h-screen sm:max-h-[calc(100vh-8rem)] overflow-auto">
    <!-- <ScrollArea class="max-h-[80vh]"> -->
      <div class="p-4">
        <h4 class="mb-4 text-sm font-medium leading-none">Tags</h4>
        {#each collections as tag}
          <div class="text-sm">
            <Button
              variant={collectionvariant(tag.name)}
              onclick={(e) => {
                selectcollection(tag.name);
              }}>{tag.name}</Button
            >
          </div>
          <Separator class="my-2" />
        {/each}
      </div>
    </ScrollArea>
  </div>
  <div id="div2" class="flex-1 bg-white dark:bg-black overflow-auto">
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
        <HotkeyButton onclick={reset}>Reset</HotkeyButton>
      </div>
    </div>
    <Entities
      {defaultcolumnnames}
      {collectionname}
      {query}
      bind:searchstring
      key={page()}
      page={page()}
      delete_selected={deleteitems}
      bind:selected_items
      bind:entities
    >
      <!-- {#snippet action(item: any)}
          <Button
            onclick={() => deleteitem(item)}
            size="icon"
            variant="destructive"
            disabled={selected_items.length > 0}
          >
            <X />
          </Button>
        {/snippet} -->
    </Entities>
  </div>
</div>

<HotkeyButton
  data-shortcut="ArrowUp"
  onclick={() => {
    let index = collections.findIndex((x) => x.name == collectionname);
    if (index > 0) {
      collectionname = collections[index - 1].name;
      settings.setvalue("entities", "collectionname", collectionname);
    }
  }}
  hidden={true}
  class="hidden">Previous</HotkeyButton
>
<HotkeyButton
  data-shortcut="ArrowDown"
  onclick={() => {
    let index = collections.findIndex((x) => x.name == collectionname);
    if (index < collections.length - 1) {
      collectionname = collections[index + 1].name;
      settings.setvalue("entities", "collectionname", collectionname);
    }
  }}
  hidden={true}
  class="hidden"
>
  Next</HotkeyButton
>

<style>
</style>
