<script lang="ts" module>
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { Eraser, Pencil, SquarePlus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let query = { _type: "workitemqueue" };

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let showWarningPurge = $state(false);
  let purgeQueueData: any = $state();
  let deleteData: any = $state({});

  async function deleteitem(item: any) {
    try {
      await auth.client.DeleteWorkItemQueue({
        wiqid: item._id,
        jwt: auth.access_token,
      });
      selected_items = selected_items.filter((i) => i !== item._id);
      toast.success("Deleted successfully", {
        description: "Deleted " + item.name + " item(s)",
      });
      ref.reload();
      datacomponent.persist();
    } catch (error:any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  function single_item_click(item: any) {
    goto(base + `/workitemqueue/${item._id}`);
  }
  async function GetData() {
    ref.reload();
  }
  async function handleAccept() {
    try {
      await deleteitem(deleteData);
      await GetData();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }

  async function handleAcceptPurge() {
    try {
      loading = true;
      let data = JSON.parse(JSON.stringify(purgeQueueData));
      data._created = new Date(data._created);
      data._modified = new Date(data._modified);
      await auth.client.UpdateWorkitemQueue({
        workitemqueue: data,
        purge: true,
        skiprole: false,
        jwt: auth.access_token,
      });

      toast.success("Data purged");
    } catch (error: any) {
      toast.error("Error while purging", {
        description: error.message,
      });
    }
    loading = false;
  }
  async function deleteitems(ids: string[]) {
    let haderror = false;
    loading = true;
    showWarning = false;
    let counter = 0;
    try {
      for (let i = 0; i < ids.length; i++) {
        let id = ids[i];
        var item = entities.find((x: any) => x._id == id);
        if (item) {
          try {
            await auth.client.DeleteWorkItemQueue({
              wiqid: item._id,
              jwt: auth.access_token,
            });
            counter++;
            selected_items = selected_items.filter((x: any) => x != item._id);
            GetData();
          } catch (error: any) {
            haderror = true;
            toast.error("Error while deleting", {
              description: error.message,
            });
            return;
          }
        }
      }
      if (!haderror) {
        toast.success("Successfully deleted " + counter + " workitemqueue(s)", {
          description: "",
        });
      }
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
    datacomponent.persist();
  }
</script>

<div class="lg:flex space-y-4 lg:space-y-0 justify-between mb-4 lg:space-x-5">
  <SearchInput bind:searchstring />
  <HotkeyButton
    title="Create Work Item Queue (Insert Key)"
    data-shortcut="ins"
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="Create Work Item Queue"
    onclick={() => {
      loading = true;
      goto(base + `/workitemqueue/new/`);
    }}
  >
    <SquarePlus />
    Create Work Item Queue</HotkeyButton
  >
</div>

<Entities
  collectionname={data.collectionname}
  {query}
  bind:searchstring
  page={data.page}
  {single_item_click}
  delete_selected={deleteitems}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet action(item: any)}
    <div class="flex items-center justify-end space-x-2">
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
        aria-label="Purge"
        disabled={loading}
        onclick={() => {
          purgeQueueData = item;
          showWarningPurge = true;
        }}
        size="tableicon"
        variant="icon"
      >
        <Eraser />
      </HotkeyButton>
      <HotkeyButton
        aria-label="Delete"
        disabled={loading}
        onclick={() => {
          deleteData = item;
          showWarning = !showWarning;
        }}
        size="tableicon"
        variant="danger"
      >
        <Trash2 />
      </HotkeyButton>
    </div>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>

<Warningdialogue
  bind:showWarning={showWarningPurge}
  type="purgequeue"
  onaccept={handleAcceptPurge}
></Warningdialogue>
