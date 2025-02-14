<script lang="ts">
  import { browser } from "$app/environment";
  import { goto, replaceState } from "$app/navigation";
  import { base } from "$app/paths";
  import { page as sveltepage } from "$app/state";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { WarningDialogue } from "$lib/warningdialogue/index.js";
  import {
    Folder,
    History,
    Layers2,
    Pencil,
    Plus,
    RefreshCcw,
    RotateCcw,
    Trash2,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let showWarningEntityDelete = $state(false);
  let newCollectionName = $state("");

  let collectionname = $state("");
  collectionname = data.collectionname;
  if (browser) {
    setTimeout(async () => {
      sveltepage.url.pathname = base + `/entities/${data.collectionname}`;
      replaceState(sveltepage.url, sveltepage.state);
    }, 100);
  }

  let page = $derived(() => "entities-" + collectionname);
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
  function selectcollection(name: string) {
    collectionname = name;
    usersettings.entities_collectionname = name;
    datacomponent.persist();
    sveltepage.url.pathname = base + `/entities/${collectionname}`;
    replaceState(sveltepage.url, sveltepage.state);
  }
  function single_item_click(item: any) {
    goto(base + `/entities/${collectionname}/edit/${item._id}`);
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
      selectcollection("entities");
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
  // async function createCollection() {
  //   if (!newCollectionName) {
  //     toast.error("Name cannot be empty");
  //     return;
  //   }
  //   try {
  //     await auth.client.CreateCollection({
  //       jwt: auth.access_token,
  //       collectionname: newCollectionName,
  //     });
  //     toast.success(`Added ${newCollectionName} collection`);
  //     setTimeout(() => {
  //       getCollections();
  //     }, 2000);
  //     selectcollection(newCollectionName);
  //     newCollectionName = "";
  //     addCollectionDialoge = false;
  //   } catch (error: any) {
  //     toast.error("Error while creating collection", {
  //       description: error,
  //     });
  //     return;
  //   }
  // }
  let profileroles = auth.profile?.roles || [];
  const isAdmin = profileroles.includes("admins");
</script>

<div class="flex items-start justify-between h-full">
  <div
    id="div1"
    class="w-full max-w-max flex-shrink-0 hidden sm:block p-2.5 rounded-[10px] bg-bw100 dark:bg-bw900 h-full overflow-hidden pb-10"
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
        Add collection</HotkeyButton
      >
    </div>
    <div class="h-full overflow-auto">
      <ScrollArea class="max-h-full w-[266px] overflow-auto ">
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
              <Folder class="size-4" />
              {collection.name}</HotkeyButton
            >
          {/each}
        </div>
      </ScrollArea>
    </div>
  </div>
  <div id="div2" class="ms-2 xl:ms-6 page">
    <div
      class="grid grid-cols-2 lg:grid-cols-2 gap-2 xl:grid xl:grid-cols-5 xl:gap-4 justify-between mb-4"
    >
      <Searchinput bind:searchstring class="col-span-2" />
      <!-- <HotkeyButton
        size="sm"
        disabled={loading}
        onclick={() => goto(base + `/entities/${collectionname}/deleted`)}
      >
        <RotateCcw />
        Deleted items</HotkeyButton
      >
      <HotkeyButton
        size="sm"
        disabled={loading}
        onclick={() => goto(base + `/entities/${collectionname}/duplicates`)}
      >
        <Layers2 />
        Show Duplicates</HotkeyButton
      > -->
      <HotkeyButton size="sm" disabled={loading} onclick={getCollections}>
        <RefreshCcw />
        Refresh</HotkeyButton
      >
      {#if isAdmin}
        <HotkeyButton
          size="sm"
          variant="danger"
          disabled={loading}
          onclick={async () => {
            showWarningEntityDelete = true;
          }}
        >
          <Trash2 />
          Delete {collectionname}</HotkeyButton
        >
      {/if}
      <HotkeyButton
        size="sm"
        data-shortcut="n,ins"
        disabled={loading}
        onclick={() => {
          goto(base + `/entities/${collectionname}/new`);
        }}
      >
        <Plus />
        Add to {collectionname}</HotkeyButton
      >
    </div>

    <Entities
      {collectionname}
      {query}
      page={page()}
      total_count={data.total_count}
      bind:searchstring
      bind:selected_items
      bind:entities
      {single_item_click}
      bind:this={ref}
      bind:loading
    >
      {#snippet action(item: any)}
        <HotkeyButton
          aria-label="history"
          disabled={loading}
          onclick={() =>
            goto(base + `/entities/${collectionname}/history/${item._id}`)}
          size="tableicon"
          variant="icon"
        >
          <History />
        </HotkeyButton>
        <HotkeyButton
          aria-label="edit"
          disabled={loading}
          onclick={() => single_item_click(item)}
          size="tableicon"
          variant="icon"
        >
          <Pencil />
        </HotkeyButton>
      {/snippet}
    </Entities>
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
