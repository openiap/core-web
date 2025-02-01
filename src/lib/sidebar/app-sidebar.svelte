<script lang="ts" module>
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import pkg from "oidc-client";
	// import { Volleyball } from "lucide-svelte";
	import Mousetrap from 'mousetrap';

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
		shortcut: string = $state("");
		url: string = $state("");
		hidden: boolean = $state(false);
		external: boolean = $state(false);
		constructor(
			title: string,
			shortcut: string,
			url: string,
			hidden: boolean,
			external: boolean = false,
		) {
			this.title = title;
			this.shortcut = shortcut;
			this.url = url;
			this.hidden = hidden;
			this.external = external;
			const me = this;
			if(this.shortcut != null && this.shortcut != "" && browser){
				const array = this.shortcut.split(",");
				for (let i = 0; i < array.length; i++) {
					const key = array[i];
					Mousetrap.bind(array[i], function(e) {
						if (e.preventDefault) {
							e.preventDefault();
						} else {
							e.returnValue = false;
						}
						if(me.url.startsWith("/")){
							goto(me.url);
						} else if (me.url != "") {
							window.open(me.url, "_blank");
							// window.location.href = me.url;
						}
					});
				}
			}
		}
	}
	const home = new SidebarItem("Home", "g h", `${base}/`, false);
	const agent = new SidebarItem("Agents", "g a", `${base}/agent`, false);
	const workitem = new SidebarItem("Workitems", "g w", `${base}/workitem`, false);
	const workitemqueue = new SidebarItem("Workitem queue", "", `${base}/workitemqueue`, false);
	const formworkflow = new SidebarItem(
		"Form workflows",
		"", 
		`${base}/formworkflow`,
		false,
	);
	const rpaworkflow = new SidebarItem(
		"RPA Workflows",
		"", 
		`${base}/rpaworkflow`,
		false,
	);
	const grafana = new SidebarItem(
		"Grafana",
		"g f", 
		``,
		false,
		true,
	);
	const actions = new SidebarCategory("", false, [
		home,
		agent,
		workitem,
		workitemqueue,
		formworkflow,
		rpaworkflow,
		grafana,
	]);
	const members = new SidebarItem("Members", "", `${base}/members`, false);
	const invitemember = new SidebarItem(
		"Invite Member",
		"", 
		`${base}/members`,
		false,
	);
	const memberships = new SidebarItem(
		"My Memberships",
		"", 
		`${base}/workspace/invites`,
		false,
	);
	const allworkspaces = new SidebarItem(
		"All Workspaces",
		"", 
		`${base}/workspace`,
		false,
	);
	const workspace = new SidebarCategory("Workspace", false, [
		members,
		invitemember,
		memberships,
		allworkspaces
	]);
	const entities = new SidebarItem("Entities", "g e", `${base}/entities`, false);
	const clients = new SidebarItem("Clients", "g c", `${base}/client`, false);
	const users = new SidebarItem("Users", "g u", `${base}/user`, false);
	const roles = new SidebarItem("Roles", "g r", `${base}/role`, false);
	const forms = new SidebarItem("Forms", "", `${base}/form`, false);
	const providers = new SidebarItem("Providers", "", `${base}/provider`, false);
	const resources = new SidebarItem("Resources", "", `${base}/resource`, true);
	const auditlogs = new SidebarItem("Audit logs", "", `${base}/auditlog`, false);
	const consoleitem = new SidebarItem("Console", "", `${base}/console`, true);
	const credentials = new SidebarItem(
		"Credentials",
		"", 
		`${base}/credential`,
		false,
	);
	const config = new SidebarItem("Config", "", `${base}/configuration`, true);
	const billingaccounts = new SidebarItem(
		"Billing accounts",
		"g b", 
		`${base}/billingaccount`,
		true,
	);
	const files = new SidebarItem("Files", "", `${base}/files`, false);
	const formresources = new SidebarItem(
		"Form Resources",
		"", 
		`${base}/formresource`,
		true,
	);
	const hdrobots = new SidebarItem("HD Robots", "", `${base}/hdrobot`, true);
	const mailhistory = new SidebarItem(
		"Mail History",
		"", 
		`${base}/mailhistory`,
		true,
	);
	const management = new SidebarCategory("Management", false, [
		entities,
		clients,
		users,
		roles,
		forms,
		providers,
		resources,
		auditlogs,
		consoleitem,
		credentials,
		config,
		billingaccounts,
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
	import { MessageSquare, Bot } from "lucide-svelte";
	import IconRenderer from "./IconRenderer.svelte";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";

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
			invitemember.hidden = members.hidden;
			if (!members.hidden) {
				members.url = `${base}/workspace/${currentworkspace}/member`;
				invitemember.url = `${base}/workspace/${currentworkspace}/invite`;
			} else {
				members.url = `${base}/`;
				invitemember.url = `${base}/`;
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
		consoleitem.hidden = !isAdmin;
		config.hidden = !isAdmin;
		providers.hidden = !isAdmin;
		formresources.hidden = !isWorkspaceAdmin;
		forms.hidden = !auth.isAuthenticated;
		clients.hidden = !isWorkspaceAdmin;

		if (auth.config.workspace_enabled || auth.config.multi_tenant) {
			billingaccounts.hidden = false;
			if (auth.config.workspace_enabled == true) {
				billingaccounts.title = "Billing accounts";
			} else {
				billingaccounts.title = "Customers";
			}
		} else {
			billingaccounts.hidden = true;
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

<Sidebar.Root
	bind:ref
	{...restProps}
	class="border-r border-white dark:border-bw900"
>
	<div class="my-2.5 mx-3 h-full overflow-auto">
		<Sidebar.Header class="ms-6">
			<NavWorkspace
				{workspaces}
				{currentworkspace}
				{update_currentworkspace}
			/>
		</Sidebar.Header>
		<Sidebar.Content>
			{#each navMain as group (group.title)}
				{#if !group.hidden}
					<Sidebar.Group class="ps-8">
						{#if group.title && group.title != ""}
							<Sidebar.GroupLabel
								class="font-bold text-black dark:text-bw300"
								>{group.title}</Sidebar.GroupLabel
							>
						{/if}
						<Sidebar.GroupContent>
							<Sidebar.Menu>
								{#each group.items as item (item.title)}
									{#if !item.hidden}
										<Sidebar.MenuItem
											class="rounded-[10px] hover:rounded-[10px] dark:text-bw300"
										>
											<Sidebar.MenuButton
												isActive={$page.url.pathname ===
													item.url}
												class={$page.url.pathname ===
												item.url
													? "dark:bg-bw700 dark:text-bw100"
													: "dark:hover:border-[1px] dark:hover:border-bw500 dark:hover:bg-bw850 dark:hover:text-bw100"}
											>
												{#snippet child({ props })}
													{#if item.external}
														<a
															href={item.url}
															{...props}
															target="_blank"
															rel="noopener noreferrer"
														>
															<IconRenderer
																title={item.title}
															/>
															{item.title}</a
														>
													{:else}
														<a
															href={item.url}
															{...props}
														>
															<IconRenderer
																title={item.title}
															/>
															{item.title}</a
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
	</div>
</Sidebar.Root>
