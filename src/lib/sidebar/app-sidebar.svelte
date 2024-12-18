<script lang="ts" module>
	import { page } from "$app/stores";
	import { base } from "$app/paths";

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

	let {
		ref = $bindable(null),
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref {...restProps}>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.Menu>
				{#each data.navMain as mainItem, index (mainItem.title)}
					<Collapsible.Root open={true} class="group/collapsible">
						<Sidebar.MenuItem>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuButton {...props}>
										{mainItem.title}{" "}
										<Plus
											aria-label="expand"
											class="ml-auto group-data-[state=open]/collapsible:hidden"
										/>
										<Minus
											aria-label="collapse"
											class="ml-auto group-data-[state=closed]/collapsible:hidden"
										/>
									</Sidebar.MenuButton>
								{/snippet}
							</Collapsible.Trigger>
							{#if mainItem.items?.length}
								<Collapsible.Content>
									<Sidebar.MenuSub>
										{#each mainItem.items as item (item.title)}
											<Sidebar.MenuSubItem>
												<Sidebar.MenuSubButton
													isActive={$page.url
														.pathname === item.url}
												>
													{#snippet child({ props })}
														<a
															href={item.url}
															{...props}
															>{item.title}</a
														>
													{/snippet}
												</Sidebar.MenuSubButton>
											</Sidebar.MenuSubItem>
										{/each}
									</Sidebar.MenuSub>
								</Collapsible.Content>
							{/if}
						</Sidebar.MenuItem>
					</Collapsible.Root>
				{/each}
			</Sidebar.Menu>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
