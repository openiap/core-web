<script lang="ts" module>
	import { page } from "$app/stores";
	import { base } from "$app/paths";
	import { Volleyball } from "lucide-svelte";

	const data = {
		versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
		navMain: [
			{
				title: "Old Pages",
				url: `${base}/`,
				items: [
					{
						title: "Home",
						url: `${base}/`,
					},
					{
						title: "Entities",
						url: `${base}/entities`,
					},
					{
						title: "Roles",
						url: `${base}/role`,
					},
					{
						title: "Users",
						url: `${base}/user`,
					},
				],
			},
			{
				title: "New Pages",
				url: "#",
				items: [
					{
						title: "Credentials",
						url: `${base}/credential`,
					},
					{
						title: "Config",
						url: `${base}/configuration`,
					},
					{
						title: "Customers",
						url: `${base}/customer`,
					},
					{
						title: "Files",
						url: `${base}/files`,
					},
					{
						title: "Form Resources",
						url: `${base}/formresource`,
					},
					{
						title: "HD Robots",
						url: `${base}/hdrobot`,
					},
					{
						title: "Mail History",
						url: `${base}/mailhistory`,
					},
				],
			},
			{
				title: "Incomplete Pages",
				url: "#",
				items: [
					{
						title: "Audit logs",
						url: `${base}/auditlog`,
					},
					{
						title: "Agents",
						url: `${base}/agent`,
					},

					{
						title: "Console",
						url: `${base}/console`,
					},
					{
						title: "Clients",
						url: `${base}/client`,
					},
					{
						title: "Providers",
						url: `${base}/provider`,
					},
					{
						title: "Resources",
						url: `${base}/resource`,
					},
				],
			},
		],
	};
</script>

<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import Minus from "lucide-svelte/icons/minus";
	import Plus from "lucide-svelte/icons/plus";
	import type { ComponentProps } from "svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import { goto } from "$app/navigation";

	let {
		ref = $bindable(null),
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref {...restProps} class="bg-slate-500">
	<Sidebar.Header>
		<button
			onclick={() => goto("/")}
			onkeydown={(event) => event.key === "Enter" && goto("/")}
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
		<!-- We create a Sidebar.Group for each parent. -->
		{#each data.navMain as group (group.title)}
			<Sidebar.Group class="ps-4">
				<Sidebar.GroupLabel>{group.title}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each group.items as item (item.title)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton
									isActive={$page.url.pathname === item.url}
								>
									{#snippet child({ props })}
										<a href={item.url} {...props}
											>{item.title}</a
										>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
