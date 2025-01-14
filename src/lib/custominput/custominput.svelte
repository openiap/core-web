<script lang="ts">
	import Input from "$lib/components/ui/input/input.svelte";
	let {
		value = $bindable(""),
		type = $bindable(""),
		disabled = false,
		placeholder = "Type here",
	} = $props();
</script>

<div class="flex flex-col gap-1.5">
	<Input
		id="searchstring"
		{placeholder}
		bind:value
		{disabled}
		data-shortcut={"Control+f,Meta+f"}
		{type}
		class="w-full h-8 w-64  py-2 rounded-[10px] border dark:border-bw600 dark:placeholder-bw500 dark:text-bw400 dark:bg-bw800 focus:outline-none"
	/>
</div>
