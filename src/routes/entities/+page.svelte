<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Entities } from "$lib/entities/index.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { auth } from "$lib/stores/auth.svelte";
  import { Folder } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  let { data } = $props();
  datacomponent.parsesettings(data.settings);
  
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
  async function deleteitems(ids: string[]) {
    try {
      for (let id of ids) {
        const deletecount = await auth.client.DeleteOne({
          id: id,
          collectionname,
          jwt: auth.access_token,
        });
        if(deletecount > 1){
          throw new Error("Error while deleting " + id + " deleted " + deletecount + " items");
        }
      }
      entities = await datacomponent.GetData(page(), collectionname, query, auth.access_token);
      selected_items = [];
      toast.success("Deleted " + ids.length + " items successfully", {
        description: "",
      });
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  function collectionvariant(name: string): any {
    return name == collectionname ? "entitydefault" : "entityselected";
  }
  function selectcollection(name: string) {
    collectionname = name;
    usersettings.entities_collectionname = name;
    datacomponent.persist();
  }
</script>

<div class="flex items-start justify-between">
  <div
    id="div1"
    class="w-full max-w-max flex-shrink-0 hidden sm:block p-6 border-r border-gray-400"
  >
    <ScrollArea class="max-h-screen sm:max-h-[calc(100vh-8rem)] overflow-auto">
      <div class="p-4">
        {collectionname}

        {#each collections as collection}
          <div class="text-sm">
            <Button
              class="w-full"
              variant={collectionvariant(collection.name)}
              onclick={(e) => {
                selectcollection(collection.name);
              }}
            >
              <Folder class="size-4" />
              {collection.name}</Button
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
      page={page()}
      delete_selected={deleteitems}
      total_count={data.total_count}
      bind:searchstring
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
