<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { Pencil, SquarePlus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});

  function single_item_click(item: any) {
    goto(base + `/git/${item._id}/${item.sha}`);
  }

  async function handleDelete() {
    try {
      await deleteitem(deleteData);
      ref.reload();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }

  async function deleteitem(item: any) {
    try {
      await auth.client.CustomCommand({
        command: "removegitrepo",
        // @ts-ignore
        data: { reponame: item.repo },
        jwt: auth.access_token,
      });
      const databasename = item.repo.split("/").join("_");
      await cleanDB(databasename);

      toast.success("Git repo deleted");
      ref.reload();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message,
      });
    }
  }

  async function cleanDB(name: string) {
    // i want to delete only this db dbname change the code bellow for this
    indexedDB
      .databases()
      .then((r) => {
        for (const db of r) {
          let dbname = db.name as any;
          if (dbname == name) {
            const DBDeleteRequest = window.indexedDB.deleteDatabase(dbname);
            DBDeleteRequest.onerror = (event) => {};
            DBDeleteRequest.onsuccess = (event) => {};
          }
        }
        // toast.success("DB deleted successfully!" + name);
      })
      .catch((error) => {
        toast.error("Error deleting local DB: " + error.message);
      });
  }
</script>

<div class="sm:flex space-y-4 sm:space-y-0 justify-between mb-4 sm:space-x-5">
  <SearchInput bind:searchstring />

  <HotkeyButton
    title="Create Git Repository (Insert Key)"
    data-shortcut="ins"
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="Create Git Repository"
    onclick={() => {
      loading = true;
      goto(base + `/git/new`);
    }}
  >
    <SquarePlus />
    Create Git Repository</HotkeyButton
  >
</div>

<Entities
  bind:searchstring
  {single_item_click}
  total_count={data.total_count}
  collectionname={data.collectionname}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
  multi_select={false}
>
  {#snippet action(item: any)}
    <HotkeyButton
      aria-label="Edit"
      disabled={loading}
      onclick={() => single_item_click(item)}
      size="tableicon"
      variant="icon"
    >
      <Pencil />
    </HotkeyButton>
    <HotkeyButton
      variant="danger"
      aria-label="Delete"
      disabled={loading}
      onclick={() => {
        deleteData = item;
        showWarning = !showWarning;
      }}
      size="tableicon"
    >
      <Trash2 />
    </HotkeyButton>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleDelete}
></Warningdialogue>
