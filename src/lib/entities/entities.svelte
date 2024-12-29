<script lang="ts" module>
	import * as Table from "$lib/components/ui/table/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import * as Sheet from "$lib/components/ui/sheet/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";

	import ArrowUp from "lucide-svelte/icons/arrow-up";
	import ArrowDown from "lucide-svelte/icons/arrow-down";
	import SuperDebug from "sveltekit-superforms";

	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { TableHeader, type TTableHeader } from "./data.svelte.js";
	import { type sort } from "$lib/stores/usersettings.svelte";
</script>

<script lang="ts">
	import { data } from "./data.svelte.js";
	import { usersettings } from "$lib/stores/usersettings.svelte.js";

	import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
	import { auth } from "$lib/stores/auth.svelte.js";
	import { Trash2 } from "lucide-svelte";
	import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
	import ChevronLeft from "lucide-svelte/icons/chevron-left";
	import ChevronRight from "lucide-svelte/icons/chevron-right";
	import { MediaQuery } from "runed";
	import * as Pagination from "$lib/components/ui/pagination/index.js";
	import Custompagination from "$lib/custompagination/custompagination.svelte";
	import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
	import { toast } from "svelte-sonner";
	import { set } from "zod";
	import { browser } from "$app/environment";

	let {
		page = "entities",
		query = {},
		entities = $bindable([]),
		searchstring = $bindable(""),
		collectionname = "entities",
		selected_items = $bindable([]),
		caption = "",
		delete_selected = (items: string[]) => {},
		single_item_click = (item: any) => {},
		multi_select = true,
		...rest
	} = $props();

	data.loadsettings(page);
	let _searchstring = $state.snapshot(data.settings.searchstring);
	let _collectionname = $state.snapshot(collectionname);
	let multi_sort = $state(false);
	let showdebug = $state(false);
	let page_index = $state(data.settings.page_index);
	let total_count = $state(data.settings.total_count);
	let tableheaders = $state([]) as TTableHeader[];
	let showWarning = $state(false);

	let actioncellclass = $state("");
	let actionheadclass = $state("");
	const isDesktop = new MediaQuery("(min-width: 768px)");
	const perPage = 5;
	const siblingCount = $derived(isDesktop.matches ? 3 : 0);

	const calculateitems = () => {
		if (page_index === 0) {
			return 1;
		} else if (total_count) {
		} else {
			return `${page_index * perPage + 1} of ${page_index * perPage + 5}`;
		}
	};

	selected_items = data.settings.selected_items;

	async function GetData() {
		const _entities = await data.GetData(page, collectionname, query);
		entities = _entities;
		total_count = data.settings.total_count;

		if (entities.length > 0) {
			let keys = [];
			for (let i = 0; i < entities.length; i++) {
				let entity = entities[i];
				let subkeys = Object.keys(entity);
				for (let j = 0; j < subkeys.length; j++) {
					let key = subkeys[j];
					if (keys.indexOf(key) == -1) {
						keys.push(key);
					}
				}
			}
			for (let i = 0; i < keys.length; i++) {
				let key = keys[i];
				if (tableheaders.find((x) => x.field == key) == null) {
					let header = new TableHeader();
					header.field = key;
					header.name = key;
					header.show = false;
					tableheaders.push(header);
				}
			}
			total_count = data.settings.total_count;
		}
	}
	if (browser && data.settings.total_count == 99999) {
		GetData();
	}

	function EnsureDefaultHeaders(page: string) {
		if (tableheaders.length == 0) {
			if (
				data.settings.headers != null &&
				data.settings.headers.length > 0
			) {
				for (let i = 0; i < data.settings.headers.length; i++) {
					let org = data.settings.headers[i];
					let header = new TableHeader();
					header.show = true;
					header.field = org.field;
					header.order = org.order;
					header.orderindex = org.orderindex;
					tableheaders.push(header);
				}
				return;
			}

			const defaultcolumnnames = data.defaultcolumnnames(page);
			for (let i = 0; i < defaultcolumnnames.length; i++) {
				let header = new TableHeader();
				header.field = defaultcolumnnames[i];
				if (header.field == "_id") {
					header.show = false;
					header.order = "";
					header.orderindex = 100;
				}
				if (i == 0) {
					header.headclass = "w-[100px]";
					header.cellclass = "font-medium";
				}
				if (i == defaultcolumnnames.length - 1) {
					header.headclass = "text-right";
					header.cellclass = "text-right";
				}
				tableheaders.push(header);
			}
		}
	}
	function SetHeaders() {
		EnsureDefaultHeaders(page);
		let foundfirst = false;
		let lastindex = -1;
		for (let i = 0; i < tableheaders.length; i++) {
			let header = tableheaders[i];
			if (foundfirst == false && header.show == true) {
				if (rest["action"] == null) lastindex = i;
				foundfirst = true;
				header.headclass = "";
				header.cellclass = "font-medium";
			} else if (header.show == true) {
				if (rest["action"] == null) lastindex = i;
				header.headclass = "w-[100px]";
				header.cellclass = "truncate overflow-ellipsis";
			}
		}
		if (lastindex > -1) {
			console.log("lastindex", lastindex);
			tableheaders[lastindex].headclass = "text-right w-[100px]";
			actioncellclass = "";
			actionheadclass = "";
		} else {
			actioncellclass = "text-right w-[200px]";
			actionheadclass = "text-right w-[200px]";
		}
	}
	function RenderItemData(item: any, field: string) {
		let value = item[field];
		if (field.indexOf(".")) {
			let parts = field.split(".");
			let obj = item;
			for (let i = 0; i < parts.length; i++) {
				obj = obj[parts[i]];
				if (obj == null) {
					break;
				}
			}
			value = obj;
		}
		if (value == null) {
			return "";
		}
		if (typeof value == "object") {
			if (value instanceof Date) {
				return value.toLocaleString();
			}
			return JSON.stringify(value);
		}
		return value;
	}
	function RenderHeaderName(header: TableHeader) {
		if (header == null) {
			return "ERROR!!!";
		}
		let value = header.field;
		if (header.field.indexOf(".") > -1) {
			value = header.field.split(".").pop() as any;
		}
		switch (value) {
			case "name":
				return "Name";
			case "type":
				return "Type";
			case "_type":
				return "Type";
			case "_created":
				return "Created";
			case "_modified":
				return "Modified";
			default:
				if (header.name != null && header.name != "") {
					return header.name;
				}
				return header.field;
		}
	}

	$effect(() => {
		if (_searchstring != searchstring) {
			_searchstring = searchstring;
			data.settings.searchstring = searchstring;
			data.settings.page_index = 0;
			page_index = 0;
			data.persist();
			GetData();
		} else if (_collectionname != collectionname) {
			usersettings.entities_collectionname = collectionname;
			data.settings.page_index = page_index;
			data.persist();
			data.loadsettings(page);
			_collectionname = collectionname;
			_searchstring = data.settings.searchstring;
			searchstring = data.settings.searchstring;
			selected_items = data.settings.selected_items;
			page_index = data.settings.page_index;
			GetData();
		}
		data.settings.searchstring = $state.snapshot(searchstring);
		data.settings.selected_items = selected_items;
		data.settings.page_index = page_index;
		SetHeaders();
	});

	SetHeaders();

	/**
	 * Ordering columns
	 * ******************************************
	 */
	let startrow = "";
	function ondragstart(event: DragEvent, head: TableHeader) {
		event.dataTransfer?.setData("text", head.field);
	}
	function ontouchstart(event: TouchEvent, head: TableHeader) {
		startrow = head.field;
	}
	function ondragover(event: DragEvent) {
		event.preventDefault();
	}
	function ondrop(event: DragEvent, head: TableHeader) {
		event.preventDefault();
		const fromfield = event.dataTransfer?.getData("text");
		const fromindex = tableheaders.findIndex((h) => h.field == fromfield);
		const toindex = tableheaders.findIndex((h) => h.field == head.field);
		if (fromindex != toindex) {
			tableheaders.splice(
				toindex,
				0,
				tableheaders.splice(fromindex, 1)[0],
			);
			data.SaveHeaders(tableheaders);
		}
	}
	function ontouchend(event: TouchEvent, head: TableHeader) {
		const fromindex = tableheaders.findIndex((h) => h.field == startrow);
		const toindex = tableheaders.findIndex((h) => h.field == head.field);
		if (fromindex != toindex) {
			tableheaders.splice(
				toindex,
				0,
				tableheaders.splice(fromindex, 1)[0],
			);
			data.SaveHeaders(tableheaders);
		}
	}
	function ontouchmove(event: TouchEvent) {
		event.preventDefault();
	}
	// finish adding move logic for touch
	// https://www.horuskol.net/blog/2020-08-15/drag-and-drop-elements-on-touch-devices/
	/**
	 * ******************************************
	 * Ordering columns
	 */

	/**
	 * Sorting data
	 * ******************************************
	 */
	function sortby(field: string): sort {
		var exists = tableheaders.find((x) => x.field == field);
		if (exists == null) {
			return "";
		}
		return exists.order;
	}
	function setSort(field: string, value: sort) {
		if (Array.isArray(tableheaders) == false) tableheaders = [];
		let column = tableheaders.find((x) => x.field == field);
		let index = tableheaders.findIndex((x) => x.field == field);
		if (column != null) {
			if (value == "") {
				column.orderindex = 0;
			} else {
				column.orderindex =
					tableheaders.filter((x) => x.order != "").length + 1;
			}
			tableheaders[index] = { ...column, order: value };
			data.SaveHeaders(tableheaders);
		}
	}

	function toggleSort(e: any, field: string) {
		e.preventDefault();
		e.stopPropagation();
		const current = sortby(field);
		if (!multi_sort) {
			for (let i = 0; i < tableheaders.length; i++) {
				const _field = tableheaders[i].field;
				if (_field != field) {
					setSort(_field, "");
				}
			}
		}
		if (current == "") {
			setSort(field, "asc");
		} else if (current == "asc") {
			setSort(field, "desc");
		} else {
			setSort(field, "");
		}
		data.SaveHeaders(tableheaders);
		GetData();
	}

	/**
	 * ******************************************
	 * Sorting data
	 */

	/**
	 * Searching data
	 * ******************************************
	 */

	/**
	 * ******************************************
	 * Searching data
	 */

	/**
	 * Multi Select
	 * ******************************************
	 */
	function ToogleAll() {
		entities.map((x) => {
			if (selected_items.indexOf(x._id) > -1) {
				selected_items = selected_items.filter((y) => y != x._id);
			} else {
				selected_items = [...selected_items, x._id];
			}
		});
		data.SaveHeaders(tableheaders);
	}
	function ToggleSelect(x: any) {
		if (selected_items.indexOf(x._id) > -1) {
			selected_items = selected_items.filter((y) => y != x._id);
		} else {
			selected_items = [...selected_items, x._id];
		}
		data.SaveHeaders(tableheaders);
	}
	let is_all_selected = $derived(
		() =>
			entities.length > 0 &&
			entities
				.map((x) => x._id)
				.every((x) => selected_items.indexOf(x) > -1),
	);
	/**
	 * ******************************************
	 * Multi Select
	 */

	function handlenext() {
		page_index = page_index + 1;
		data.settings.page_index = page_index;
		data.persist();
		GetData();
	}
	function handleprevious() {
		page_index = page_index - 1;
		data.settings.page_index = page_index;
		data.persist();
		GetData();
	}
	function handlepageclick(page: number) {
		page_index = page - 1;
		data.settings.page_index = page_index;
		data.persist();
		GetData();
	}
	async function handleAccept() {
		try {
			await delete_selected($state.snapshot(selected_items));
		} catch (error: any) {
			toast.error("Error while deleting", {
				description: error.message,
			});
			console.error(error);
		}
	}
