<script lang="ts">
	import Input from "$lib/components/ui/input/input.svelte";

	let {
		class: className = "",
		width = "w-full md:w-1/2 lg:w-1/3",
		height = "h-8",
		size = "sm",
		value = $bindable(null),
		type = "text",
		disabled = false,
		placeholder = "Type here",
		onchangefunction = null,
		multiple = false,
		ref = $bindable(null),
		...props
	} = $props();
	export function focus() {
		console.log("focus", ref);
		ref.focus();
	}

	function getClass() {
		let classes =
			"bg-bw50 py-2 rounded-[10px] border border-bw600 dark:border-bw600 placeholder:text-bw500 dark:placeholder:text-bw500 text-bw950 dark:text-bw100 dark:bg-bw800 focus:outline-none ";
		if (size === "sm") {
			classes += "h-7";
		} else if (size === "md") {
			classes += "h-8";
		}
		return classes + " " + className + " " + height + " " + width;
	}
</script>

<Input
	{...props}
	{placeholder}
	bind:value
	{disabled}
	data-shortcut={"ctrl+f,meta+f"}
	{type}
	class={getClass()}
	onchange={onchangefunction}
	{multiple}
	bind:ref={ref} 
/>
