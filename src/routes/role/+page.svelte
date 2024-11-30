<svelte:head>
	<title>Users</title>
	<meta name="description" content="Get performance data and generates index suggestions for better database performance" />
</svelte:head>
<script lang="ts">
  import { Entities } from "$lib/components/ui/entities/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { settings } from "$lib/stores/settings.svelte";

  function reset() {
    settings.clearall();
    goto(base + `/`);
  }

  let defaultcolumnnames = ['_id', 'name', 'rparole', '_created'];
  let collectionname ="users";
  let page = "roles";
  let query = { _type: "role" };
  let searchstring = $state("");
  searchstring = settings.getvalue(page, "searchstring", "");
</script>
<div class="flex w-full max-w-sm flex-col gap-1.5">
  <Label for="email">Search</Label>
  <div class="flex gap-1.5">
    <HotkeyInput type="text" id="searchstring" placeholder="Searchstring or JSON query" bind:value={searchstring} 
    data-shortcut={"Control+f,Meta+f"} />
    <HotkeyButton onclick={reset}>Reset</HotkeyButton>
  </div>
</div>
<Entities defaultcolumnnames={defaultcolumnnames} {collectionname} {query} {searchstring} {page}>
</Entities>
