<script lang="ts" module>
  export let page = "client";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { MapPinHouse, User } from "lucide-svelte";

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

<div class="mb-4">
  <Searchinput bind:searchstring />
</div>

<Entities
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
      title="go to user"
      aria-label="go to user"
      disabled={loading}
      onclick={() => goto(base + `/user/${item.user._id}`)}
      size="tableicon"
      variant="icon"><User /></HotkeyButton
    >
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
  {/snippet}
</Entities>
