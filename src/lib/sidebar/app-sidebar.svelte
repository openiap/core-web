<script lang="ts" module>
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import pkg from "oidc-client";
	// import { Volleyball } from "lucide-svelte";
	import "driver.js/dist/driver.css";
	import Mousetrap from "mousetrap";
	import {
		agentTour,
		baseTour,
		driverObj,
		entitiesTour,
	} from "./onboarding.js";

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
		classname: string = $state("");
		url: string = $state("");
		hidden: boolean = $state(false);
		external: boolean = $state(false);
		constructor(
			title: string,
			shortcut: string,
			classname: string,
			url: string,
			hidden: boolean,
			external: boolean = false,
		) {
			this.title = title;
			this.shortcut = shortcut;
			this.classname = classname;
			this.url = url;
			this.hidden = hidden;
			this.external = external;
			const me = this;
			if (this.shortcut != null && this.shortcut != "" && browser) {
				const array = this.shortcut.split(",");
				for (let i = 0; i < array.length; i++) {
					const key = array[i];
					Mousetrap.bind(array[i], function (e) {
						if (e.preventDefault) {
							e.preventDefault();
						} else {
							e.returnValue = false;
						}
						if (me.url.startsWith("/")) {
							goto(me.url);
						} else if (me.url != "") {
							window.open(me.url, "_blank");
							// window.location.href = me.url;
						}
					});
				}
			}
		}
		isActive(url: string) {
			if (url === this.url) return true;
			if (this.url == base + "/workspace") {
				return false;
			}
			if ((url + "/").startsWith(this.url + "/")) return true;
			return false;
		}
	}
	const home = new SidebarItem("Home", "g h", "tourhome", `${base}/`, false);
	const licensekey = new SidebarItem(
		"Licenses",
		"g l",
		"tourlicenses",
		`${base}/licensekey`,
		true,
	);
	const chat = new SidebarItem("Chat", "", "tourchat", `${base}/chat`, false);
	const agent = new SidebarItem(
		"Agents",
		"g a",
		"touragents",
		`${base}/agent`,
		true,
	);
	const workitem = new SidebarItem(
		"Work Items",
		"g w",
		"tourworkitems",
		`${base}/workitem`,
		false,
	);
	const workitemqueue = new SidebarItem(
		"Work Item Queues",
		"",
		"tourworkitemqueues",
		`${base}/workitemqueue`,
		false,
	);
	const formworkflow = new SidebarItem(
		"Form Workflows",
		"",
		"tourformworkflow",
		`${base}/formworkflow`,
		false,
	);
	const rpaworkflow = new SidebarItem(
		"RPA Workflows",
		"",
		"tourrpaworkflow",
		`${base}/rpaworkflow`,
		false,
	);
	const grafana = new SidebarItem(
		"Grafana",
		"g f",
		``,
		"tourgrafana",
		false,
		true,
	);
	const gitrepo = new SidebarItem(
		"Git Repositories",
		"g i",
		"tourgit",
		"/git",
		true,
		true,
	);
	const promptfn = new SidebarItem(
		"Prompt Fn",
		"",
		"",
		`${base}/promptfn`,
		true,
		false
	);
	const homeCat = new SidebarCategory("", false, [home]);
	const actions = new SidebarCategory("", false, [
		chat,
		promptfn,
		agent,
		workitem,
		workitemqueue,
		formworkflow,
		rpaworkflow,
		grafana,
		gitrepo,
	]);
	const members = new SidebarItem(
		"Members",
		"",
		"tourmembers",
		`${base}/members`,
		false,
	);
	const invitemember = new SidebarItem(
		"Invite Member",
		"",
		"tourinvitemember",
		`${base}/members`,
		false,
	);
	const memberships = new SidebarItem(
		"My Memberships",
		"",
		"tourmemberships",
		`${base}/workspace/invites`,
		false,
	);
	const allworkspaces = new SidebarItem(
		"All Workspaces",
		"",
		"tourallworkspaces",
		`${base}/workspace`,
		false,
	);
	const workspace = new SidebarCategory("Workspace", false, [
		members,
		invitemember,
		memberships,
		allworkspaces,
	]);
	const entities = new SidebarItem(
		"Database",
		"g e",
		"tourentities",
		`${base}/entities`,
		false,
	);
	const oauthclients = new SidebarItem(
		"OAuth Clients",
		"",
		"",
		`${base}/oauthclient`,
		false,
	);
	const clients = new SidebarItem(
		"Clients",
		"g c",
		"tourclients",
		`${base}/client`,
		false,
	);
	const users = new SidebarItem(
		"Users",
		"g u",
		"tourusers",
		`${base}/user`,
		false,
	);
	const roles = new SidebarItem(
		"Roles",
		"g r",
		"tourroles",
		`${base}/role`,
		false,
	);
	const forms = new SidebarItem(
		"Forms",
		"",
		"tourforms",
		`${base}/form`,
		false,
	);
	const providers = new SidebarItem(
		"Providers",
		"",
		"tourproviders",
		`${base}/provider`,
		false,
	);
	const resources = new SidebarItem(
		"Resources",
		"",
		"tourresources",
		`${base}/resource`,
		true,
	);
	const auditlogs = new SidebarItem(
		"Audit Logs",
		"",
		"touraudit",
		`${base}/auditlog`,
		false,
	);
	const consoleitem = new SidebarItem(
		"Console",
		"",
		"tourconsole",
		`${base}/console`,
		true,
	);
	const credentials = new SidebarItem(
		"Credentials",
		"",
		"tourcredentials",
		`${base}/credential`,
		false,
	);
	const config = new SidebarItem(
		"Config",
		"",
		"tourconfig",
		`${base}/configuration`,
		true,
	);
	const billingaccounts = new SidebarItem(
		"Billing Accounts",
		"g b",
		"tourbillingaccounts",
		`${base}/billingaccount`,
		true,
	);
	const files = new SidebarItem(
		"Files",
		"",
		"tourfiles",
		`${base}/files`,
		false,
	);
	const formresources = new SidebarItem(
		"Form Resources",
		"",
		"tourformresources",
		`${base}/formresource`,
		true,
	);
	const hdrobots = new SidebarItem(
		"HD Robots",
		"",
		"tourhdrobots",
		`${base}/hdrobot`,
		true,
	);
	const mailhistory = new SidebarItem(
		"Mail History",
		"",
		"tourmailhistory",
		`${base}/mailhistory`,
		true,
	);
	const entityrestriction = new SidebarItem(
		"Entity Restrictions",
		"",
		"tourmailhistory",
		`${base}/entityrestriction`,
		true,
	);
	const management = new SidebarCategory("Management", false, [
		entities,
		clients,
		oauthclients,
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
		licensekey,
		entityrestriction,
	]);
	export { agent, entities, home };
