<script lang="ts">
  import { goto, replaceState } from "$app/navigation";
  import { base } from "$app/paths";
  import { page as sveltepage } from "$app/state";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { CustomCheckbox } from "$lib/customcheckbox/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import Entities from "$lib/entities/entities.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { WarningDialogue } from "$lib/warningdialogue/index.js";
  import {
    Clock,
    Folder,
    FolderSymlink,
    Plus,
    Search,
    Trash2,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { capitalizeWords } from "../../../../helper.js";

  let loading = $state(false);
  let errormessage = $state("");
  const { data } = $props();
  let collectionname = $state("");
  let query = $state("");
  let includeones = $state(false);
  let collections = $state(data.collections);
  let showWarningEntityDelete = $state(false);
  let deleteEntityName = $state("");

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
  async function getCollections() {
    try {
      loading = true;
      collections = await auth.client.ListCollections({
        jwt: auth.access_token,
      });
      await ref.reload();
    } catch (error: any) {
      toast.error("Error while fetching collections", {
        description: error,
      });
      return;
    } finally {
      loading = false;
    }
  }
  async function handleEntityDelete() {
    try {
      await auth.client.DropCollection({
        collectionname: deleteEntityName,
        jwt: auth.access_token,
      });
      toast.success(`Deleted ${deleteEntityName} collection`);
      selectcollection("entities");
      getCollections();
    } catch (error: any) {
      toast.error("Error while deleting collection", {
        description: error,
      });
      return;
    }
    showWarningEntityDelete = false;
  }
  let profileroles = auth.profile?.roles || [];
  const isAdmin = profileroles.includes("admins");
</script>

{#if errormessage && errormessage != ""}
  {errormessage}
{/if}

<div class="flex items-start justify-between h-full overflow-auto">
  <div
    id="div1"
    class="h-full max-w-max flex-shrink-0 p-2 rounded-[10px] bg-bw100 dark:bg-bw900 pb-10 hidden xl:block"
  >
    <div class="w-full px-1">
      <HotkeyButton
        variant="entitycreate"
        title="Insert Collection"
        class="w-full justify-start"
        size="entity"
        aria-label="Insert Collection"
        disabled={loading}
        onclick={() => goto(base + `/entities/new`)}
      >
        <Plus />
        Insert Collection</HotkeyButton
      >
    </div>
    <div class="h-full overflow-auto">
      <ScrollArea class="max-h-full w-[266px] overflow-auto">
        <div class="pt-0 py-4 px-1 flex flex-col">
          {#each collections as collection, index}
            <div class="flex items-center justify-between py-1">
              <HotkeyButton
                aria-label={collection.name}
                class="w-full justify-start"
                size="entity"
                variant={collectionvariant(collection.name)}
                onclick={(e) => {
                  selectcollection(collection.name);
                }}
              >
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center space-x-2">
                    <div>
                      {#if collection.name.endsWith(".files")}
                        <FolderSymlink class="size-4" />
                      {:else if collection.type == "timeseries"}
                        <Clock class="size-4" />
                      {:else}
                        <Folder class="size-4" />
                      {/if}
                    </div>
                    <div>
                      {collection.name}
                    </div>
                  </div>
                </div>
              </HotkeyButton>
              {#if isAdmin}
                <HotkeyButton
                  aria-label={`Delete ${capitalizeWords(collection.name)}`}
                  size="tableicon"
                  variant="deleteentity"
                  disabled={loading}
                  onclick={() => {
                    showWarningEntityDelete = true;
                    deleteEntityName = collection.name;
                  }}
                >
                  <Trash2 />
                </HotkeyButton>
              {/if}
            </div>
          {/each}
        </div>
      </ScrollArea>
    </div>
  </div>
  <div id="div2" class="page overflow-auto xl:ms-2 ps-0 lg:ps-2 pe-1">
    <Tabs.Root value={"duplicates"} class="mb-4">
      <Tabs.List
        class="md:block md:w-fit dark:bg-darkagenttab rounded-[15px] p-1"
      >
        <Tabs.Trigger
          value="view"
          onclick={() => {
            loading = true;
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
            loading = true;
            goto(base + `/entities/${collectionname}/deleted`);
          }}>Undelete</Tabs.Trigger
        >
      </Tabs.List>
    </Tabs.Root>

    <div class="block xl:hidden mb-4 xl:mb-0">
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

    <div
      class="flex flex-col lg:flex-row items-center justify-start lg:space-x-5 mb-2 lg:mb-4"
    >
      <div class="text-nowrap">Mongodb Query</div>
      <CustomInput
        height="h-7"
        width="w-full"
        placeholder="Mongodb query"
        bind:value={query}
      />
    </div>

    <div
      class="flex flex-col lg:flex-row items-center justify-start lg:space-x-5 mb-2 lg:mb-4"
    >
      <div class="text-start md:me-9">Uniqueness</div>
      <div class="w-full mb-2 lg:mb-0">
        <CustomInput
          height="h-7"
          width="w-full"
          placeholder="Uniqueness"
          bind:value={uniqueness}
        />
      </div>
      <div class="flex justify-between w-full items-center space-x-4">
        <div class="flex items-center">
          <CustomCheckbox bind:checked={includeones} />
          <div class="text-nowrap">Include 1's</div>
        </div>
        <HotkeyButton
          aria-label="Search"
          title="Search (Enter Key)"
          size="sm"
          variant="base"
          data-shortcut="enter"
          disabled={loading}
          onclick={async () => {
            loading = true;
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
            loading = false;
          }}
        >
          <Search class="h-4 w-4" />
          Search
        </HotkeyButton>
      </div>
    </div>

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
    ></Entities>
  </div>
</div>

<WarningDialogue
  bind:showWarning={showWarningEntityDelete}
  type="delete"
  onaccept={handleEntityDelete}
  entityname={deleteEntityName}
></WarningDialogue>

<style>
  .page {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }
</style>
