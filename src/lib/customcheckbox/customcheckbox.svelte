<script lang="ts">
	import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
	let {
		class: classname = "mr-5 ml-1.5",
		arialabel = "",
		checked = $bindable(false),
		disabled = false,
		handleClick = null,
	} = $props();
	console.log("class", classname);
</script>

<Checkbox
	aria-label={arialabel}
	class={`dark:border dark:border-bw300 dark:text-bw100 w-6 h-6 md:w-4 md:h-4  ${checked && "dark:bg-bw500"} ` +
		classname}
	onclick={handleClick}
	{disabled}
	bind:checked
/>
