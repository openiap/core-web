<script lang="ts">
	import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
	let {
		class: classname = "",
		arialabel = "",
		checked = $bindable(false),
		disabled = false,
	} = $props();
</script>

<Checkbox
	aria-label={arialabel}
	class={`dark:border dark:border-bw500 dark:text-bw100 w-4 h-4 ${checked && "dark:bg-bw500"} ` +
		classname}
	{disabled}
	bind:checked
/>
