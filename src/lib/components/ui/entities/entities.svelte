<script lang="ts" module>
	import * as Table from "$lib/components/ui/table/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";

	import ArrowUp from "lucide-svelte/icons/arrow-up";
	import ArrowDown from "lucide-svelte/icons/arrow-down";
	import SuperDebug from "sveltekit-superforms";

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
		show: boolean = true;
	}
</script>

<script lang="ts">
	import Hotkeybutton from "../hotkeybutton/hotkeybutton.svelte";

	let {
		page = "entities",
		defaultcolumnnames = ["_id", "name", "_type", "_created"],
		query = { _type: "user" },
		searchstring = "",
		collectionname = "entities",
		selected_items = $bindable([]),
		action,
		...rest
	} = $props();
	let entities: any[] = $state([]);
	let headers: TableHeader[] = $state([]);
	headers = settings.getvalue(page, "headers", []);
	let multiSort = $state(true);
	let hide_empty_on_sort = $state(true);
	let errormessage = $state("");

	let is_multi_selecting = $state(false);

	async function GetData() {
		let orderby = getOrderBy();
		let query = createQuery();
		entities = await auth.client.Query<any>({
			collectionname: collectionname,
			query: query,
			orderby: orderby,
			top: 5,
		});
	}

	auth.onLogin(async () => {
		$effect(() => {
			settings.setvalue(
				page,
				"searchstring",
				$state.snapshot(searchstring),
			);
			GetData();
		});
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
					case "_created":
						header.name = "Created";
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
			settings.setvalue(page, "headers", $state.snapshot(headers));
		}
	}
	function ontouchend(event: TouchEvent, head: TableHeader) {
		const fromindex = headers.findIndex((h) => h.field == startrow);
		const toindex = headers.findIndex((h) => h.field == head.field);
		if (fromindex != toindex) {
			headers.splice(toindex, 0, headers.splice(fromindex, 1)[0]);
			settings.setvalue(page, "headers", $state.snapshot(headers));
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
			headers[index] = { ...column, order: value };
		}
	}

	function toggleSort(e: any, field: string) {
		e.preventDefault();
		e.stopPropagation();
		const current = sortby(field);
		if (!multiSort) {
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
	{:else}
		<Table.Caption>A list of your recent invoices.</Table.Caption>
	{/if}
	<Table.Header>
		<Table.Row>
			{#if is_multi_selecting}
				<Table.Head class="w-8" role="cell"
					><Checkbox
						checked={is_multi_selecting}
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
			{#if action && is_multi_selecting == false}
				<Table.Head></Table.Head>
			{/if}
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each entities as item}
			<Table.Row
			onclick={() => {
				if(is_multi_selecting) {
					ToggleSelect(item);
				}
			}}
			>
				{#if is_multi_selecting}
					<Table.Cell class="w-8"
						><Checkbox
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
				{#if action && is_multi_selecting == false}
					<Table.Cell>{@render action(item)}</Table.Cell>
				{/if}
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>

<Hotkeybutton
	data-shortcut="Control+a,Meta+a"
	onclick={() => {
		is_multi_selecting = !is_multi_selecting;
		selected_items = entities.map((x) => x._id);
	}}
	class="hidden"
	hidden={true}
/>

{#if headers != null && headers.length > 0}
	<!-- <SuperDebug data={headers} theme="vscode" /> -->
{/if}
