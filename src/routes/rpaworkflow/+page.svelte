<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { data as datacomponent } from "$lib/entities/data.svelte.js";
  import { Entities } from "$lib/entities/index.js";
  import { EntitySelector } from "$lib/entityselector/index.js";
  import Searchinput from "$lib/searchinput/searchinput.svelte";
  import { Pencil, Play } from "lucide-svelte";

  let { data } = $props();
  let ref: any;
  let loading = $state(false);
  let project = $state("");
  datacomponent.parsesettings(data.settings);
  let searchstring = $state(datacomponent.settings.searchstring);
  let selected_items = $state([]);
  let entities = $state(data.entities);
  function single_item_click(item: any) {
    goto(base + `/rpaworkflow/${item._id}`);
  }
</script>

<div class="lg:flex space-y-4 lg:space-y-0 mb-4 lg:space-x-5">
  <Searchinput bind:searchstring />
  <EntitySelector
    handleChangeFunction={async (value: any) => {
      if (value == "") {
        return (searchstring = "");
      }
      searchstring = JSON.stringify({ _type: "workflow", projectid: value });
    }}
    width="md:w-fit w-full"
    height="h-7"
    class="mb-10"
    disabled={loading}
    collectionname="openrpa"
    basefilter={{ _type: "project" }}
    bind:value={project}
    name="Project"
    allowunselect={true}
    propertyname="_id"
  >
    {#snippet rendername(item: any)}
      {item.name}
    {/snippet}
    {#snippet rendercontent(item: any)}
      {#if item == null}
        Filter by project
      {:else}
        {item.name}
      {/if}
    {/snippet}</EntitySelector
  >
</div>
<Entities
  collectionname={data.collectionname}
  bind:searchstring
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
      <HotkeyButton
        aria-label="Run Workflow"
        disabled={loading}
        onclick={() => single_item_click(item)}
        size="tableicon"
        variant="icon"
      >
        <Play />
      </HotkeyButton>
    </div>
  {/snippet}
</Entities>
