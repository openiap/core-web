<script lang="ts" module>
	import * as Table from "$lib/components/ui/table/index.js";
	import { auth } from "$lib/stores/auth.svelte";
	import { settings } from "$lib/stores/settings.svelte";
	class TableHeader {
		name: string = "";
		field: string = "";
		headclass: string = "";
		cellclass: string = "";
	}
</script>

<script lang="ts">
	let { page = "entities", defaultcolumnnames = ['name', '_type','_created'], ...rest} = $props();
	let entities:any[] = $state([]);
	let headers: TableHeader[] = $state([]);
	// settings.setvalue(page, "headers", []);
	headers = settings.getvalue(page, "headers", []);
	auth.onLogin(async () => {
		if( headers.length == 0) {
			for(let i = 0; i < defaultcolumnnames.length; i++) {
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
				if(i == 0) {
					header.headclass = "w-[100px]";
					header.cellclass = "font-medium";
				}
				if (i == defaultcolumnnames.length - 1) {
					header.headclass = "text-right";
					header.cellclass = "text-right";
				}
				headers.push(header);
			}
			// settings.setvalue(page, "headers", $state.snapshot(headers));
		}
		entities = await auth.client.Query<any>({ collectionname: "users", query: {"_type": "user"} });
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
		const fromindex = headers.findIndex(h => h.field == fromfield);
		const toindex = headers.findIndex(h => h.field == head.field);
		if(fromindex != toindex) {
			headers.splice(toindex, 0, headers.splice(fromindex, 1)[0]);
			settings.setvalue(page, "headers", $state.snapshot(headers));
		}
	}
	function ontouchend(event: TouchEvent, head: TableHeader) {
		const fromindex = headers.findIndex(h => h.field == startrow);
		const toindex = headers.findIndex(h => h.field == head.field);
		if(fromindex != toindex) {
			headers.splice(toindex, 0, headers.splice(fromindex, 1)[0]);
			settings.setvalue(page, "headers", $state.snapshot(headers));
		}
	}
	function ontouchmove(event: TouchEvent) {
		event.preventDefault();
	}
	// finish adding move logic for touch 
	// https://www.horuskol.net/blog/2020-08-15/drag-and-drop-elements-on-touch-devices/
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
				<Table.Head class={head.headclass} role="cell"
				draggable=true ondragstart={e=> ondragstart(e, head)} ondragover={ondragover} ondrop={e => ondrop(e, head)}
				ontouchstart={e=> ontouchstart(e, head)} ontouchend={e => ontouchend(e, head)} ontouchmove={ontouchmove}
				>{head.name}</Table.Head>
			{/each}
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each entities as item}
		<Table.Row>
			{#each headers as head}
				<Table.Cell  class={head.cellclass}>{item[head.field]}</Table.Cell>
			{/each}	
		</Table.Row>
		{/each}

	</Table.Body>
</Table.Root>
