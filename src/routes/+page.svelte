<script lang="ts">
  import { base } from "$app/paths";
  import { page } from "$app/stores";
  import { pushState } from "$app/navigation";
  import { auth } from "$lib/stores/auth.svelte";

  let name = $state("Svelte");

  let code = $page.url.search.includes("code=")
    ? $page.url.searchParams.get("code")
    : null;
  // if (code != null && code != "") {

  if ($page.url.search.includes("code=")) {
    console.log("code found", code);

    auth.loadUserAndClient().catch((error) => {
      
      auth.userManager
      .signinRedirectCallback()
      .then(async function (user) {
        pushState(base + "/", {});
        await auth.loadUserAndClient();
      })
      .catch((error) => {
        console.debug(error);
      });

      
    });

    // auth.isLoaded = false;
  }
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
