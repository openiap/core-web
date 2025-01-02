<script lang="ts" module>
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import { Volleyball } from "lucide-svelte";

	class SidebarItem {
		title: string = $state("");
		url: string = $state("");
		hidden: boolean = $state(false);
		constructor(title: string, url: string, hidden: boolean) {
			this.title = title;
			this.url = url;
			this.hidden = hidden;
		}
	}
	const actions: any = {
		title: "",
		hidden: false,
		items: [
			new SidebarItem("Agents", `${base}/agent`, false),
			new SidebarItem("Workitems", `${base}/workitem`, false),
			new SidebarItem("Form workflows", `${base}/workflow`, false),
			new SidebarItem("RPA Workflows", `${base}/rpaworkflow`, false),
			new SidebarItem(
				"Grafana",
				`https://grafana.dev.openiap.io/`,
				false,
			),
		],
	};
	const workspace: any = {
		title: "Workspace",
		hidden: false,
		items: [
			new SidebarItem("Workspaces", `${base}/workspace`, false),
			new SidebarItem("Members", `${base}/workspace/member`, false),
			new SidebarItem("Invites", `${base}/workspace/invites`, false),
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
	import { goto } from "$app/navigation";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { auth } from "$lib/stores/auth.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	const navMain = $state([]) as any[];
	const data = $state({
		versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
		navMain,
	});
	function loadmenu() {
		workspace.hidden = !(
			auth.config != null && auth.config.workspace_enabled
		);
		if (auth.profile?.roles?.indexOf("admins") > -1) {
			for (let item of management.items) {
				item.hidden = false;
			}
		}
		// management.items.find((x:any) => x.title == "Users").hidden = !workspace.hidden;
		// management.items.find((x:any) => x.title == "Roles").hidden = !workspace.hidden;
		if (!workspace.hidden && auth.isAuthenticated) {
			workspace.items.find((x: any) => x.title == "Members").url =
				`${base}/workspace/${auth.workspace._id}/member`;
			for (let i = 1; i < workspace.items.length; i++) {
				workspace.items[i].hidden =
					auth.workspace.name == null || auth.workspace.name == "";
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
		<Sidebar.Header>
			<button
				onclick={() => goto(base)}
				onkeydown={(event) => event.key === "Enter" && goto(base)}
				class=" hover:opacity-80"
			>
				<div class="flex space-x-2 mt-2 ms-2 p-2">
					<div
						class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg hover"
					>
						<Volleyball class="size-4" />
					</div>
					<div class="flex flex-col gap-0.5 leading-none items-start">
						<span class="font-semibold">OpenIAP Core</span>
						<span class="text-gray-400">v. 1.0</span>
					</div>
				</div>
			</button>
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
													<a
														href={item.url}
														{...props}
														>{item.title}</a
													>
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
