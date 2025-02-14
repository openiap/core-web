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
	import { sidemenu } from "$lib/stores/sidemenu.svelte";
	import { usersettings } from "$lib/stores/usersettings.svelte";
	import { ModeWatcher } from "mode-watcher";
	import { toast } from "svelte-sonner";
	import "../app.css";
	import Header from "./Header.svelte";
	import type { Workspace } from "./workspace/schema.js";

	let { children, data } = $props();
	datacomponent.parsesettings(data.settings);
	const { wsurl, protocol, domain, client_id, profile, origin } = data;
	let { access_token } = data;
	if (auth.config != null) {
		console.log(
			"core-web version",
			data.webversion,
			"git commit",
			data.webcommit,
		);
	} else if (browser) {
		console.log("core-web not initialized, is opencore down?");
	}

	let _workspaces = data.workspaces;
	let workspaces = $state(_workspaces);
	let currentworkspace = $state(usersettings.currentworkspace);
	let pagename = $derived(() =>
		$page.url.pathname.replace(base, "").replace("/", ""),
	);
	async function loadWorkspaces() {
		try {
			workspaces = await auth.client.Query<Workspace>({
				collectionname: "users",
				query: { _type: "workspace" },
				jwt: access_token,
				top: 5,
			});
			if (
				usersettings.currentworkspace != null &&
				usersettings.currentworkspace != ""
			) {
				let exists = workspaces.find(
					(x) => x._id == usersettings.currentworkspace,
				);
				if (exists == null) {
					let _workspace = await auth.client.FindOne<Workspace>({
						collectionname: "users",
						query: {
							_type: "workspace",
							_id: usersettings.currentworkspace,
						},
						jwt: access_token,
					});
					if (_workspace != null) {
						workspaces.pop();
						workspaces.unshift(_workspace);
					}
				}
			}
		} catch (error: any) {
			if (browser) {
				toast.error("Error assigning resource", {
					description: error.message,
				});
			}
		}
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
	<div
		class={`flex flex-col w-full h-screen dark:text-bw100 font-custom max-w-full`}
	>
		<Sidebar.Provider open={sidemenu.status}>
			<AppSidebar
				{workspaces}
				{currentworkspace}
				{profile}
				{update_currentworkspace}
			/>
			<Sidebar.Inset class="overflow-hidden">
				<Header />
				<div
					class="border border-gray-300 bg-white dark:border-bw500 dark:bg-bw800 rounded-xl mb-4 mx-4 h-full overflow-auto tourcontent px-4 py-5 page"
				>
					{#if auth.isAuthenticated == true || auth.isAuthenticated == false}
						{@render children()}
					{/if}
				</div>
			</Sidebar.Inset>
		</Sidebar.Provider>
	</div>
{:else}
	{@render children()}
{/if}

<Toaster />

<style>
	.page {
		display: flex;
		flex-direction: column;
		height: 100%;
		/* This ensures it fills the entire window height */
	}
</style>
