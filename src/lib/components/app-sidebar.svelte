<script lang="ts" module>
	import { page } from "$app/stores";
	import { base } from "$app/paths";

	// sample data
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
						title: "Users",
						url: `${base}/user`,
					},
					{
						title: "Roles",
						url: `${base}/role`,
					},

					{
						title: "Entities",
						url: `${base}/entities`,
					},
				],
			},
			{
				title: "New Pages",
				url: "#",
				items: [
					{
						title: "Customers",
						url: `${base}/customer`,
					},
					{
						title: "Providers",
						url: `${base}/provider`,
					},
					{
						title: "Resources",
						url: `${base}/resource`,
					},
					{
						title: "Mail History",
						url: `${base}/mailhist`,
					},
				],
			},
		],
	};

	const data2 = {
		"Getting Started": ["user", "entities"],
		Other: [],
	};
</script>

<script lang="ts">
	// import SearchForm from "$lib/components/search-form.svelte";
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	// import GalleryVerticalEnd from "lucide-svelte/icons/gallery-vertical-end";
	import Minus from "lucide-svelte/icons/minus";
	import Plus from "lucide-svelte/icons/plus";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref {...restProps}>
	<!-- <Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href="##" {...props}>
							<div
								class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
							>
								<GalleryVerticalEnd class="size-4" />
							</div>
							<div class="flex flex-col gap-0.5 leading-none">
								<span class="font-semibold">Documentation</span>
								<span class="">v1.0.0</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
		<SearchForm />
	</Sidebar.Header> -->
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
