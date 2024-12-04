<script lang="ts" module>
	import * as Table from "$lib/components/ui/table/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import * as Sheet from "$lib/components/ui/sheet/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";

	import ArrowUp from "lucide-svelte/icons/arrow-up";
	import ArrowDown from "lucide-svelte/icons/arrow-down";
	import SuperDebug from "sveltekit-superforms";

	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { onMount } from "svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { settings } from "$lib/stores/settings.svelte";
	import { get } from "svelte/store";
	export type sort = "asc" | "desc" | "";
	export class TableHeader {
		name: string = "";
		field: string = "";
		headclass: string = "";
		cellclass: string = "";
		order: sort = "";
		orderindex: number = 0;
		show: boolean = $state(true);
	}
</script>

<script lang="ts">
	import { HotkeyButton } from "../hotkeybutton";

	let {
		page = "entities",
		defaultcolumnnames = ["_id", "name", "_type", "_created"],
		query = { _type: "user" },
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

	let _searchstring = $state.snapshot(searchstring);
	let _collectionname = $state.snapshot(collectionname);
	let entities: any[] = $state([]);
	let headers: TableHeader[] = $state([]);
	let multi_sort = $state(true);
	let hide_empty_on_sort = $state(true);
	let errormessage = $state("");
	let page_index = $state(0);
	let total_count = $state(99999);
	let showdebug = $state(false);

	selected_items = settings.getvalue(page, "selected_items", []);
	searchstring = settings.getvalue(page, "searchstring", "");
	headers = settings.getvalue(page, "headers", []);
	page_index = settings.getvalue(page, "page_index", 0);

	async function GetData() {
		let orderby = getOrderBy();
		let query = createQuery();
		let top = 5;
		let skip = page_index * top;
		entities = await auth.client.Query<any>({
			collectionname: collectionname,
			query: query,
			orderby: orderby,
			skip: skip,
			top: 5,
		});
		if (entities.length > 0) {
			let keys = [];
			for(let i = 0; i < entities.length; i++) {
				let entity = entities[i];
				let subkeys = Object.keys(entity);
				for(let j = 0; j < subkeys.length; j++) {
					let key = subkeys[j];
					if(keys.indexOf(key) == -1) {
						keys.push(key);
					}
				}
			}
			for(let i = 0; i < keys.length; i++) {
				let key = keys[i];
				if(headers.find(x => x.field == key) == null) {
					let header = new TableHeader();
					header.field = key;
					header.name = key;
					header.show = false;
					headers.push(header);
				}
			}
			total_count = await auth.client.Count({ collectionname, query });
		}
	}

	function EnsureDefaultHeaders() {
		if (headers.length == 0) {
			for (let i = 0; i < defaultcolumnnames.length; i++) {
				let header = new TableHeader();
				header.field = defaultcolumnnames[i];
				switch (header.field) {
					case "name":
						header.name = "Name";
						break;
					case "type":
						header.name = "Type";
						break;
					case "_type":
						header.name = "Type";
						break;
					case "_created":
						header.name = "Created";
						break;
					case "_modified":
						header.name = "Modified";
						break;
					default:
						header.name = header.field;
				}
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
				headers.push(header);
			}
		}
	}
	function SetHeaders() {
		EnsureDefaultHeaders();
		let foundfirst = false;
		for (let i = 0; i < headers.length; i++) {
			let header = headers[i];
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
	function SaveHeaders() {
		let _headers = $state.snapshot(headers);
		for(let i=0; i < _headers.length; i++) {
			_headers[i].show = $state.snapshot(headers[i].show);
		}
		settings.setvalue(page, "headers", _headers);
	}

	auth.onLogin(async () => {
		$effect(() => {
			if (_searchstring != searchstring) {
				_searchstring = searchstring;
				page_index = 0;
				total_count = 99999;
			}
			if (_collectionname != collectionname) {
				_collectionname = collectionname;
				page_index = settings.getvalue(page, "page_index", 0);
				_searchstring = settings.getvalue(page, "searchstring", "");
				searchstring = settings.getvalue(page, "searchstring", "");
				selected_items = settings.getvalue(page, "selected_items", []);
				headers = settings.getvalue(page, "headers", []);
				total_count = 99999;
			}
			settings.setvalue(
				page,
				"searchstring",
				$state.snapshot(searchstring),
			);
			SaveHeaders();
			if (selected_items.length > 0) {
				settings.setvalue(page, "selected_items", selected_items);
			} else {
				settings.clearvalue(page, "selected_items");
			}
			if (page_index > 0) {
				settings.setvalue(page, "page_index", page_index);
			} else {
				settings.clearvalue(page, "page_index");
			}
			SetHeaders();
			GetData();
		});

		SetHeaders();
		await GetData();
	});

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
		const fromindex = headers.findIndex((h) => h.field == fromfield);
		const toindex = headers.findIndex((h) => h.field == head.field);
		if (fromindex != toindex) {
			headers.splice(toindex, 0, headers.splice(fromindex, 1)[0]);
			SaveHeaders();
		}
	}
	function ontouchend(event: TouchEvent, head: TableHeader) {
		const fromindex = headers.findIndex((h) => h.field == startrow);
		const toindex = headers.findIndex((h) => h.field == head.field);
		if (fromindex != toindex) {
			headers.splice(toindex, 0, headers.splice(fromindex, 1)[0]);
			SaveHeaders();
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
		var exists = headers.find((x) => x.field == field);
		if (exists == null) {
			return "";
		}
		return exists.order;
	}
	function setSort(field: string, value: sort) {
		if (Array.isArray(headers) == false) headers = [];
		let column = headers.find((x) => x.field == field);
		let index = headers.findIndex((x) => x.field == field);
		if (column != null) {
			if (value == "") {
				column.orderindex = 0;
			} else {
				column.orderindex =
					headers.filter((x) => x.order != "").length + 1;
			}
			headers[index] = { ...column, order: value };
		}
	}

	function toggleSort(e: any, field: string) {
		e.preventDefault();
		e.stopPropagation();
		const current = sortby(field);
		if (!multi_sort) {
			for (let i = 0; i < headers.length; i++) {
				const _field = headers[i].field;
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
		GetData();
	}
	function getOrderBy() {
		const orderby: { [key: string]: number } = {};
		let ordered = headers
			.filter((x) => x.order != "")
			.sort((a, b) => {
				return a.orderindex - b.orderindex;
			});
		for (let i = 0; i < ordered.length; i++) {
			const sortKey = ordered[i];
			if (sortKey.order != null && sortKey.order != "") {
				orderby[sortKey.field] = sortKey.order == "desc" ? -1 : 1;
			}
		}
		return orderby;
	}
	/**
	 * ******************************************
	 * Sorting data
	 */

	/**
	 * Searching data
	 * ******************************************
	 */
	function parseJson(txt: string, reviver: any, context: any) {
		context = context || 20;
		try {
			return JSON.parse(txt, reviver);
		} catch (e: any) {
			if (typeof txt !== "string") {
				const isEmptyArray =
					Array.isArray(txt) && (txt as any).length === 0;
				const errorMessage =
					"Cannot parse " +
					(isEmptyArray ? "an empty array" : String(txt));
				errormessage = errorMessage;
				throw new TypeError(errorMessage);
			}
			const syntaxErr = e.message.match(
				/^Unexpected token.*position\s+(\d+)/i,
			);
			const errIdx = syntaxErr
				? +syntaxErr[1]
				: e.message.match(/^Unexpected end of JSON.*/i)
					? txt.length - 1
					: null;
			if (errIdx != null) {
				const start = errIdx <= context ? 0 : errIdx - context;
				const end =
					errIdx + context >= txt.length
						? txt.length
						: errIdx + context;
				e.message += ` while parsing near "${
					start === 0 ? "" : "..."
				}${txt.slice(start, end)}${end === txt.length ? "" : "..."}"`;
			} else {
				e.message += ` while parsing "${txt.slice(0, context * 2)}"`;
			}
			throw e;
		}
	}
	function safeEval(jsStr: string) {
		try {
			return Function(`"use strict";return (` + jsStr + `)`)();
		} catch (e: any) {
			errormessage = e.message;
			return null;
		}
	}
	function createQuery() {
		let q: any = { ...query };

		if (hide_empty_on_sort == true) {
			let ordered = headers.filter(
				(x) => x.order != "" && x.field != "_id",
			);
			if (ordered.length > 0) {
				let ands: any = {};
				for (let i = 0; i < ordered.length; i++) {
					const field = ordered[i].field;
					const or: any = {};
					ands[field] = { $exists: true, $ne: null };
				}
				q = { $and: [ands, q] };
			}
		}

		if (searchstring == null || searchstring == "") {
			return q;
		}
		if (searchstring.indexOf("{") == 0) {
			if (searchstring.lastIndexOf("}") == searchstring.length - 1) {
				try {
					q = parseJson(searchstring, null, null);
				} catch (e: any) {
					try {
						q = safeEval(searchstring);
					} catch (error2: any) {
						errormessage = e.message;
						return null;
					}
				}
			} else {
				errormessage = "Incomplete query object";
			}
		} else {
			q["name"] = { $regex: searchstring, $options: "i" };
		}
		return q;
	}
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
	}
	function ToggleSelect(x: any) {
		if (selected_items.indexOf(x._id) > -1) {
			selected_items = selected_items.filter((y) => y != x._id);
		} else {
			selected_items = [...selected_items, x._id];
		}
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
<div class="text-red-500">{errormessage}</div>
<!-- <SuperDebug data={headers} theme="vscode" /> -->
<Table.Root>
	{#if entities.length === 0}
		<Table.Caption>No entities found.</Table.Caption>
	{:else if caption != ""}
		<Table.Caption>{caption}</Table.Caption>
	{:else}
		<Table.Caption>
			{#if entities.length == total_count}
				showing {total_count} items
			{:else}
				showing item {page_index * 5 + 1}
				{#if entities.length > 1}
					to {page_index * 5 + entities.length}
				{/if}
				of {total_count}
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
					><Checkbox aria-label="Select all"
						checked={is_all_selected()}
						onclick={ToogleAll}
					/></Table.Head
				>
			{/if}
			{#each headers as head}
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
						>{head.name}
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
						><Checkbox aria-label="Select item"
							checked={selected_items.indexOf(item._id) > -1}
						/></Table.Cell
					>
				{/if}
				{#each headers as head}
					{#if head.show}
						<Table.Cell class={head.cellclass}
							>{item[head.field]}</Table.Cell
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
		page_index = page_index - 1;
	}}
	disabled={page_index <= 0}>Previous</HotkeyButton
>
<HotkeyButton
	data-shortcut="ArrowRight"
	onclick={() => {
		page_index = page_index + 1;
	}}
	disabled={entities.length < 5 || page_index * 5 >= total_count}
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
{#if headers != null && headers.length > 0}
	<Sheet.Root>
		<Sheet.Trigger>
			<HotkeyButton
			size="sm"
		>
		Select columns</HotkeyButton
		>
		</Sheet.Trigger>
		<Sheet.Content>
			<Sheet.Header>
				<Sheet.Title>Select columns</Sheet.Title>
				<Sheet.Description>
				  Select what columns to show in the table.
				</Sheet.Description>
			  </Sheet.Header>
			  <div class="grid gap-4 py-4">
				<ScrollArea class="max-h-[70vh]">

				{#each headers as head}
				<div class=" flex items-center space-x-4 rounded-md border p-4">
					<!-- <BellRing /> -->
					<div class="flex-1 space-y-1">
					  <p class="text-muted-foreground text-sm">
						{head.field}
					  </p>
					</div>
					<Switch bind:checked={head.show} onclick={()=> {
						// SaveHeaders();
					}}/>
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

{#if headers != null && headers.length > 0 && showdebug == true} 
	<SuperDebug data={headers} theme="vscode" />
{/if}

<HotkeyButton
  hidden
  class="hidden"
  data-shortcut={"Control+d,Meta+d"}
  onclick={() => (showdebug = !showdebug)}>Toggle debug</HotkeyButton
>