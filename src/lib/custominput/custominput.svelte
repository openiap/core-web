<script lang="ts">
	import Input from "$lib/components/ui/input/input.svelte";

	let {
		class: className = "",
		width = "w-64",
		height = "h-8",
		size = "sm",
		value = $bindable(null),
		type = "text",
		disabled = false,
		placeholder = "Type here",
		onchangefunction = null,
		multiple = false,
	} = $props();

	function getClass() {
		let classes =
			"py-2 rounded-[10px] border dark:border-bw600 dark:placeholder-bw500 dark:text-bw400 dark:bg-bw800 focus:outline-none ";
		if (size === "sm") {
			classes += "h-7";
		} else if (size === "md") {
			classes += "h-8";
		}
		return classes + " " + className + " " + height + " " + width;
	}
</script>

<Input
	id="searchstring"
	{placeholder}
	bind:value
	{disabled}
	data-shortcut={"Control+f,Meta+f"}
	{type}
	class={getClass()}
	onchange={onchangefunction}
	{multiple}
/>