</script>

<script lang="ts">
	import { browser } from "$app/environment";
	import { goto } from "$app/navigation";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { auth } from "$lib/stores/auth.svelte";
	import type { ComponentProps } from "svelte";
	import type { Workspace } from "../../routes/workspace/schema";
	import IconRenderer from "./IconRenderer.svelte";
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

	const navMain = $state([homeCat, actions, workspace, management]);
	function loadMenu() {
		if (
			auth.config?.workspace_enabled == true &&
			auth.config?.validlicense
		) {
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
		if(auth.config?.enable_serverless && isAdmin) {
			promptfn.hidden = false;
		}
		const isWorkspaceAdmin =
			profileroles == null
				? false
				: profileroles.find((x: any) => x.endsWith("admins"));
		resources.hidden = !isAdmin;
		consoleitem.hidden = !isAdmin;
		config.hidden = !isAdmin;
		providers.hidden = !isAdmin;
		formresources.hidden = !isWorkspaceAdmin;
		forms.hidden = !auth.isAuthenticated;
		clients.hidden = !isWorkspaceAdmin;
		if (auth.config?.enable_entity_restriction == true) {
			entityrestriction.hidden = !isAdmin;
		} else {
			entityrestriction.hidden = true;
		}
		if (
			auth.config?.workspace_enabled == true ||
			auth.config?.multi_tenant == true
		) {
			if (auth.config?.workspace_enabled == true) {
				billingaccounts.title = "Billing Accounts";
			} else {
				billingaccounts.title = "Customers";
			}
			billingaccounts.hidden = !auth.isAuthenticated;
		} else {
			billingaccounts.hidden = true;
		}
		hdrobots.hidden = !isWorkspaceAdmin;
		mailhistory.hidden = !isAdmin;

		if (
			auth.config?.llmchat_queue != null &&
			auth.config?.llmchat_queue != ""
		) {
			if (auth.isAuthenticated == false) {
				chat.hidden = true;
			} else {
				chat.hidden = false;
			}
		} else {
			chat.hidden = true;
		}
		agent.hidden = !auth.isAuthenticated;
		auditlogs.hidden = !auth.isAuthenticated;
		credentials.hidden = !auth.isAuthenticated;
		files.hidden = !auth.isAuthenticated;
		workitemqueue.hidden = !auth.isAuthenticated;

		if (auth.config?.enable_gitserver == true) {
			gitrepo.hidden = !auth.isAuthenticated;
			gitrepo.url = auth.baseurl + "/git";
		} else {
			gitrepo.hidden = true;
		}
		if (!auth.isAuthenticated) {
			if (grafana.hidden != true) {
				grafana.hidden = true;
			}
		} else {
			if (grafana.hidden != (auth.config?.grafana_url == "")) {
				grafana.hidden = auth.config?.grafana_url == "";
			}
			if (grafana.url != auth.config?.grafana_url) {
				grafana.url = auth.config?.grafana_url;
			}
		}
		// if(workitem.hidden != true) {
		// 	workitem.hidden = !auth.isAuthenticated;
		// }
		// if (workitemqueue.hidden != true) {
		// 	workitemqueue.hidden = !auth.isAuthenticated;
		// }
		// if (formworkflow.hidden != true) {
		// 	formworkflow.hidden = !auth.isAuthenticated;
		// }
		// if (rpaworkflow.hidden != true) {
		// 	rpaworkflow.hidden = !auth.isAuthenticated;
		// }
		management.hidden = !auth.isAuthenticated;
		actions.hidden = !auth.isAuthenticated;
	}
	if (browser) {
		Mousetrap.bind("g t", function (e) {
			if (driverObj.isActive())
				if (agent.isActive($page.url.pathname)) {
					driverObj.setSteps(agentTour);
					driverObj.drive();
				} else if (home.isActive($page.url.pathname)) {
					driverObj.setSteps(baseTour);
					driverObj.drive();
				} else if (entities.isActive($page.url.pathname)) {
					driverObj.setSteps(entitiesTour);
					driverObj.drive();
				} else {
					driverObj.highlight({
						popover: {
							title: "No tour available",
							description: "No tour available for this page",
						},
					});
				}
		});
	}
	loadMenu();
	$effect(() => {
		loadMenu();
	});
</script>

<Sidebar.Root
	bind:ref
	{...restProps}
	class="border-r border-transparent toursidebar"
>
	<div class="my-2.5 mx-3 h-full">
		<Sidebar.Header class="ms-6 mb-1">
			<NavWorkspace
				{workspaces}
				{currentworkspace}
				{update_currentworkspace}
			/>
		</Sidebar.Header>
		<Sidebar.Content class="h-full overflow-hidden">
			<div class="h-full overflow-auto mb-24">
				{#each navMain as group, index}
					{#if !group.hidden}
						<Sidebar.Group
							class={`ps-8 ${index == 0 ? "py-0 pt-2" : index == 1 ? "pt-1" : ""}`}
						>
							{#if group.title && group.title != ""}
								<Sidebar.GroupLabel
									class="font-bold text-black dark:text-bw300"
									>{group.title}</Sidebar.GroupLabel
								>
							{/if}
							<Sidebar.GroupContent>
								<Sidebar.Menu>
									{#each group.items as item}
										{#if !item.hidden}
											<Sidebar.MenuItem
												class="rounded-[10px] hover:rounded-[10px]"
											>
												<Sidebar.MenuButton
													isActive={item.isActive(
														$page.url.pathname,
													)}
													class={item.isActive(
														$page.url.pathname,
													)
														? "border-[1px] border-bw600 rounded-[10px] dark:border-transparent " +
															item.classname
														: "text-bw600 dark:text-bw400 border-[1px] border-transparent rounded-[10px] hover:bg-bw100 hover:border-[1px] hover:border-bw500 dark:hover:border-bw500 dark:hover:bg-bw850 dark:hover:text-bw400 " +
															item.classname}
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
			</div>
		</Sidebar.Content>
	</div>
</Sidebar.Root>
