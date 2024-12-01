<script lang="ts">
	import Header from "./Header.svelte";
	import "../app.css";

	import { auth } from "$lib/stores/auth.svelte";
	let { children, data } = $props();
	
	auth.config = data.config;
	auth.origin = data.origin;
	auth.baseurl = data.baseurl;
	auth.wsurl = data.wsurl;
	auth.clientinit()

	import { Button } from "$lib/components/ui/button/index.js";
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import { pushState } from "$app/navigation";

	if ($page.url.search.includes("code=")) {
		console.debug("Code", $page.url.searchParams.get("code"));
		auth.userManager
			.signinRedirectCallback()
			.then(async function (user:any) {
				pushState(base + "/", {});
				await auth.loadUserAndClient();
			})
			.catch((error:any) => {
				console.debug(error);
			});
	}
	let pagename = $derived(()=> $page.url.pathname.replace(base, "").replace("/", ""));
</script>
<svelte:head>
  <title>OpenCore {pagename()}</title>
  <meta
    name="description"
    content="Get performance data and generates index suggestions for better database performance"
  />
</svelte:head>

{#if $page.url.pathname != base + "/login" && $page.url.pathname != base + "/loginscreen"}
	<div class="app">
		<Header />

		<main>
			{#if auth.isAuthenticated == true}
				<!-- <p>Logged in</p> -->
				{@render children()}
			{:else}
				<!-- <p>Not logged in</p> -->
			{/if}
		</main>

		<!-- <footer>
			<p>
				<i><small>OpenCore © - OpenIAP ApS - 2024</small></i>
			</p>
		</footer> -->
	</div>
{:else}
	{@render children()}
{/if}

<style>
	/* .app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	} */

	/* main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	} */
	main {
		padding: 1rem;
		width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
	}
/* 
	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	} */

	/* footer a {
		font-weight: bold;
	} */

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
