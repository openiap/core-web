<script lang="ts">
  import { browser } from "$app/environment";
  import { goto, replaceState } from "$app/navigation";
  import { base } from "$app/paths";
  import { page as sveltepage } from "$app/state";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { WarningDialogue } from "$lib/warningdialogue/index.js";
  import {
    Clock,
    Folder,
    FolderSymlink,
    History,
    Layers2,
    Pencil,
    Plus,
    RefreshCcw,
    RotateCcw,
    Trash2,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { CustomInput } from "$lib/custominput";
  import { CustomCheckbox } from "$lib/customcheckbox";

  let { children, data } = $props();
  console.log(data.entities);
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let showWarningEntityDelete = $state(false);
  let newCollectionName = $state("");

  let mongodbQuery = $state("");
  let uniqueness = $state("");
  let includeOnes = $state(false);

  let collectionname = $state("");
  collectionname = data.collectionname;
  let tab = $state("");
  tab = data.tab;

  let query = {};
  let searchstring = $state(datacomponent.settings.searchstring);
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
      selected_items = selected_items.filter((i) => i !== item._id);
      ref.reload();
    } else {
      toast.error("Error while deleting", {
        description: "Error while deleting",
      });
    }
  }
  function collectionvariant(name: string): any {
    return name == collectionname ? "entityselected" : "entitydefault";
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
        collectionname: collectionname,
        jwt: auth.access_token,
      });
      toast.success(`Deleted ${collectionname} collection`);
      selectcollectionandtab("entities");
      newCollectionName = "";
      getCollections();
    } catch (error: any) {
      toast.error("Error while deleting collection", {
        description: error,
      });
      return;
    }
    showWarningEntityDelete = false;
  }
  async function selectcollectionandtab(
    collectionname: string,
    tabname: string = tab,
  ) {
    // collectionname = name;
    // tab = tabname;
    // await ref.reload();
    console.log("selectcollectionandtab", collectionname, tabname);
    goto(base + `/entities/${collectionname}/${tabname}`);
  }
</script>

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
                selectcollectionandtab(collection.name);
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
    <Tabs.Root value={tab}>
      <Tabs.List
        class="grid grid-cols-1 md:block md:w-fit dark:bg-darkagenttab rounded-[15px] p-1"
      >
        <Tabs.Trigger
          value="view"
          onclick={() => {
            selectcollectionandtab(collectionname, "view");
          }}>View</Tabs.Trigger
        >
        <Tabs.Trigger
          value="duplicates"
          onclick={() => {
            selectcollectionandtab(collectionname, "duplicates");
          }}>Show duplicates</Tabs.Trigger
        >
        <Tabs.Trigger
          value="undelete"
          onclick={() => {
            selectcollectionandtab(collectionname, "undelete");
          }}>Undelete</Tabs.Trigger
        >
      </Tabs.List>
      <Tabs.Content value="view">
        {@render children()}
      </Tabs.Content>
      <Tabs.Content value="duplicates">
        {@render children()}
      </Tabs.Content>
      <Tabs.Content value="undelete">
        {@render children()}
      </Tabs.Content>
    </Tabs.Root>
  </div>
</div>

<HotkeyButton
  data-shortcut="up"
  onclick={() => {
    let index = collections.findIndex((x) => x.name == collectionname);
    if (index > 0) {
      selectcollectionandtab(collections[index - 1].name);
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
      selectcollectionandtab(collections[index + 1].name);
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
