<script lang="ts" module>
  export let page = "auditlog";
  export let collectionname = "audit";
  export let query = {};
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { MapPinHouse, Pencil } from "lucide-svelte";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let entities = $state(data.entities);

  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
</script>

<SearchInput bind:searchstring />

<Entities
  {collectionname}
  {query}
  bind:searchstring
  {page}
  {single_item_click}
  total_count={data.total_count}
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet action(item: any)}
    <HotkeyButton
      title="View on map"
      aria-label="view"
      disabled={loading}
      onclick={() => {
        window.open(
          `https://www.iplocation.net/?query=${item.remoteip}`,
          "_blank",
        );
      }}
      size="tableicon"
      variant="icon"><MapPinHouse /></HotkeyButton
    >
    <HotkeyButton
      title="Edit"
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
