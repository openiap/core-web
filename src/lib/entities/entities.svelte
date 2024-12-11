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
	import { settingsState } from "$lib/stores/settings.svelte";
	import { type sort, TableHeader } from "./data.svelte.js";
</script>

<script lang="ts">
	const settings = new settingsState();
	import { data } from "./data.svelte.js";
	
	import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
	let {
		page = "entities",
		defaultcolumnnames = ["_id", "name", "_type", "_created"],
		query = { _type: "user" },
		entities = $bindable([]),
		searchstring = $bindable(""),
		collectionname = "entities",
		selected_items = $bindable([]),
		caption = "",
		delete_selected = (items: string[]) => {},
		single_item_click = (item: any) => {},
		multi_select = true,
		action = null,
		...rest
	} = $props();

	let _searchstring = $state.snapshot(settings.getvalue(page, "searchstring", ""));
	let _collectionname = $state.snapshot(collectionname);
	let multi_sort = $state(true);
	let showdebug = $state(false);

	selected_items = settings.getvalue(page, "selected_items", []);
	searchstring = settings.getvalue(page, "searchstring", "");
	data.loadsettings(page, null);

	function EnsureDefaultHeaders() {
		if (data.headers.length == 0) {
			for (let i = 0; i < defaultcolumnnames.length; i++) {
				let header = new TableHeader();
				header.field = defaultcolumnnames[i];
				if (header.field == "_id") {
					header.show = false;
					header.order = "desc";
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
				data.headers.push(header);
			}
		}
	}
	function SetHeaders() {
		EnsureDefaultHeaders();
		let foundfirst = false;
		for (let i = 0; i < data.headers.length; i++) {
			let header = data.headers[i];
			if (foundfirst == false && header.show == true) {
				foundfirst = true;
				header.headclass = "";
				header.cellclass = "font-medium";
				// } else if (i == defaultcolumnnames.length - 1) {
				// 	header.headclass = "w-[200px]";
				// 	header.cellclass = "text-right";
			} else {
				header.headclass = "w-[100px]";
				header.cellclass = "truncate overflow-ellipsis";
			}
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
		if(header.field.indexOf(".") > -1) {
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
				if(header.name != null && header.name != "") {
					return header.name;
				}
				return header.field;
				
		}
	}

	$effect(() => {
		if (_searchstring != searchstring) {
			console.log("searchstring", _searchstring, searchstring)
			_searchstring = searchstring;
			data.page_index = 0;
			data.total_count = 99999;
		}
		if (_collectionname != collectionname) {
			console.log("collectionname", _collectionname, collectionname)
			_collectionname = collectionname;
			_searchstring = settings.getvalue(page, "searchstring", "");
			searchstring = settings.getvalue(page, "searchstring", "");
			selected_items = settings.getvalue(page, "selected_items", []);
			data.loadsettings(page, null);
			data.total_count = 99999;
		}
		settings.setvalue(page, "searchstring", $state.snapshot(searchstring));
		// data.SaveHeaders(page);
		if (selected_items.length > 0) {
			settings.setvalue(page, "selected_items", selected_items);
		} else {
			settings.clearvalue(page, "selected_items");
		}
		if (data.page_index > 0) {
			settings.setvalue(page, "page_index", data.page_index);
		} else {
			settings.clearvalue(page, "page_index");
		}
		SetHeaders();
		data.GetData(collectionname, searchstring, query).then((data:any[]) => {
			entities = data;
		});
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
		const fromindex = data.headers.findIndex((h) => h.field == fromfield);
		const toindex = data.headers.findIndex((h) => h.field == head.field);
		if (fromindex != toindex) {
			data.headers.splice(toindex, 0, data.headers.splice(fromindex, 1)[0]);
			data.SaveHeaders(page);
		}
	}
	function ontouchend(event: TouchEvent, head: TableHeader) {
		const fromindex = data.headers.findIndex((h) => h.field == startrow);
		const toindex = data.headers.findIndex((h) => h.field == head.field);
		if (fromindex != toindex) {
			data.headers.splice(toindex, 0, data.headers.splice(fromindex, 1)[0]);
			data.SaveHeaders(page);
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
		var exists = data.headers.find((x) => x.field == field);
		if (exists == null) {
			return "";
		}
		return exists.order;
	}
	function setSort(field: string, value: sort) {
		if (Array.isArray(data.headers) == false) data.headers = [];
		let column = data.headers.find((x) => x.field == field);
		let index = data.headers.findIndex((x) => x.field == field);
		if (column != null) {
			if (value == "") {
				column.orderindex = 0;
			} else {
				column.orderindex =
					data.headers.filter((x) => x.order != "").length + 1;
			}
			data.headers[index] = { ...column, order: value };
			data.SaveHeaders(page);
		}
	}

	function toggleSort(e: any, field: string) {
		e.preventDefault();
		e.stopPropagation();
		const current = sortby(field);
		if (!multi_sort) {
			for (let i = 0; i < data.headers.length; i++) {
				const _field = data.headers[i].field;
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
		data.GetData(collectionname, searchstring, query).then((data:any[]) => {
			entities = data;
		});
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
		data.SaveHeaders(page);
	}
	function ToggleSelect(x: any) {
		if (selected_items.indexOf(x._id) > -1) {
			selected_items = selected_items.filter((y) => y != x._id);
		} else {
			selected_items = [...selected_items, x._id];
		}
		data.SaveHeaders(page);
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
</script>

<!-- error message-->
<div class="text-red-500">{data.errormessage}</div>
<!-- <SuperDebug data={headers} theme="vscode" /> -->
<Table.Root>
	{#if entities.length === 0}
		<Table.Caption>No entities found.</Table.Caption>
	{:else if caption != ""}
		<Table.Caption>{caption}</Table.Caption>
	{:else}
		<Table.Caption>
			{#if entities.length == data.total_count}
				showing {data.total_count} items
			{:else}
				showing item {data.page_index * 5 + 1}
				{#if entities.length > 1}
					to {data.page_index * 5 + entities.length}
				{/if}
				of {data.total_count}
			{/if}
			{#if selected_items.length > 0}
				with {selected_items.length} selected (<button
					onclick={() => (selected_items = [])}>clear</button
				>)
			{/if}.
		</Table.Caption>
	{/if}
	<Table.Header>
		<Table.Row>
			{#if multi_select}
				<Table.Head class="w-8" role="cell"
					><Checkbox
						aria-label="Select all"
						checked={is_all_selected()}
						onclick={ToogleAll}
					/></Table.Head
				>
			{/if}
			{#each data.headers as head}
				{#if head.show}
					<Table.Head
						class={head.headclass}
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
			{#if action}
				<Table.Head>Action</Table.Head>
			{/if}
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each entities as item}
			<Table.Row
				onclick={() => {
					ToggleSelect(item);
				}}
				ondblclick={() => {
					single_item_click(item);
				}}
			>
				{#if multi_select}
					<Table.Cell class="w-8"
						><Checkbox
							aria-label="Select item"
							checked={selected_items.indexOf(item._id) > -1}
						/></Table.Cell
					>
				{/if}
				{#each data.headers as head}
					{#if head.show}
						<Table.Cell class={head.cellclass}
							>{RenderItemData(item, head.field)}</Table.Cell
						>
					{/if}
				{/each}
				{#if action}
					<Table.Cell>{@render action(item)}</Table.Cell>
				{/if}
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>

<HotkeyButton
	data-shortcut="Control+a,Meta+a"
	onclick={() => {
		if (!is_all_selected()) {
			entities.map((x) => {
				if (selected_items.indexOf(x._id) == -1) {
					selected_items = [...selected_items, x._id];
				}
			});
		} else {
			entities.map((x) => {
				if (selected_items.indexOf(x._id) >= -1) {
					selected_items = selected_items.filter((y) => y != x._id);
				}
			});
		}
	}}
	class="hidden"
	hidden={true}
/>
<HotkeyButton
	data-shortcut="ArrowLeft"
	onclick={() => {
		data.page_index = data.page_index - 1;
	}}
	disabled={data.page_index <= 0}>Previous</HotkeyButton
>
<HotkeyButton
	data-shortcut="ArrowRight"
	onclick={() => {
		data.page_index = data.page_index + 1;
	}}
	disabled={entities.length < 5 || data.page_index * 5 >= data.total_count}
>
	Next</HotkeyButton
>
{#if selected_items.length > 0}
	<HotkeyButton
		onclick={() => delete_selected($state.snapshot(selected_items))}
		data-shortcut="Delete"
		size="sm"
		variant="destructive"
	>
		Delete {selected_items.length} items</HotkeyButton
	>
{/if}
{#if data.headers != null && data.headers.length > 0}
	<Sheet.Root>
		<Sheet.Trigger>Select columns</Sheet.Trigger>
		<Sheet.Content>
			<Sheet.Header>
				<Sheet.Title>Select columns</Sheet.Title>
				<Sheet.Description>
					Select what columns to show in the table.
				</Sheet.Description>
			</Sheet.Header>
			<div class="grid gap-4 py-4">
				<ScrollArea class="max-h-[70vh]">
					{#each data.headers as head}
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

{#if data.headers != null && data.headers.length > 0 && showdebug == true}
	<SuperDebug data={entities} theme="vscode" />
{/if}

<HotkeyButton
	hidden
	class="hidden"
	data-shortcut={"Control+d,Meta+d"}
	onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>
