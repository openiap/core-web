<script lang="ts" module>
  export let page = "auditlog";
  export let collectionname = "audit";
  export let query = {};
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { MapPinHouse, Pencil } from "lucide-svelte";

  let { data } = $props();
  let searchstring = $state(data.searchstring);
  let entities = $state(data.entities);

  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
</script>

<div class="mb-4 font-bold">All {page}s</div>

<SearchInput bind:searchstring />

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
    <Button
      title="Edit"
      aria-label="edit"
      onclick={() => goto(base + `/${page}/${item._id}`)}
      size="icon"
      variant="secondary"
    >
      <Pencil />
    </Button>
  {/snippet}
</Entities>
