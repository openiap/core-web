<script lang="ts">
  import { auth } from "$lib/stores/auth.svelte";

  let name = $state("Svelte");
  auth.onLogin(() => {
    name = auth.profile.name as any;
  });
</script>
<h1>Hello {name}!</h1>
<p>
  Visit <a href="https://docs.openiap.io/">docs.openiap.io</a> to read the documentation
</p>
