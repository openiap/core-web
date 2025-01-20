<script lang="ts">
	import Switch from "$lib/components/ui/switch/switch.svelte";
	let {
		loading = $bindable(false),
		checked = $bindable(),
		...props
	} = $props();
</script>

<Switch
	{...props}
	class={` border-[1px] dark:border-bw500 dark:bg-bw500 dark:text-bw100  ${checked && "dark:bg-bw700"}`}
	disabled={loading}
	bind:checked
	aria-readonly
/>
