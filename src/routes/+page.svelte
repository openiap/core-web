<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/stores/auth.svelte";
  let { data } = $props();
  if (data.code != null && data.code != "") {
    if (browser) {
      auth.signinRedirectCallback();
      goto("/");
    }
  } else {
    if (browser) {
      const redirect = window.localStorage.getItem("redirect");
      window.localStorage.removeItem("redirect");
      if(redirect) {
        goto(redirect);
      }
      
    }
  }
  let name = auth.profile?.name || "World";
</script>

<h1>Hello {name}!</h1>
<p>
  Visit <a href="https://docs.openiap.io/">docs.openiap.io</a> to read the documentation
</p>
