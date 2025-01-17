<script lang="ts" module>
	import { install, uninstall } from "@github/hotkey";
	import { onDestroy, onMount } from "svelte";
</script>

<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	// import { Title } from "../dialog";

	let {
		class: className = "",
		handleClick = (item: any) => {},
		variant = "base",
		size = "base",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		children,
		...restProps
	} = $props();

	onMount(() => {
		$effect(() => {
			if (ref == null) return;
			if (ref.dataset && ref.dataset.shortcut) {
				install(ref, ref.dataset.shortcut);
			}
		});
	});
	onDestroy(() => {
		if (ref == null) return;
		if (ref.dataset && ref.dataset.shortcut) {
			uninstall(ref);
		}
	});
</script>

<Button
	{href}
	bind:this={ref}
	class={className}
	{variant}
	{type}
	{size}
	{...restProps}
	onclick={handleClick}
>
	{@render children?.()}
</Button>
