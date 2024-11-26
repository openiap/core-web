<svelte:head>
	<title>OpenCore Index Advisor</title>
	<meta name="description" content="Get performance data and generates index suggestions for better database performance" />
</svelte:head>
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  
  import pkg from "oidc-client";
  import { base } from "$app/paths";
  import { page } from "$app/stores";
  import { pushState } from "$app/navigation";
  import { auth } from "$lib/stores/auth.svelte";
  import { openiap } from "@openiap/jsapi";
  const { UserManager, WebStorageStateStore } = pkg;

  let name = $state("Svelte");

  const settings = {
    authority: "https://app.openiap.io/oidc",
    client_id: "webapp",
    redirect_uri: window.location.origin + base + "/",
    response_type: "code",
    scope: "openid profile email",
    post_logout_redirect_uri: window.location.origin + base + "/",
    userStore: new WebStorageStateStore({ store: window.localStorage }),
  };
  const userManager = new UserManager(settings);
  if ($page.url.search.includes("code=")) {
    console.log("Code", $page.url.searchParams.get("code"));
    try {
      userManager.signinRedirectCallback().then(async function (user) {
        pushState(base + "/", {});
        const result = await userManager.getUser();
        if (result != null) {
          auth.profile = result.profile;
          auth.access_token = result.access_token;
          name = result.profile.name as any;
          auth.isAuthenticated = true;
          auth.ensureClient();
        }
      }).catch((error) => {
        console.debug(error);
      });
    } catch (error) {}
    //
  }

  function login() {
    userManager.signinRedirect();
  }
  function logout() {
    userManager.signoutRedirect();
  }
  
  const result = userManager.getUser().then((result) => {
    if (result != null) {
      auth.profile = result.profile;
      auth.access_token = result.access_token;
      name = result.profile.name as any;
      auth.isAuthenticated = true;
      auth.ensureClient();
    }
  });

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
<a href="/user">Users</a>
