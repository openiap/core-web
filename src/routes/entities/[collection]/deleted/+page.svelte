<script lang="ts">
  import { goto, replaceState } from "$app/navigation";
  import { base } from "$app/paths";
  import { page as sveltepage } from "$app/state";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { WarningDialogue } from "$lib/warningdialogue/index.js";
  import {
    Clock,
    Folder,
    FolderSymlink,
    History,
    Pencil,
    Plus,
    Trash2,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { capitalizeWords } from "../../../../helper.js";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);

  let collectionname = $state("");
  collectionname = data.collectionname;
  let page = $derived(() => "entities-" + collectionname);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let collections: any[] = $state(data.collections);
  let entities = $state(data.entities);
  let showWarningEntityDelete = $state(false);
  let deleteEntityName = $state("");

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

<div class="flex items-start justify-between h-full overflow-auto">
  <div
    id="div1"
    class="h-full max-w-max flex-shrink-0 p-2 rounded-[10px] bg-bw100 dark:bg-bw900 pb-10 hidden xl:block"
  >
    <div class="w-full px-1">
      <HotkeyButton
        variant="entitycreate"
        title="Create Collection"
        class="w-full justify-start"
        size="entity"
        aria-label="Create Collection"
        onclick={() => goto(base + `/entities/new`)}
      >
        <Plus />
        Create Collection</HotkeyButton
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
                  onclick={async () => {
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
    <Tabs.Root value={"undelete"} class="mb-4">
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
            loading = true;
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

    <div class="flex justify-between mb-4">
      <div class="flex gap-2 w-full">
        <Searchinput bind:searchstring />
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
    >
      {#snippet action(item: any)}
        <HotkeyButton
          aria-label="History"
          title="Show Version History"
          disabled={loading}
          onclick={() =>
            goto(base + `/entities/${collectionname}/history/${item._id}`)}
          size="tableicon"
          variant="icon"
        >
          <History />
        </HotkeyButton>
        <HotkeyButton
          aria-label="Edit"
          disabled={loading}
          onclick={() => single_item_click(item)}
          size="tableicon"
          variant="icon"
        >
          <Pencil />
        </HotkeyButton>
      {/snippet}</Entities
    >
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
    /* This ensures it fills the entire window height */
  }
</style>
