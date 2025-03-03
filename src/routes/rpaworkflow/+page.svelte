<script lang="ts" module>
  export let page = "rpaworkflow";
  export let collectionname = "openrpa";
  export let query = { _type: "workflow" };
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { Pencil } from "lucide-svelte";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  function single_item_click(item: any) {
    goto(base + `/entities/hdrobots/${item._id}`);
  }
</script>

<div class="mb-4">
  <Searchinput bind:searchstring />
</div>
<Entities
  {collectionname}
  {query}
  bind:searchstring
  {page}
  {single_item_click}
  multi_select={false}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet action(item: any)}
    <div class="flex items-center justify-end space-x-2">
      <Button
        aria-label="Edit"
        disabled={loading}
        onclick={() => single_item_click(item)}
        size="icon"
        variant="secondary"
      >
        <Pencil />
      </Button>
    </div>
  {/snippet}
</Entities>
