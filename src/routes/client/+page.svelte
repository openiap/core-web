<script lang="ts" module>
  export let page = "client";
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { MapPinHouse, User } from "lucide-svelte";

  let { data } = $props();
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let entities = $state(data.entities);

  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
</script>

<Searchinput bind:searchstring />

<Entities
  bind:searchstring
  {page}
  {single_item_click}
  bind:entities
>
  {#snippet action(item: any)}
    <Button
      title="go to user"
      aria-label="go to user"
      onclick={() => goto(base + `/user/${item.user._id}`)}
      size="icon"
      variant="secondary"><User /></Button
    >
    <Button
      title="View on map"
      aria-label="view"
      onclick={() => {
        window.open(
          `https://www.iplocation.net/?query=${item.remoteip}`,
          "_blank",
        );
      }}
      size="icon"
      variant="secondary"><MapPinHouse /></Button
    >
  {/snippet}
</Entities>
