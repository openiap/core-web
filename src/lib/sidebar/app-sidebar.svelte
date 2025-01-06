<script lang="ts" module>
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import pkg from "oidc-client";
	// import { Volleyball } from "lucide-svelte";

	class SidebarCategory {
		title: string = $state("");
		hidden: boolean = $state(false);
		items: SidebarItem[] = $state([]);
		constructor(title: string, hidden: boolean, items: SidebarItem[]) {
			this.title = title;
			this.hidden = hidden;
			this.items = items;
		}
	}
	class SidebarItem {
		title: string = $state("");
		url: string = $state("");
		hidden: boolean = $state(false);
		external: boolean = $state(false);
		constructor(
			title: string,
			url: string,
			hidden: boolean,
			external: boolean = false,
		) {
			this.title = title;
			this.url = url;
			this.hidden = hidden;
			this.external = external;
		}
	}
	const home = new SidebarItem("Home", `${base}/`, false);
	const agent = new SidebarItem("Agents", `${base}/agent`, false);
	const workitem = new SidebarItem("Workitems", `${base}/workitem`, false);
	const formworkflow = new SidebarItem(
		"Form workflows",
		`${base}/workflow`,
		false,
	);
	const rpaworkflow = new SidebarItem(
		"RPA Workflows",
		`${base}/rpaworkflow`,
		false,
	);
	const grafana = new SidebarItem(
		"Grafana",
		`https://grafana.app.openiap.io/`,
		false,
		true,
	);
	const actions = new SidebarCategory("", false, [
		home,
		agent,
		workitem,
		formworkflow,
		rpaworkflow,
		grafana,
	]);
	const members = new SidebarItem("Members", `${base}/members`, false);
	const memberships = new SidebarItem("Memberships", `${base}/invites`, false);
	const workspace = new SidebarCategory("Workspace", false, [
		members, memberships,
	]);
	const entities = new SidebarItem("Entities", `${base}/entities`, false);
	const clients = new SidebarItem("Clients", `${base}/client`, false);
	const users = new SidebarItem("Users", `${base}/user`, false);
	const roles = new SidebarItem("Roles", `${base}/role`, false);
	const forms = new SidebarItem("Forms", `${base}/form`, false);
	const providers = new SidebarItem("Providers", `${base}/provider`, false);
	const resources = new SidebarItem("Resources", `${base}/resource`, true);
	const auditlogs = new SidebarItem("Audit logs", `${base}/auditlog`, false);
	const console = new SidebarItem("Console", `${base}/console`, true);
	const credentials = new SidebarItem("Credentials", `${base}/credential`, false);
	const config = new SidebarItem("Config", `${base}/configuration`, true);
	const customers = new SidebarItem("Customers", `${base}/customer`, true);
	const files = new SidebarItem("Files", `${base}/files`, false);
	const formresources = new SidebarItem("Form Resources", `${base}/formresource`, true);
	const hdrobots = new SidebarItem("HD Robots", `${base}/hdrobot`, true);
	const mailhistory = new SidebarItem("Mail History", `${base}/mailhistory`, true);
	const management = new SidebarCategory("Management", false, [
		entities,
		clients,
		users,
		roles,
		forms,
		providers,
		resources,
		auditlogs,
		console,
		credentials,
		config,
		customers,
		files,
		formresources,
		hdrobots,
		mailhistory,
	]);
</script>