</script>

<!-- error message-->
<div class="text-red-500">{data.errormessage}</div>
<!-- <SuperDebug data={headers} theme="vscode" /> -->
<div class="border border-gray-400 rounded">
	<Table.Root>
		{#if entities.length === 0}
			<Table.Caption class="mb-2">No data found.</Table.Caption>
		{:else if caption != ""}
			<Table.Caption>{caption}</Table.Caption>
		{:else}
			<Table.Caption></Table.Caption>
		{/if}
		<Table.Header>
			<Table.Row
				class="border-b border-gray-400  justify-center item-center"
			>
				{#if multi_select}
					<Table.Head
						class="w-8 text-black font-semibold dark:text-white"
						role="cell"
						><Checkbox
							aria-label="Select all"
							checked={is_all_selected()}
							onclick={ToogleAll}
						/></Table.Head
					>
				{/if}
				{#each tableheaders as head}
					{#if head.show}
						<Table.Head
							class={head.headclass +
								" text-black font-semibold dark:text-white"}
							role="cell"
							draggable="true"
							onclick={(e) => toggleSort(e, head.field)}
							ondragstart={(e) => ondragstart(e, head)}
							{ondragover}
							ondrop={(e) => ondrop(e, head)}
							ontouchstart={(e) => ontouchstart(e, head)}
							ontouchend={(e) => ontouchend(e, head)}
							{ontouchmove}
						>
							{RenderHeaderName(head)}
							{#if sortby(head.field) == "asc"}
								<ArrowUp class="ml-2 h-4 w-4" />
							{:else if sortby(head.field) == "desc"}
								<ArrowDown class="ml-2 h-4 w-4" />
							{/if}
						</Table.Head>
					{/if}
				{/each}
				{#if rest["action"]}
					<Table.Head
						class="text-black font-semibold dark:text-white {actionheadclass}"
						>Action</Table.Head
					>
				{/if}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each entities as item}
				<Table.Row
					class="border-b border-gray-400"
					ondblclick={() => {
						single_item_click(item);
					}}
				>
					{#if multi_select}
						<Table.Cell class="w-8"
						onclick={() => ToggleSelect(item)}
							><Checkbox
								aria-label="Select item"
								checked={selected_items.indexOf(item._id) > -1}
								
							/></Table.Cell
						>
					{/if}
					{#each tableheaders as head}
						{#if head.show}
							{#if head.field == "name"}
								<Table.Cell
									class={head.cellclass}
									onclick={() => {
										if (
											multi_select &&
											selected_items.length > 0
										) {
											ToggleSelect(item);
										} else {
											single_item_click(item);
										}
									}}
									>{RenderItemData(item, head.field)}
								</Table.Cell>
							{:else if rest[head.field] != null}
								<Table.Cell class={head.cellclass}
									>{@render rest[head.field](
										item,
									)}</Table.Cell
								>
							{:else}
								<Table.Cell
									class={head.cellclass}
									onclick={() => {
										if (multi_select) {
											ToggleSelect(item);
										} else {
											single_item_click(item);
										}
									}}
									>{RenderItemData(
										item,
										head.field,
									)}</Table.Cell
								>
							{/if}
						{/if}
					{/each}
					{#if rest["action"]}
						<Table.Cell class={actioncellclass}
							>{@render rest["action"](item)}</Table.Cell
						>
					{/if}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

<div class="flex my-2 space-x-2 items-center">
	<!-- {#if selected_items.length > 0} -->
	<HotkeyButton
		disabled={selected_items.length === 0}
		onclick={() => (showWarning = true)}
		data-shortcut="Delete"
		size="sm"
		variant="destructive"
		class="bg-red-500 text-white"
	>
		<Trash2 />
		Delete {selected_items.length} items</HotkeyButton
	>
	<!-- {/if} -->

	<!-- {#if selected_items.length > 0} -->
	<Hotkeybutton
		disabled={selected_items.length === 0}
		variant="default"
		onclick={() => (selected_items = [])}>Clear All Selections</Hotkeybutton
	>
	<!-- {/if} -->

	{#if tableheaders != null && tableheaders.length > 0}
		<Sheet.Root>
			<Sheet.Trigger class={buttonVariants({ variant: "outline" })}
				>Select columns</Sheet.Trigger
			>
			<Sheet.Content>
				<Sheet.Header>
					<Sheet.Title>Select columns</Sheet.Title>
					<Sheet.Description>
						Select what columns to show in the table.
					</Sheet.Description>
				</Sheet.Header>
				<div class="grid gap-4 py-4">
					<ScrollArea class="max-h-[70vh]">
						{#each tableheaders as head}
							<div
								class=" flex items-center space-x-4 rounded-md border p-4"
							>
								<!-- <BellRing /> -->
								<div class="flex-1 space-y-1">
									<p class="text-muted-foreground text-sm">
										{RenderHeaderName(head)}
									</p>
								</div>
								<Switch
									bind:checked={head.show}
									onclick={() => {
										// data.SaveHeaders();
									}}
								/>
							</div>
						{/each}
					</ScrollArea>

					<!-- 
		<div class="grid grid-cols-4 items-center gap-4">
		  <Label for="name" class="text-right">Name</Label>
		  <Input id="name" value="Pedro Duarte" class="col-span-3" />
		</div>
		<div class="grid grid-cols-4 items-center gap-4">
		  <Label for="username" class="text-right">Username</Label>
		  <Input id="username" value="@peduarte" class="col-span-3" />
		</div> -->
				</div>
				<Sheet.Footer>
					<Sheet.Close class={buttonVariants({ variant: "outline" })}>
						Close
					</Sheet.Close>
				</Sheet.Footer>
			</Sheet.Content>
		</Sheet.Root>
	{/if}
</div>

<Custompagination
	bind:page_index
	bind:count={total_count}
	onnext={handlenext}
	onprevious={handleprevious}
	onpageclick={handlepageclick}
/>

<HotkeyButton
	data-shortcut="Control+a,Meta+a"
	onclick={() => {
		if (!is_all_selected()) {
			entities.map((x) => {
				if (selected_items.indexOf(x._id) == -1) {
					selected_items = [...selected_items, x._id];
					data.settings.selected_items = selected_items;
					data.persist();
				}
			});
		} else {
			entities.map((x) => {
				if (selected_items.indexOf(x._id) >= -1) {
					selected_items = selected_items.filter((y) => y != x._id);
					data.settings.selected_items = selected_items;
					data.persist();
				}
			});
		}
	}}
	class="hidden"
	hidden={true}
/>

<div class="mt-4">
	{#if tableheaders != null && tableheaders.length > 0 && showdebug == true}
		<SuperDebug data={entities} theme="vscode" />
	{/if}

	<HotkeyButton
		hidden
		class="hidden"
		data-shortcut={"Control+d,Meta+d"}
		onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
	>
</div>

<Warningdialogue bind:showWarning type="deleteall" onaccept={handleAccept}
></Warningdialogue>
