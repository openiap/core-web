<script lang="ts">
	import type { HTMLTdAttributes } from "svelte/elements";
	import type { WithElementRef } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLTdAttributes> = $props();
</script>

<td
	bind:this={ref}
	class={cn(
		"font-medium h-6 p-1.5 align-middle [&:has([role=checkbox])]:pr-0 px-2.5",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</td>
