<script lang="ts">
	import Header from "./Header.svelte";
	import "../app.css";
	import { auth } from "$lib/stores/auth.svelte";
	let { children, data } = $props();
	import { ModeWatcher } from "mode-watcher";
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import AppSidebar from "$lib/sidebar/app-sidebar.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { usersettings } from "$lib/stores/usersettings.svelte.js";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	usersettings.stateload(data.usersettings);
	let pagename = $derived(() =>
		$page.url.pathname.replace(base, "").replace("/", ""),
	);
</script>

<svelte:head>
	<title>OpenCore {pagename()}</title>
	<meta
		name="description"
		content="Get performance data and generates index suggestions for better database performance"
	/>
</svelte:head>
<ModeWatcher />
{#if $page.url.pathname != base + "/login" && $page.url.pathname != base + "/loginscreen"}
	<div class="app">
		<Sidebar.Provider>
			<AppSidebar />
			<Sidebar.Inset>
				<header
					class="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4"
				>
					<div class="flex items-center">
						<Sidebar.Trigger class="-ml-1" />
						<!-- <Separator orientation="vertical" class="mr-2 h-4" />
						<Breadcrumb.Root>
							<Breadcrumb.List>
								<Breadcrumb.Item class="hidden md:block">
									<Breadcrumb.Link href="#"
										>Building Your Application</Breadcrumb.Link
									>
								</Breadcrumb.Item>
								<Breadcrumb.Separator class="hidden md:block" />
								<Breadcrumb.Item>
									<Breadcrumb.Page
										>Data Fetching</Breadcrumb.Page
									>
								</Breadcrumb.Item>
							</Breadcrumb.List>
						</Breadcrumb.Root> -->
					</div>
					<Header />
				</header>

				<div class="flex flex-1 flex-col gap-4 p-4">
					<main>
						{#if auth.isAuthenticated == true || auth.isAuthenticated == false}
							<!-- <p>Logged in</p> -->
							{@render children()}
						{:else}
							<!-- <p>Not logged in</p> -->
						{/if}
					</main>
				</div>
			</Sidebar.Inset>
		</Sidebar.Provider>

		<!-- <footer>
			<p>
				<i><small>OpenCore © - OpenIAP ApS - 2024</small></i>
			</p>
		</footer> -->
	</div>
{:else}
	{@render children()}
{/if}

<Toaster />

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
	} 

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}*/
</style>
