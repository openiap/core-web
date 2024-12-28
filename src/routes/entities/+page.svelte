<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";

  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";

  import { auth } from "$lib/stores/auth.svelte";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { Folder } from "lucide-svelte";
  let { data } = $props();

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
      selected_items = selected_items.filter((i) => i !== item._id);
    } else {
      console.error(Error("deletecount is " + deletecount));
    }
  }
  function deleteitems(ids: string[]) {}
  function collectionvariant(name: string): any {
    return name == collectionname ? "entitydefault" : "entityselected";
  }
  function selectcollection(name: string) {
    collectionname = name;
  }
</script>

<div class="flex items-start justify-between">
  <div
    id="div1"
    class="w-full max-w-max flex-shrink-0 hidden sm:block p-6 border-r border-gray-400"
  >
    <div class="ms-4 mb-4">
      <b> Collection Name: </b>
      <br />
      {collectionname}<br />
    </div>
    <h4 class="mb-4 text-sm font-medium leading-none ms-4">Collections:</h4>
    <ScrollArea class="max-h-screen sm:max-h-[calc(100vh-8rem)] overflow-auto">
      <!-- <ScrollArea class="max-h-[80vh]"> -->
      <div class="p-4">
        {#each collections as tag}
          <div class="text-sm">
            <Button
              class="w-full"
              variant={collectionvariant(tag.name)}
              onclick={(e) => {
                selectcollection(tag.name);
              }}
            >
              <Folder class="size-4" />
              {tag.name}</Button
            >
          </div>
          <Separator class="my-2" />
        {/each}
      </div>
    </ScrollArea>
  </div>
  <div id="div2" class="m-6 flex-1">
    <Searchinput bind:searchstring />
    <Entities
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
      selectcollection(collections[index - 1].name);
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
      selectcollection(collections[index + 1].name);
    }
  }}
  hidden={true}
  class="hidden"
>
  Next</HotkeyButton
>

<style>
</style>
