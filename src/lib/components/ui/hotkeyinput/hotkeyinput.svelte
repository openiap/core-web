<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";
	import type { WithElementRef } from "bits-ui";

	import { cn } from "$lib/utils.js";
	// import { install, uninstall } from "@github/hotkey";
	import Mousetrap from 'mousetrap';
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
			if(ref == null) return;
			if(ref.dataset && ref.dataset.shortcut) {
				// install(ref, ref.dataset.shortcut)
				const array = ref.dataset.shortcut.split(",");
				for (let i = 0; i < array.length; i++) {
					const key = array[i];
					Mousetrap.bind(array[i], function(e) {
						if (e.preventDefault) {
							e.preventDefault();
						} else {
							e.returnValue = false;
						}
						ref?.focus();
					});
				}
			}
		});
	});
	onDestroy(() => {
		if(ref == null) return;
		if(ref.dataset && ref.dataset.shortcut) {
			// uninstall(ref)
			const array = ref.dataset.shortcut.split(",");
			for (let i = 0; i < array.length; i++) {
				const key = array[i];
				Mousetrap.unbind(key);
			}
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
		  (e.target as HTMLInputElement)?.blur();
		} else if (e.key == "Enter") {
			(e.target as HTMLInputElement)?.blur();
		}
	  }}
	{...restProps}
/>