<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { auth } from "$lib/stores/auth.svelte";
	import type { ComponentProps } from "svelte";
	import type { Workspace } from "../../routes/workspace/schema";
	import NavWorkspace from "./nav-workspace.svelte";
	// Extend the ComponentProps type to include the workspaces property
	type ExtendedComponentProps = ComponentProps<typeof Sidebar.Root> & {
		workspaces?: Workspace[];
		currentworkspace: string;
		update_currentworkspace: (workspaceid: string) => void;
		profile: pkg.Profile;
	};
	let {
		ref = $bindable(null),
		workspaces = [],
		currentworkspace,
		update_currentworkspace = (workspaceid: string) => {},
		...restProps
	}: ExtendedComponentProps = $props();

	const navMain = $state([actions, workspace, management]);
	function loadMenu() {
		if (auth.config.workspace_enabled) {
			workspace.hidden = workspaces.length == 0;
			users.hidden = true;
			members.hidden =
				currentworkspace == null ||
				currentworkspace == "" ||
				workspaces.length == 0;
			if (!members.hidden) {
				members.url = `${base}/workspace/${currentworkspace}/member`;
			} else {
				members.url = `${base}/`;
			}
			if (members.hidden) {
				roles.hidden = true;
			} else {
				roles.hidden = false;
			}
		} else {
			users.hidden = false;
			roles.hidden = false;
			members.hidden = true;
			workspace.hidden = true;
			members.url = `${base}/`;
		}
		let profileroles = auth.profile?.roles || [];
		const isAdmin = profileroles.includes("admins");
		const isWorkspaceAdmin = profileroles.find((x: any) =>
			x.endsWith("admins"),
		);
		resources.hidden = !isAdmin;
		console.hidden = !isAdmin;
		config.hidden = !isAdmin;
		providers.hidden = !isAdmin;
		formresources.hidden = !isWorkspaceAdmin;
		forms.hidden = !auth.isAuthenticated;
		clients.hidden = !isWorkspaceAdmin;
		
		if(auth.config.workspace_enabled) {
			customers.hidden = true;
		} else {
			customers.hidden = !auth.config.multi_tenant;
		}
		hdrobots.hidden = !isWorkspaceAdmin;
		mailhistory.hidden = !isAdmin;

		if (!auth.isAuthenticated) {
			if (grafana.hidden != true) {
				grafana.hidden = true;
			}
		} else {
			if (grafana.hidden != (auth.config.grafana_url == "")) {
				grafana.hidden = auth.config.grafana_url == "";
			}
			if (grafana.url != auth.config.grafana_url) {
				grafana.url = auth.config.grafana_url;
			}
		}
	}
	loadMenu();
	$effect(() => {
		loadMenu();
	});
</script>

<Sidebar.Root bind:ref {...restProps}>
	<div
		class="bg-gradient-to-b from-lightgradident1 to-lightgradident2 dark:bg-gradient-to-b dark:from-darkgradident1 dark:to-darkgradident2 rounded my-2.5 mx-3 h-full overflow-auto"
	>
		<Sidebar.Header class="border-sidebar-border h-16 border-b">
			<NavWorkspace
				{workspaces}
				{currentworkspace}
				{update_currentworkspace}
			/>
		</Sidebar.Header>
		<Sidebar.Content>
			{#each navMain as group (group.title)}
				{#if !group.hidden}
					<Sidebar.Group class="ps-4">
						{#if group.title && group.title != ""}
							<Sidebar.GroupLabel
								class="font-bold text-black dark:text-white"
								>{group.title}</Sidebar.GroupLabel
							>
						{/if}
						<Sidebar.GroupContent>
							<Sidebar.Menu>
								{#each group.items as item (item.title)}
									{#if !item.hidden}
										<Sidebar.MenuItem>
											<Sidebar.MenuButton
												isActive={$page.url.pathname ===
													item.url}
											>
												{#snippet child({ props })}
													{#if item.external}
														<a
															href={item.url}
															{...props}
															target="_blank"
															rel="noopener noreferrer"
															>{item.title}</a
														>
													{:else}
														<a
															href={item.url}
															{...props}
															>{item.title}</a
														>
													{/if}
												{/snippet}
											</Sidebar.MenuButton>
										</Sidebar.MenuItem>
									{/if}
								{/each}
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Sidebar.Group>
				{/if}
			{/each}
		</Sidebar.Content>
		<Sidebar.Rail />
	</div>
</Sidebar.Root>
