<script lang="ts">
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomSelect } from "$lib/customselect";
  import Entities from "$lib/entities/entities.svelte";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { History, Pencil, Plus, RefreshCcw, Trash2 } from "lucide-svelte";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";

  const { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);

  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let collections: any[] = $state(data.collections);
  let entities = $state(data.entities);
  let collectionname = $state("");
  collectionname = data.collectionname;
  let isAdmin = data.isAdmin;
  let showWarningEntityDelete = $state(false);
  let page = $derived(() => "entities-" + collectionname);
  function single_item_click(item: any) {
    goto(base + `/entities/${collectionname}/edit/${item._id}`);
  }
</script>

<Searchinput bind:searchstring class="xl:w-[240px]" />

<Entities
  {collectionname}
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
