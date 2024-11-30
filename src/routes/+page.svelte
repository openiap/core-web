<script lang="ts">
  import { auth } from "$lib/stores/auth.svelte";

  let name = $state("Svelte");
  auth.onLogin(() => {
    name = auth.profile.name as any;
  });
</script>

<svelte:head>
  <title>OpenCore Index Advisor</title>
  <meta
    name="description"
    content="Get performance data and generates index suggestions for better database performance"
  />
</svelte:head>

<h1>Hello {name}!</h1>
<p>
  Visit <a href="https://docs.openiap.io/">docs.openiap.io</a> to read the documentation
</p>
