<script lang="ts">
	import * as Select from "$lib/components/ui/select";
	import { Check } from "lucide-svelte";
	function onvc(value: any) {}
	let {
		class: className = "h-8",
		value = $bindable(),
		onValueChangeFunction = onvc,
		triggerContent = () => {},
		type,
		loading = false,
		selectitems = [],
		width: _width = " w-full md:w-1/2 lg:w-1/3",
	} = $props();

	function getValue(item: any) {
		if (item == null) return "";
		if (item._id != null) return item._id;
		if (item.image != null) return item.image;
		if (item.stripeprice != null) return item.stripeprice;
		if (item.value != null) return item.value;
		if (item.sha != null) return item.sha;
		if (item.name != null) return item.name;
		return item;
	}
</script>

<Select.Root
	disabled={loading}
	{type}
	bind:value
	onValueChange={onValueChangeFunction}
>
	<Select.Trigger
		class={"shadow-soft dark:shadow-dark bg-bw50 py-2 rounded-[10px] border border-bw600 dark:border-bw600 placeholder:text-bw500 dark:placeholder:text-bw500 text-bw950 dark:text-bw100 dark:bg-bw800 focus:outline-none " +
			" " +
			_width +
			" " +
			className}
	>
		{triggerContent()}
	</Select.Trigger>
	<Select.Content
		class="dark:bg-bw850 border dark:border-bw600 dark:text-bw100"
	>
		{#each selectitems as item}
			<Select.Item
				value={getValue(item)}
				label={item.name}
				class={` ${value === (item?._id || item?.image || item?.stripeprice || item?.name || item?.value) && "border dark:border-bw600 dark:bg-bw700 "} rounded-[10px] dark:text-bw100`}
			>
				<!-- {#if value === (item?._id || item?.image || item?.stripeprice || item?.name || item?.value)}
					<Check />
				{/if} -->
				{item?.name || item?.label || item}</Select.Item
			>
		{/each}
	</Select.Content>
</Select.Root>
