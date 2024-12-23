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
	<div>
		<Sidebar.Provider>
			<AppSidebar />
			<Sidebar.Inset>
				<header
					class="flex h-16 shrink-0 items-center justify-between gap-2 px-4 bg-gradient-to-r from-lightgradident1 to-lightgradident2 dark:bg-gradient-to-r dark:from-darkgradident1 dark:to-darkgradident2 rounded m-2"
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

				<div
					class="border border-gray-300 dark:border-gray-400 rounded m-2 h-full overflow-auto"
				>
					{#if auth.isAuthenticated == true || auth.isAuthenticated == false}
						<!-- <p>Logged in</p> -->
						<main>
							{@render children()}
						</main>
						<!-- {#if pagename() == "entities"}
							{@render children()}
						{:else}
							<main>
								{@render children()}
							</main>
						{/if} -->
					{:else}
						<!-- <p>Not logged in</p> -->
					{/if}
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
	main {
		padding: 2rem 1.5rem;
		width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
