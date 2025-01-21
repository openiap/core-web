<script lang="ts">
	import * as Select from "$lib/components/ui/select";
	let {
		value = $bindable(""),
		onValueChangeFunction = null,
		triggerContent = () => {},
		type,
		loading = false,
		selectitems = [],
	} = $props();
</script>

<Select.Root
	disabled={loading}
	{type}
	bind:value
	onValueChange={onValueChangeFunction}
>
	<Select.Trigger
		class="h-8 w-64 py-2 rounded-[10px] border dark:border-bw600 dark:placeholder-bw500 dark:text-bw400 dark:bg-bw800 focus:outline-none"
	>
		{triggerContent()}
	</Select.Trigger>
	<Select.Content
		class="dark:bg-bw850 border dark:border-bw600 dark:text-bw100"
	>
		{#each selectitems as item}
			<Select.Item
				value={item?.image || item?.stripeprice}
				label={item.name}
				class={` ${value === (item?.image || item?.stripeprice) && "border dark:border-bw600 dark:bg-bw700 "} rounded-[10px] dark:text-bw100`}
				>{item.name}</Select.Item
			>
		{/each}
	</Select.Content>
</Select.Root>
