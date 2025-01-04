<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/stores/auth.svelte";
  let { data } = $props();
  const { wsurl, protocol, domain, client_id, access_token, profile, origin } = data;
  let name = $derived(() => auth.profile?.name || "World");
  if (data.code != null && data.code != "") {
    if (browser) {
      auth.signinRedirectCallback().then(async (res) => {
        if (res) {
          await auth.clientinit(
            wsurl,
            protocol,
            domain,
            client_id,
            origin,
            access_token,
            profile,
            fetch,
            null,
          );
          const redirect = window.localStorage.getItem("redirect");
          window.localStorage.removeItem("redirect");
          goto(redirect || "/");
        }
      });
    }
  }
</script>

<h1>Hello {name()}!</h1>
<p>
  Visit <a href="https://docs.openiap.io/">docs.openiap.io</a> to read the documentation
</p>
