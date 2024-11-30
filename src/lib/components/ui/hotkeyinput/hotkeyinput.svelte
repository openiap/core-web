<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";
	import type { WithElementRef } from "bits-ui";

	import { cn } from "$lib/utils.js";
	import { install, uninstall } from "@github/hotkey";
	import { onMount } from "svelte";
	import { onDestroy } from "svelte";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...restProps
	}: WithElementRef<HTMLInputAttributes> = $props();

	onMount(() => {
		$effect(() => {
			console.log("Ref", ref);
			if(ref == null) return;
			if(ref.dataset && ref.dataset.shortcut) {
				console.log("Ref.dataset.shortcut", ref.dataset.shortcut);
				install(ref, ref.dataset.shortcut)
			}

		});
	});
	onDestroy(() => {
		if(ref == null) return;
		if(ref.dataset && ref.dataset.shortcut) {
			uninstall(ref)
		}
	});
</script>

<input
	bind:this={ref}
	class={cn(
		"border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
	bind:value
	onkeyup={e => { 
		if(e.key == "Escape") {
		  value = "";
		  // @ts-ignore
		  e.target.blur();
		} else if (e.key == "Enter") {
		  // @ts-ignore
		  e.target.blur();
		}
	  }}
	{...restProps}
/>
