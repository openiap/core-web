<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { Eye, Pencil } from "lucide-svelte";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);

  function single_item_click(item: any) {
    goto(base + `/mailhistory/${item._id}`);
  }
</script>

<div class="mb-4">
  <SearchInput bind:searchstring />
</div>
<Entities
  bind:searchstring
  multi_select={false}
  {single_item_click}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet action(item: any)}
    <HotkeyButton
      aria-label="View"
      disabled={loading}
      onclick={() => single_item_click(item)}
      size="tableicon"
      variant="icon"
    >
      <Eye />
    </HotkeyButton>
    <HotkeyButton
      aria-label="Edit"
      disabled={loading}
      onclick={() => goto(base + `/user/${item.userid}`)}
      size="tableicon"
      variant="icon"
    >
      <Pencil />
    </HotkeyButton>
  {/snippet}
</Entities>
