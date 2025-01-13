<script lang="ts">
	import { browser } from "$app/environment";
	import { goto } from "$app/navigation";
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import { data as datacomponent } from "$lib/entities/data.svelte.js";
	import AppSidebar from "$lib/sidebar/app-sidebar.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { usersettings } from "$lib/stores/usersettings.svelte";
	import { ModeWatcher } from "mode-watcher";
	import "../app.css";
	import Header from "./Header.svelte";
	import type { Workspace } from "./workspace/schema.js";

	let { children, data } = $props();
	datacomponent.parsesettings(data.settings);
	const { wsurl, protocol, domain, client_id, profile, origin } = data;
	let { access_token } = data;

	let _workspaces = data.workspaces;
	let workspaces = $state(_workspaces);
	let currentworkspace = $state(usersettings.currentworkspace);
	let pagename = $derived(() =>
		$page.url.pathname.replace(base, "").replace("/", ""),
	);
	async function loadWorkspaces() {
		workspaces = await auth.client.Query<Workspace>({
			collectionname: "users",
			query: { _type: "workspace" },
			jwt: access_token,
			top: 5,
		});
	}
	async function update_currentworkspace(workspaceid: string) {
		usersettings.currentworkspace = workspaceid;
		currentworkspace = workspaceid;
		await loadWorkspaces();
		await usersettings.dopersist();
		if (workspaceid == null || workspaceid == "") {
			return;
		}
		// goto(base + "/workspace/" + workspaceid);
	}
	$effect(() => {
		if (usersettings.currentworkspace != currentworkspace) {
			update_currentworkspace(usersettings.currentworkspace);
		}
	});

	if (data.code != null && data.code != "") {
		if (browser) {
			auth.signinRedirectCallback().then(async (res) => {
				if (res) {
					access_token = await auth.clientinit(
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
					await usersettings.dbload(access_token);
					currentworkspace = usersettings.currentworkspace;
					await loadWorkspaces();
					const redirect = window.localStorage.getItem("redirect");
					window.localStorage.removeItem("redirect");
					goto(redirect || "/");
				}
			});
		}
	}
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
	<div class="overflow-hidden flex flex-col w-full h-screen ">
		<Sidebar.Provider>
			<AppSidebar
				{workspaces}
				{currentworkspace}
				{profile}
				{update_currentworkspace}
			/>
			<div class="flex flex-col w-full">
				<Header />
				<div
					class="border border-gray-300 dark:border-bw500 dark:bg-bw800 rounded-xl mb-4 mx-4 h-full overflow-auto"
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
	:global(body) {
		overflow: hidden;
	}
	main {
		padding: 1.25rem 1.5rem;
		width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
