<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { Pencil, SquarePlus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let deleteData: any = $state({});

  function single_item_click(item: any) {
    goto(base + `/git/${item._id}/commit/${item.sha}`);
  }
</script>

<div class="sm:flex space-y-4 sm:space-y-0 justify-between mb-4 sm:space-x-5">
  <SearchInput bind:searchstring />

  <HotkeyButton
    title="Create Git Repository (Insert Key)"
    data-shortcut="ins"
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="Create Git Repository"
    onclick={() => {
      loading = true;
      goto(base + `/git/new`);
    }}
  >
    <SquarePlus />
    Create Git Repository</HotkeyButton
  >
</div>

<Entities
  multi_select={false}
  bind:searchstring
  {single_item_click}
  total_count={data.total_count}
  collectionname={data.collectionname}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet action(item: any)}
    <HotkeyButton
      aria-label="Edit"
      disabled={loading}
      onclick={() => single_item_click(item)}
      size="tableicon"
      variant="icon"
    >
      <Pencil />
    </HotkeyButton>
  {/snippet}
</Entities>
