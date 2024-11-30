<script lang="ts" module>
	import * as Table from "$lib/components/ui/table/index.js";

	import ArrowUp from "lucide-svelte/icons/arrow-up";
	import ArrowDown from "lucide-svelte/icons/arrow-down";

	import { auth } from "$lib/stores/auth.svelte";
	import { settings } from "$lib/stores/settings.svelte";
	export type sort = "asc" | "desc" | "";
	export class TableHeader {
		name: string = "";
		field: string = "";
		headclass: string = "";
		cellclass: string = "";
		order: sort = "";
		show: boolean = true;
	}
</script>

<script lang="ts">
	let {
		page = "entities",
		defaultcolumnnames = ["name", "_type", "_created"],
		...rest
	} = $props();
	let entities: any[] = $state([]);
	let headers: TableHeader[] = $state([]);
	headers = settings.getvalue(page, "headers", []);
	auth.onLogin(async () => {
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
		entities = await auth.client.Query<any>({
			collectionname: "users",
			query: { _type: "user" },
		});
		// console.log($state.snapshot(entities));
	});

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
		console.log("drop", fromfield, head.field);
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




	let multiSort = $state(false);
	let Columns:TableHeader[] = $state([]);
	function sortby(field:string) {
		var exists = Columns.find((x) => x.field == field);
		if (exists == null) return null;
		return exists.order;
	}
	function setSort(field:string, value:sort) {
		if (Array.isArray(Columns) == false) Columns = [];
		let column = Columns.find((x) => x.field == field);
		if (column == null) {
			Columns.push({ field, order: value, show: false, name: field, headclass: "", cellclass: "" });
			Columns = Columns;
		} else {
			column.order = value;
		}
	}

	function toggleSort(e:any, field:string) {
		e.preventDefault();
		e.stopPropagation();
		const current = sortby(field);

		if (!multiSort && current == null) {
			for (let i = 0; i < Columns.length; i++) {
				const field = Columns[i].field;
				if (field != field) {
					setSort(field, "");
				}
			}
		}
		if (current == null) {
			setSort(field, "asc");
		} else if (current == "asc") {
			setSort(field, "desc");
		} else {
			setSort(field, "");
		}
		// GetData();
	}
	function getOrderBy() {
		const orderby: { [key: string]: number } = {};
		for (let i = 0; i < Columns.length; i++) {
			const sortKey = Columns[i];
			if (sortKey.order != null) {
				orderby[sortKey.field] = sortKey.order == "desc" ? -1 : 1;
			}
		}
		return orderby;
	}
</script>

<Table.Root>
	{#if entities.length === 0}
		<Table.Caption>No entities found.</Table.Caption>
	{:else}
		<Table.Caption>A list of your recent invoices.</Table.Caption>
	{/if}
	<Table.Header>
		<Table.Row>
			{#each headers as head}
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
			{/each}
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each entities as item}
			<Table.Row>
				{#each headers as head}
					<Table.Cell class={head.cellclass}
						>{item[head.field]}</Table.Cell
					>
				{/each}
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
