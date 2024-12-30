<script lang="ts" module>
  export let page = "mailhistory";
  export let collectionname = "mailhist";
  export let query = {};
</script>

<script lang="ts">
  import { Entities } from "$lib/entities/index.js";
  import { Eye, Pencil } from "lucide-svelte";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  const title = "Mail History";
  let collectionname = "mailhist";
  let searchstring = $state(data.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);

  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
</script>

<div class="mb-4 font-bold">All {title}</div>
<Searchinput bind:searchstring />
<Entities
  {collectionname}
  {query}
  bind:searchstring
  multi_select={false}
  {page}
  {single_item_click}
  bind:selected_items
  bind:entities
>
  {#snippet action(item: any)}
    <Button
      aria-label="view"
      onclick={() => goto(base + `/${page}/${item._id}`)}
      size="icon"
      variant="secondary"
      title="view"
    >
      <Eye />
    </Button>
    <Button
      title="edit"
      aria-label="edit"
      onclick={() => goto(base + `/user/${item._createdbyid}`)}
      size="icon"
      variant="secondary"
    >
      <Pencil />
    </Button>
  {/snippet}
</Entities>
