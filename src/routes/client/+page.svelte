<script lang="ts" module>
  export let page = "client";
  export let collectionname = "credential";
  export let query = { _type: "credential" };
</script>

<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { MapPinHouse, User } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import Searchinput from "$lib/searchinput/searchinput.svelte";

  let { data } = $props();
  let searchstring = $state(data.searchstring);
  let entities = $state(data.entities);

  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
</script>

<h1 class="font-bold mb-4">All {page}s</h1>

<Searchinput bind:searchstring />

<Entities
  {collectionname}
  {query}
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
