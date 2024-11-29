<svelte:head>
	<title>OpenCore Index Advisor</title>
	<meta name="description" content="Get performance data and generates index suggestions for better database performance" />
</svelte:head>
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { base } from "$app/paths";
  import { page } from "$app/stores";
  import { pushState } from "$app/navigation";
  import { auth } from "$lib/stores/auth.svelte";

  let name = $state("Svelte");

  if ($page.url.search.includes("code=")) {
    console.log("Code", $page.url.searchParams.get("code"));
    try {
      auth.isLoaded = false;
      auth.userManager.signinRedirectCallback().then(async function (user) {
        pushState(base + "/", {});
        await auth.loadUserAndClient();
      }).catch((error) => {
        console.debug(error);
      });
    } catch (error) {}
    //
  }

  function login() {
    auth.userManager.signinRedirect();
  }
  function logout() {
    auth.userManager.signoutRedirect();
  }
 
</script>

<h1>Hello {name}!</h1>
<p>
  Visit <a href="https://docs.openiap.io/">docs.openiap.io</a> to read the
  documentation
</p>
{#if auth.isAuthenticated == true}
  <Button onclick={logout}>Signout</Button>
{:else}
  <Button onclick={login}>Signin</Button>
{/if}
<a href="/user">Users</a> | <a href="/role">Roles</a>
