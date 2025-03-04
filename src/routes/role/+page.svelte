<script lang="ts" module>
  export let page = "role";
  export let collectionname = "users";
  export let query = { _type: "role" };
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { Pencil, Plus, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  async function deleteitem(item: any) {
    const deletecount = await auth.client.DeleteOne({
      id: item._id,
      collectionname,
      jwt: auth.access_token,
    });
    if (deletecount == 1) {
      selected_items = selected_items.filter((i) => i !== item._id);
      ref.reload();
    } else {
      toast.error("Error", {
        description: "Error deleting item",
      });
    }
  }
  function single_item_click(item: any) {
    goto(base + `/${page}/${item._id}`);
  }
</script>

<div
  class="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4 mb-4 xl:flex xl:justify-between xl:items-center"
>
  <SearchInput bind:searchstring />
  <HotkeyButton
    title="Create Role (Insert Key)"
    data-shortcut="ins"
    size="sm"
    variant="base"
    disabled={loading}
    aria-label="Create Role"
    onclick={() => {
      loading = true;
      goto(base + `/${page}/new/`);
    }}
  >
    <Plus />
    Create Role</HotkeyButton
  >
</div>

<Entities
  {collectionname}
  {query}
  bind:searchstring
  {page}
  {single_item_click}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet members(item: any)}
    {item.members?.length}
  {/snippet}
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
    <HotkeyButton
      aria-label="Delete"
      disabled={loading}
      onclick={() => deleteitem(item)}
      size="tableicon"
      variant="danger"
    >
      <Trash2 />
    </HotkeyButton>
  {/snippet}
</Entities>
