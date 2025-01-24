<script lang="ts" module>
  export let page = "mailhistory";
  export let collectionname = "mailhist";
  export let query = {};
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { Eye, Pencil } from "lucide-svelte";

  let { data } = $props();
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
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
  multi_select={false}
  {page}
  {single_item_click}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
>
  {#snippet action(item: any)}
    <HotkeyButton
      aria-label="view"
      onclick={() => single_item_click(item)}
      size="tableicon"
      variant="icon"
      title="view"
    >
      <Eye />
    </HotkeyButton>
    <HotkeyButton
      title="edit"
      aria-label="edit"
      onclick={() => goto(base + `/user/${item._createdbyid}`)}
      size="tableicon"
      variant="icon"
    >
      <Pencil />
    </HotkeyButton>
  {/snippet}
</Entities>
