<script lang="ts" module>
	import { install, uninstall } from "@github/hotkey";
	import Mousetrap from 'mousetrap';

	import type { WithElementRef } from "bits-ui";
	import { onDestroy, onMount } from "svelte";
	import type {
		HTMLAnchorAttributes,
		HTMLButtonAttributes,
	} from "svelte/elements";
	import { type VariantProps, tv } from "tailwind-variants";

	export const buttonVariants = tv({
		base: "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ",
		variants: {
			variant: {
				base: "border-[1px] dark:border-bw600 dark:text-bw100 dark:hover:border-bw500 dark:hover:bg-bw700 dark:bg-bw850 dark:text-bw200 border-[1px] border-bw600",
				danger: "border-[1px] dark:border-bw600 dark:text-bw100 dark:hover:border-bw500 dark:bg-darkbgred dark:hover:bg-darkbghoverred",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
				ghostfull: "",
				icon: "dark:text-bw300 dark:hover:bg-bw700 border-[1px] border-transparent dark:hover:border-bw500",
				success:
					"border-[1px] dark:border-bw600 dark:text-bw100 dark:hover:border-bw500 dark:bg-darkbggreen dark:hover:bg-darkbghovergreen",
				refresh:
					"border dark:border-bw600 dark:bg-bw850 dark:hover:bg-bw700 dark:hover:border-bw500",
				entitydefault: "rounded-[0px] dark:hover:bg-darkentities",
				entityselected:
					"cursor-not-allowed rounded-[0px] bg-darkentitiesselected dark:bg-darkentitiesselected",
			},
			size: {
				base: "h-8 px-2.5 py-1.5 rounded-[10px]",
				icon: "h-7 w-7 rounded-[10px] p-2",
				sm: "h-7 px-2.5 py-1.5 rounded-[10px]",
				lg: "h-8 px-2.5 py-1.5 rounded-[10px]",
				tableicon: "p-1 rounded-[10px]",
				refresh: "p-1 rounded-[10px]",
				entity: "h-8 px-2.5 py-1.5",
			},
		},
		defaultVariants: {
			variant: "base",
			size: "base",
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		class: className,
		variant = "base",
		size = "base",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		"aria-label": ariaLabel = "default",
		children,
		...restProps
	}: ButtonProps = $props();

	onMount(() => {
		$effect(() => {
			if (ref == null) return;
			if (ref.dataset && ref.dataset.shortcut) {
				const array = ref.dataset.shortcut.split(",");
				for (let i = 0; i < array.length; i++) {
					const key = array[i];
					console.log("register", key);
					Mousetrap.bind(array[i], function(e) {
						if (e.preventDefault) {
							e.preventDefault();
						} else {
							e.returnValue = false;
						}
						console.log(key);
						ref?.click();
					});
				}
				// install(ref, ref.dataset.shortcut);
			}
		});
	});
	onDestroy(() => {
		if (ref == null) return;
		if (ref.dataset && ref.dataset.shortcut) {
			// uninstall(ref);
			const array = ref.dataset.shortcut.split(",");
			for (let i = 0; i < array.length; i++) {
				const key = array[i];
				console.log("unregister", key);
				Mousetrap.unbind(key);
			}
		
		}
	});
</script>

{#if href}
	<a
		bind:this={ref}
		aria-label={ariaLabel}
		class={cn(buttonVariants({ variant, size, className }))}
		{href}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		aria-label={ariaLabel}
		class={cn(buttonVariants({ variant, size, className }))}
		{type}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
