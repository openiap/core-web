<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { CustomSwitch } from "$lib/customswitch";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { SearchInput } from "$lib/searchinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
  import { Pencil, Trash2 } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  let showWarning = $state(false);
  let showWarningToggle = $state(false);
  let deleteData: any = $state({});
  let toggleData: any = $state({});

  async function deleteitem(item: any) {
    const deletecount = await auth.client.DeleteOne({
      id: item._id,
      collectionname: "openrpa",
      jwt: auth.access_token,
    });
    if (deletecount == 1) {
      selected_items = selected_items.filter((i) => i !== item._id);
      ref.reload();
    } else {
      toast.error("Error while deleting", {
        description: "Error while deleting",
      });
    }
  }
  function single_item_click(item: any) {
    goto(base + `/entities/openrpa/edit/${item._id}`);
  }
  async function handleAccept() {
    try {
      await deleteitem(deleteData);
      ref.reload();
    } catch (error: any) {
      toast.error("Error while deleting", {
        description: error.message,
      });
    }
  }
  async function handleToggle() {
    try {
      let item = await auth.client.FindOne<any>({
        collectionname: "openrpa",
        query: { _id: toggleData._id },
        jwt: auth.access_token,
      });
      item.enabled = !item.enabled;
      await auth.client.UpdateOne({
        item: item,
        collectionname: "openrpa",
        jwt: auth.access_token,
      });
      toast.success("Updated successfully", {
        description: "",
      });
      ref.reload();
    } catch (error: any) {
      undoToggle();
      toast.error("Error while updating", {
        description: error.message,
      });
    }
  }
  function undoToggle() {
    entities = entities.map((entity: any) => {
      if (entity._id == toggleData._id) {
        entity.enabled = !entity.enabled;
      }
      return entity;
    });
  }
</script>

<div class="mb-4">
  <SearchInput bind:searchstring />
</div>
<Entities
  collectionname={data.collectionname}
  bind:searchstring
  {single_item_click}
  total_count={data.total_count}
  bind:selected_items
  bind:entities
  bind:this={ref}
  bind:loading
>
  {#snippet action(item: any)}
    <div class="flex items-center justify-end space-x-2">
      <CustomSwitch
        bind:checked={item.enabled}
        disabled={loading}
        onclick={() => {
          showWarningToggle = true;
          toggleData = item;
        }}
      ></CustomSwitch>
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
        onclick={() => {
          deleteData = item;
          showWarning = !showWarning;
        }}
        size="tableicon"
        variant="danger"
      >
        <Trash2 />
      </HotkeyButton>
    </div>
  {/snippet}
</Entities>

<Warningdialogue bind:showWarning type="delete" onaccept={handleAccept}
></Warningdialogue>

<Warningdialogue
  bind:showWarning={showWarningToggle}
  type="toggle"
  onaccept={handleToggle}
  oncancel={undoToggle}
></Warningdialogue>
