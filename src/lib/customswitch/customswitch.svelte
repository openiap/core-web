<script lang="ts">
	import Switch from "$lib/components/ui/switch/switch.svelte";
	function onvc(value: any) {}

	let {
		class: className = "",
		loading = $bindable(false),
		checked = $bindable(),
		onclick = onvc,
		...props
	} = $props();
</script>

<Switch
	{...props}
	class={`dark:border-[1px] dark:border-bw500 + ${className}`}
	disabled={loading}
	bind:checked
	aria-readonly
	{onclick}
/>
