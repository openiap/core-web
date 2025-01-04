<script lang="ts">
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import Separator from "$lib/components/ui/separator/separator.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import AppSidebar from "$lib/sidebar/app-sidebar.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { ModeWatcher } from "mode-watcher";
	import "../app.css";
	import Header from "./Header.svelte";

	let { children, data } = $props();
	const { workspaces } = data;
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
	<div class="overflow-hidden flex flex-col w-full h-screen">
		<Sidebar.Provider>
			<AppSidebar {workspaces} />
			<div class="flex flex-col w-full">
				<header
					class="flex h-16 shrink-0 items-center justify-between px-4 bg-gradient-to-b from-lightgradident1 to-lightgradident2 dark:bg-gradient-to-b dark:from-darkgradident1 dark:to-darkgradident2 rounded mx-2.5 my-2.5"
				>
					<div class="flex items-center">
						<Sidebar.Trigger class="-ml-1" />
						<Separator orientation="vertical" class="mr-2 h-4" />
						<Breadcrumb.Root>
							<Breadcrumb.List>
								{#each pagename().split("/") as page, index}
									<Breadcrumb.Item class="hidden md:block">
										{#if pagename().split("/").length - 1 !== index}
											<Breadcrumb.Link
												href="{base}/{page.trim()}"
												>{page.trim()}</Breadcrumb.Link
											>
										{:else}
											{page.trim()}
										{/if}
									</Breadcrumb.Item>
									{#if pagename().split("/").length - 1 !== index}
										<Breadcrumb.Separator
											class="hidden md:block"
										/>
									{/if}
								{/each}
							</Breadcrumb.List>
						</Breadcrumb.Root>
					</div>
					<Header />
				</header>

				<div
					class="border border-gray-300 dark:border-gray-400 rounded mb-2.5 mx-2.5 h-full overflow-auto"
				>
					{#if auth.isAuthenticated == true || auth.isAuthenticated == false}
						{#if pagename() == "entities"}
							{@render children()}
						{:else}
							<main>
								{@render children()}
							</main>
						{/if}
					{/if}
				</div>
			</div>
		</Sidebar.Provider>
	</div>
{:else}
	{@render children()}
{/if}

<Toaster />

<style>
	main {
		padding: 1.25rem 1.5rem;
		width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
