<svelte:head>
	<title>Users</title>
	<meta name="description" content="Get performance data and generates index suggestions for better database performance" />
</svelte:head>
<script lang="ts">
  import { Entities } from "$lib/components/ui/entities/index.js";

  let defaultcolumnnames = ['name', 'status', 'method', 'amount'];
</script>
<Entities defaultcolumnnames2={defaultcolumnnames}>

</Entities>
