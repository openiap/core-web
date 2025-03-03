<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { DollarSign, Pencil, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let ref: any;
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});
  let page = "billingaccount";
  let collectionname = "users";
  let query = { _type: "customer" };
  let loading = $state(false);

  async function deleteitem(item: any) {
    try {
      loading = true;
      await auth.client.CustomCommand({
        command: "removebilling",
        id: item._id,
        jwt: auth.access_token,
      });
      toast.success("Billing acccount removed");
      ref.reload();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    } finally {
      loading = false;
    }
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
            await auth.client.CustomCommand({
              command: "removebilling",
              id: item._id,
              jwt: auth.access_token,
            });
            counter++;
            selected_items = selected_items.filter((x: any) => x != item._id);
            ref.reload();
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
        toast.success("Successfully deleted " + counter + " agent(s)", {
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
  }
  function single_item_click(item: any) {
    goto(base + `/billingaccount/${item._id}`);
  }
  function open_billing(item: any) {
    goto(base + `/billingaccount/${item._id}/billing`);
  }
  async function handleAccept() {
    await deleteitem(deleteData);
  }
</script>

<div
  class="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4 xl:flex xl:justify-between xl:items-center mb-4"
>
  <SearchInput bind:searchstring />
  <HotkeyButton
    title="Create Billing Account (insert key)"
    data-shortcut="ins"
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="Create Billing Account"
    onclick={() => {
      loading = true;
      goto(base + `/billingaccount/new`);
    }}
  >
    <Plus />
    Create Billing Account</HotkeyButton
  >
</div>

<Entities
  {collectionname}
  {query}
  bind:searchstring
  {page}
  {single_item_click}
  total_count={data.total_count}
  delete_selected={deleteitems}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet action(item: any)}
    <HotkeyButton
      aria-label="Billing"
      onclick={() => open_billing(item)}
      disabled={loading}
      size="tableicon"
      variant="icon"
    >
      <DollarSign />
    </HotkeyButton>
    <HotkeyButton
      aria-label="Edit"
      onclick={() => single_item_click(item)}
      disabled={loading}
      size="tableicon"
      variant="icon"
    >
      <Pencil />
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
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>
