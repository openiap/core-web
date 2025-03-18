<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { StatusCard } from "$lib/statuscard/index.js";
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
  }
</script>

<div class="mb-4">
  <SearchInput bind:searchstring />
</div>

<Entities
  collectionname={data.collectionname}
  show_delete={false}
  multi_select={false}
  query={{}}
  bind:searchstring
  {single_item_click}
  total_count={data.total_count}
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet success(item: any)}
  <StatusCard
    title={item.success ? "Success" : "Failed"}
  />
{/snippet}
  {#snippet action(item: any)}
    <HotkeyButton
      aria-label="View on Map"
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
  {/snippet}
</Entities>
