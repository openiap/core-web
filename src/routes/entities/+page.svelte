<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { auth } from "$lib/stores/auth.svelte";
  import { Folder } from "lucide-svelte";
  import { toast } from "svelte-sonner";
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
      toast.error("Error while deleting", {
        description: "Error while deleting",
      });
    }
  }
  function deleteitems(ids: string[]) {}
  function collectionvariant(name: string): any {
    return name == collectionname ? "entitydefault" : "entityselected";
  }
  function selectcollection(name: string) {
    collectionname = name;
    datacomponent.persist();
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
    ></Entities>
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
