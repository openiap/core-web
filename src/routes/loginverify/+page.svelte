<script lang="ts">
  import { browser } from "$app/environment";
  import { auth } from "$lib/stores/auth.svelte";
  if (browser) {
		auth.login();
  }
</script>
