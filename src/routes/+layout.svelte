<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';

	import { page } from "$app/stores";
	import { base } from "$app/paths";
	let { children } = $props();

	import { Button } from "$lib/components/ui/button/index.js";
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import { pushState } from "$app/navigation";

	let name = $state("Svelte");

	if ($page.url.search.includes("code=")) {
		console.log("Code", $page.url.searchParams.get("code"));
		try {
			auth.isLoaded = false;
			auth.userManager
				.signinRedirectCallback()
				.then(async function (user) {
					pushState(base + "/", {});
					await auth.loadUserAndClient();
				})
				.catch((error) => {
					console.debug(error);
				});
		} catch (error) {}
		//
	}

	
</script>

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

	<footer>
		<p>
			<i><small>OpenCore © - OpenIAP ApS - 2024</small></i>
			<!-- visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to learn about SvelteKit -->
		</p>
	</footer>
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

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	/* footer a {
		font-weight: bold;
	} */

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
