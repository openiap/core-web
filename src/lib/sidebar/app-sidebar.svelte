<script lang="ts" module>
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import pkg from "oidc-client";
	// import { Volleyball } from "lucide-svelte";

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
	const actions: any = {
		title: "",
		hidden: false,
		items: [
			new SidebarItem("Home", `${base}/`, false),
			new SidebarItem("Agents", `${base}/agent`, false),
			new SidebarItem("Workitems", `${base}/workitem`, false),
			new SidebarItem("Form workflows", `${base}/workflow`, false),
			new SidebarItem("RPA Workflows", `${base}/rpaworkflow`, false),
			new SidebarItem(
				"Grafana",
				`https://grafana.dev.openiap.io/`,
				false,
				true,
			),
		],
	};
	const workspace: any = {
		title: "Workspace",
		hidden: false,
		items: [
			// new SidebarItem("Workspaces", `${base}/workspace`, false),
			new SidebarItem("Members", `${base}/workspace/member`, false),
			new SidebarItem("Memberships", `${base}/workspace/invites`, false),
		],
	};
	const management: any = {
		title: "Management",
		hidden: false,
		items: [
			new SidebarItem("Entities", `${base}/entities`, false),
			new SidebarItem("Clients", `${base}/client`, false),
			new SidebarItem("Users", `${base}/user`, false),
			new SidebarItem("Roles", `${base}/role`, false),
			new SidebarItem("Forms", `${base}/form`, false),
			new SidebarItem("Providers", `${base}/provider`, false),
			new SidebarItem("Resources", `${base}/resource`, true),
			new SidebarItem("Audit logs", `${base}/auditlog`, false),
			new SidebarItem("Console", `${base}/console`, true),
			new SidebarItem("Credentials", `${base}/credential`, false),
			new SidebarItem("Config", `${base}/configuration`, true),
			new SidebarItem("Customers", `${base}/customer`, true),
			new SidebarItem("Files", `${base}/files`, false),
			new SidebarItem("Form Resources", `${base}/formresource`, true),
			new SidebarItem("HD Robots", `${base}/hdrobot`, true),
			new SidebarItem("Mail History", `${base}/mailhistory`, true),
		],
	};
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

	const navMain = $state([]) as any[];
	const data = $state({
		navMain,
	});
	function loadmenu() {
		workspace.hidden = !(
			auth.config != null && auth.config.workspace_enabled
		);
		if (workspaces.length == 0) {
			workspace.hidden = false;
		}
		const member = workspace.items.find((x: any) => x.title == "Members");

		management.items.find((x: any) => x.title == "Users").hidden =
			!workspace.hidden;
		if (!workspace.hidden) {
			management.items.find((x: any) => x.title == "Roles").hidden =
				currentworkspace == null || currentworkspace == "";
			if (currentworkspace != null && currentworkspace != "") {
				member.hidden = false;
				member.url = `${base}/workspace/${currentworkspace}/member`;
			} else {
				member.hidden = true;
			}
			workspace.items = workspace.items;
			data.navMain = data.navMain;
		}
		if (data.navMain.length == 0) {
			data.navMain.push(actions);
			data.navMain.push(workspace);
			data.navMain.push(management);
		}
	}

	loadmenu();

	$effect(() => {
		loadmenu();
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
			{#each data.navMain as group (group.title)}
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
