<script lang="ts" module>
	import * as Table from "$lib/components/ui/table/index.js";
	import { auth } from "$lib/stores/auth.svelte";
	class TableHeader {
		name: string = "";
		field: string = "";
		headclass: string = "";
		cellclass: string = "";
	}
</script>

<script lang="ts">
	let entities:any[] = $state([]);
	let headers: TableHeader[] = [
		{ name: "Invoice", field: "invoice", headclass: "w-[100px]", cellclass: "font-medium" },
		{ name: "Status", field: "status",headclass: "", cellclass: "" },
		{ name: "Method", field: "method",headclass: "", cellclass: "" },
		{ name: "Amount", field: "amount",headclass: "text-right", cellclass: "text-right" }
	];
	entities = [
		{ invoice: "INV001", status: "Paid", method: "Credit Card", amount: "$250.00" },
		{ invoice: "INV002", status: "Paid", method: "Credit Card", amount: "$250.00" },
		{ invoice: "INV003", status: "Paid", method: "Credit Card", amount: "$250.00" },
		{ invoice: "INV004", status: "Paid", method: "Credit Card", amount: "$250.00" },
		{ invoice: "INV005", status: "Paid", method: "Credit Card", amount: "$250.00" },
		{ invoice: "INV006", status: "Paid", method: "Credit Card", amount: "$250.00" },
		{ invoice: "INV007", status: "Paid", method: "Credit Card", amount: "$250.00" },
		{ invoice: "INV008", status: "Paid", method: "Credit Card", amount: "$250.00" },
		{ invoice: "INV009", status: "Paid", method: "Credit Card", amount: "$250.00" },
		{ invoice: "INV010", status: "Paid", method: "Credit Card", amount: "$250.00" }
	]
	auth.onLogin(async () => {
		// entities = await auth.client.Query<any>({ collectionname: "users", query: {"_type": "user"} });
		// console.log($state.snapshot(entities));
	});
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
				<Table.Head class={head.headclass}>{head.name}</Table.Head>
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

		<Table.Row>
			<Table.Cell class="font-medium">INV001</Table.Cell>
			<Table.Cell>Paid</Table.Cell>
			<Table.Cell>Credit Card</Table.Cell>
			<Table.Cell class="text-right">$250.00</Table.Cell>
		</Table.Row>
	</Table.Body>
</Table.Root>
