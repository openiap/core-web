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
	class={`dark:border-[1px] dark:border-bw500`}
	disabled={loading}
	bind:checked
	aria-readonly
/>
