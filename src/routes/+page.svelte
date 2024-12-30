<script lang="ts">
  import { browser } from "$app/environment";
  import { base } from "$app/paths";
    import { auth } from "$lib/stores/auth.svelte";
  let { data } = $props();
  if (data.redirect == true && browser) {
    setTimeout(() => {
      window.location.href = base + "/";
    }, 500);
  }
  let name = auth.profile?.name || "World";
</script>
<h1>Hello {name}!</h1>
<p>
  Visit <a href="https://docs.openiap.io/">docs.openiap.io</a> to read the documentation
</p>
