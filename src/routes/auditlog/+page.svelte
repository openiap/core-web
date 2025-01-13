<script lang="ts" module>
  export let page = "auditlog";
  export let collectionname = "audit";
  export let query = {};
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { MapPinHouse, Pencil } from "lucide-svelte";

  let { data } = $props();
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
      onclick={() => single_item_click(item)}
      size="icon"
      variant="secondary"
    >
      <Pencil />
    </Button>
  {/snippet}
</Entities>
