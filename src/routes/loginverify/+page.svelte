<script lang="ts">
  import { browser } from "$app/environment";
  import { auth } from "$lib/stores/auth.svelte";
  if (browser) {
    window.localStorage.removeItem("redirect");
		auth.login();
  }
</script>
