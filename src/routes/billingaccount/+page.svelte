<script lang="ts" module>
  export let page = "billingaccount";
  export let collectionname = "users";
  export let query = { _type: "billingaccount" };
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import {
    data as data1,
    data as datacomponent,
  } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { DollarSign, Filter, Pencil, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});

  async function deleteitem(item: any) {
    try {
      await auth.client.CustomCommand({
        command: "removebilling",
        id: item._id,
      });
      toast.success("Billing acccount removed");
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
  function open_billing(item: any) {
    goto(base + `/${page}/${item._id}/billing`);
  }
  async function handleAccept() {
    await deleteitem(deleteData);
    entities = await data1.GetData(
      page,
      collectionname,
      query,
      auth.access_token,
    );
  }
</script>

<div class="flex justify-between">
  <div class="flex gap-2 w-full">
    <SearchInput bind:searchstring />
    <HotkeyButton
      size="sm"
      variant="base"
      aria-label="Filter"
      class="border-dashed dark:text-bw600"
    >
      <Filter />
      Filter</HotkeyButton
    >
  </div>

  <HotkeyButton
    size="sm"
    variant="base"
    aria-label="Create Billing Account"
    onclick={() => goto(base + `/${page}/new`)}
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
  bind:selected_items
  bind:entities
>
  {#snippet action(item: any)}
    <HotkeyButton
      aria-label="Billing"
      onclick={() => open_billing(item)}
      size="tableicon"
      variant="icon"
    >
      <DollarSign />
    </HotkeyButton>
    <HotkeyButton
      aria-label="Edit"
      onclick={() => single_item_click(item)}
      size="tableicon"
      variant="icon"
    >
      <Pencil />
    </HotkeyButton>
    <HotkeyButton
      aria-label="Delete"
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
