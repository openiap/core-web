<script lang="ts">
  import { browser } from "$app/environment";
  import { goto, replaceState } from "$app/navigation";
  import { base } from "$app/paths";
  import { page as sveltepage } from "$app/state";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { CustomInput } from "$lib/custominput";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { WarningDialogue } from "$lib/warningdialogue/index.js";
  import {
    Folder,
    History,
    Pencil,
    Plus,
    RefreshCcw,
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
      collections = await auth.client.ListCollections({
        jwt: auth.access_token,
      });
      console.log("collections", collections);
    } catch (error: any) {
      toast.error("Error while fetching collections", {
        description: error,
      });
      return;
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

<div class="flex items-start justify-between">
  <div
    id="div1"
    class="w-full max-w-max flex-shrink-0 hidden sm:block p-2.5 rounded-[10px] bg-bw100 dark:bg-bw900"
  >
    <HotkeyButton
      class="mb-2 w-full"
      size="sm"
      data-shortcut="n,ins"
      disabled={loading}
      onclick={() => goto(base + `/entities/new`)}
    >
      <Plus />
      Add collection</HotkeyButton
    >
    <ScrollArea class="max-h-[78vh] w-[266px] overflow-auto ">
      <div class="pt-0 p-4">
        {#each collections as collection}
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
      <div class="flex gap-2">
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
