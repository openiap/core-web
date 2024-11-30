<svelte:head>
	<title>Users</title>
	<meta name="description" content="Get performance data and generates index suggestions for better database performance" />
</svelte:head>
<script lang="ts">
  import { Entities } from "$lib/components/ui/entities/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { HotkeyInput } from "$lib/components/ui/hotkeyinput/index.js";
  import { Label } from "$lib/components/ui/label/index.js";


  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { settings } from "$lib/stores/settings.svelte";

  function reset() {
    settings.clearall();
    goto(base + `/`);
  }

  let defaultcolumnnames = ['name', 'status', 'method', 'amount'];
  let query = { _type: "role" };
  let searchstring = $state("");
</script>
<div class="flex w-full max-w-sm flex-col gap-1.5">
  <Label for="email">Search</Label>
  <div class="flex gap-1.5">
    <HotkeyInput type="text" id="searchstring" placeholder="Searchstring or JSON query" bind:value={searchstring} 
    data-shortcut={"Control+f,Meta+f"} />
    <Button onclick={reset}>Reset</Button>
  </div>
</div>
<Entities defaultcolumnnames2={defaultcolumnnames} collectionname="users" {query} {searchstring}>
</Entities>
