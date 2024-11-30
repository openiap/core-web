<svelte:head>
	<title>Users</title>
	<meta name="description" content="Get performance data and generates index suggestions for better database performance" />
</svelte:head>
<script lang="ts">
  import { Entities } from "$lib/components/ui/entities/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { settings } from "$lib/stores/settings.svelte";

  function reset() {
    settings.clearall();
    goto(base + `/`);
  }

  let defaultcolumnnames = ['name', 'status', 'method', 'amount'];
</script>
<Button onclick={reset}>Reset</Button>
<Entities defaultcolumnnames2={defaultcolumnnames}>
</Entities>
