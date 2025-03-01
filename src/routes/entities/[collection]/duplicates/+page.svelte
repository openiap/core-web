<script lang="ts">
  import { goto, replaceState } from "$app/navigation";
  import { base } from "$app/paths";
  import { page as sveltepage } from "$app/state";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { CustomCheckbox } from "$lib/customcheckbox/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import Entities from "$lib/entities/entities.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Clock, Folder, FolderSymlink, Plus } from "lucide-svelte";

  let loading = $state(false);
  let errormessage = $state("");
  const { data } = $props();
  let collectionname = $state("");
  let query = $state("");
  let includeones = $state(false);
  let collections = $state(data.collections);

  collectionname = data.collectionname;
  let ref: any;
  let page = $derived(() => "entities-" + collectionname + "-duplicates");
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let uniqueness = $state("_type");
  for (let i = 0; i < data.entities.length; i++) {
    data.entities[i].name = data.entities[i]._id;
  }
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
  async function single_item_click(item: any) {
    usersettings.entities_collectionname = collectionname;
    await usersettings.dopersist();
    goto(base + `/entities/${collectionname}`, {
      state: { searchstring: $state.snapshot(item.name) },
    });
  }
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

<div class="flex items-start justify-between h-full mb-4">
  <div
    id="div1"
    class="h-full max-w-max flex-shrink-0 p-2.5 rounded-[10px] bg-bw100 dark:bg-bw900 pb-10 hidden xl:block"
  >
    <div class="flex justify-center w-full px-4">
      <HotkeyButton
        class="mb-2 rounded-md w-full"
        size="sm"
        data-shortcut="n,ins"
        disabled={loading}
        onclick={() => goto(base + `/entities/new`)}
      >
        <Plus />
        Insert collection</HotkeyButton
      >
    </div>
    <div class="h-full overflow-auto">
      <ScrollArea class="max-h-full w-[266px] overflow-auto">
        <div class="pt-0 p-4">
          {#each collections as collection, index}
            {#if index != 0}
              <Separator class="my-2" />
            {/if}
            <HotkeyButton
              class="w-full justify-start"
              size="entity"
              variant={collectionvariant(collection.name)}
              onclick={(e) => {
                selectcollection(collection.name);
              }}
            >
              {#if collection.name.endsWith(".files")}
                <FolderSymlink class="size-4" />
              {:else if collection.type == "timeseries"}
                <Clock class="size-4" />
              {:else}
                <Folder class="size-4" />
              {/if}
              {collection.name}</HotkeyButton
            >
          {/each}
        </div>
      </ScrollArea>
    </div>
  </div>
  <div id="div2" class="xl:ms-2 page">
    <Tabs.Root value={"duplicates"} class="mb-4">
      <Tabs.List
        class="md:block md:w-fit dark:bg-darkagenttab rounded-[15px] p-1"
      >
        <Tabs.Trigger
          value="view"
          onclick={() => {
            goto(base + `/entities/${collectionname}`);
          }}>View</Tabs.Trigger
        >
        <Tabs.Trigger
          value="duplicates"
          onclick={() => {
            goto(base + `/entities/${collectionname}/duplicates`);
          }}>Show duplicates</Tabs.Trigger
        >
        <Tabs.Trigger
          value="undelete"
          onclick={() => {
            goto(base + `/entities/${collectionname}/deleted`);
          }}>Undelete</Tabs.Trigger
        >
      </Tabs.List>
    </Tabs.Root>

    <div class="block xl:hidden mb-2 xl:mb-0">
      <CustomSelect
        class="h-7"
        width="w-full"
        type="single"
        {loading}
        bind:value={collectionname}
        triggerContent={() => collectionname}
        onValueChangeFunction={(item: any) => {
          selectcollection(item);
        }}
        selectitems={collections}
      />
    </div>

    <div class="mb-2">
      <div>Mongodb Query</div>
      <CustomInput
        width="w-full"
        placeholder="Mongodb query"
        bind:value={query}
      />
    </div>

    <div
      class="flex flex-col lg:flex-row items-center justify-start lg:space-x-4 mb-2 lg:mb-4"
    >
      <div class="text-start">Uniqueness</div>
      <div class="w-full mb-2 lg:mb-0">
        <CustomInput
          width="w-full"
          placeholder="Uniqueness"
          bind:value={uniqueness}
        />
      </div>
      <div class="flex lg:flex-0 justify-start items-center lg:space-x-4">
        <div class="flex items-center">
          <CustomCheckbox bind:checked={includeones} />
          <div class="text-nowrap">Include 1's</div>
        </div>
        <HotkeyButton
          onclick={async () => {
            const uniquenessFields = uniqueness
              .split(",")
              .map((field) => field.trim());
            const _id: any = {};
            uniquenessFields.forEach((field) => {
              _id[field] = `$${field}`;
            });
            const aggregates: any[] = [{ $group: { _id, count: { $sum: 1 } } }];
            if (query != "") {
              aggregates.unshift({ $match: query });
            }
            if (!includeones) {
              aggregates.push({ $match: { count: { $gt: 1 } } });
            }
            aggregates.push({ $sort: { count: -1 } });
            const _entities = await auth.client.Aggregate<any>({
              collectionname: data.collectionname,
              aggregates,
              jwt: data.access_token,
            });
            for (let i = 0; i < _entities.length; i++) {
              _entities[i].name = _entities[i]._id;
            }
            entities = _entities;
          }}
        >
          Update
        </HotkeyButton>
      </div>
    </div>

    <!-- <div class="flex items-center space-x-4">
            <HotkeyButton>
              <Trash2 /> One
            </HotkeyButton>
            <HotkeyButton>
              <Trash2 /> All but One
            </HotkeyButton>
            <HotkeyButton>
              <Trash2 /> All
            </HotkeyButton>
          </div> -->

    <Entities
      {collectionname}
      page={page()}
      total_count={data.total_count}
      bind:searchstring
      bind:selected_items
      bind:entities
      bind:this={ref}
      bind:loading
      single_item_click={(item: any) => single_item_click(item)}
    >
      <!-- {#snippet action(item: any)}
        <HotkeyButton
          aria-label="edit"
          disabled={loading}
          onclick={() => single_item_click(item)}
          size="tableicon"
          variant="icon"
        >
          <Pencil />
        </HotkeyButton>
      {/snippet} -->
    </Entities>
  </div>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    /* This ensures it fills the entire window height */
  }
</style>
