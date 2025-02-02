<script lang="ts">
  import { goto, replaceState } from "$app/navigation";
  import { base } from "$app/paths";
  import { page as sveltepage } from "$app/state";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { Folder } from "lucide-svelte";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);

  let collectionname = $state("");
  collectionname = data.collectionname;
  let page = $derived(() => "entities-" + collectionname);
  let query = {};
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let collections: any[] = $state(data.collections);
  let entities = $state(data.entities);
  function collectionvariant(name: string): any {
    return name == collectionname ? "entityselected" : "entitydefault";
  }
  function selectcollection(name: string) {
    collectionname = name;
    // usersettings.entities_collectionname = name;
    // datacomponent.persist();
    sveltepage.url.pathname = base + `/entities/${collectionname}/deleted`;
    replaceState(sveltepage.url, sveltepage.state);
  }
  function single_item_click(item: any) {
    goto(base + `/entities/${collectionname}/history/${item.id}`);
  }
</script>

<div class="flex items-start justify-between">
  <div
    id="div1"
    class="w-full max-w-max flex-shrink-0 hidden sm:block p-2.5 rounded-[10px] dark:bg-bw900"
  >
    <small class="ps-4">{collectionname}</small>
    <ScrollArea class="max-h-[79.5vh] w-[266px] overflow-auto ">
      <div class="pt-0 p-4">
        {#each collections as collection}
          <HotkeyButton
            class="w-full justify-start"
            size="entity"
            disabled={loading}
            variant={collectionvariant(collection.name)}
            onclick={(e) => {
              selectcollection(collection.name);
            }}
          >
            <Folder class="size-4" />
            {collection.name}</HotkeyButton
          >
          <Separator class="my-2" />
        {/each}
      </div>
    </ScrollArea>
  </div>
  <div id="div2" class="ms-6 flex-1">
    <div class="flex justify-between">
      <div class="flex gap-2 w-full">
        <Searchinput bind:searchstring />
      </div>
    </div>

    <Entities
      {collectionname}
      {query}
      page={page()}
      total_count={data.total_count}
      multi_select={false}
      bind:searchstring
      bind:selected_items
      bind:entities
      {single_item_click}
      bind:this={ref}
      bind:loading
    ></Entities>
  </div>
</div>

<HotkeyButton
  data-shortcut="up"
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
  data-shortcut="down"
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
