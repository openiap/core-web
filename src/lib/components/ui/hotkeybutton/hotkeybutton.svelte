<script lang="ts" module>
	// import { install, uninstall } from "@github/hotkey";
	import Mousetrap from "mousetrap";

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
				base: "shadow-soft border border-bw300 hover:border-bw400 bg-50 hover:bg-bw100 text-bw950  dark:border-bw600 dark:text-bw100 dark:hover:border-bw500 dark:hover:bg-bw700 dark:bg-bw850 dark:text-bw200 border border-bw600",
				danger: "border bg-lightbgred hover:bg-lighthoverred dark:border-bw600 dark:text-bw100 dark:hover:border-bw500 dark:bg-darkbgred dark:hover:bg-darkbghoverred",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
				ghostfull: "",
				icon: "text-bw500 hover:bg-bw200 hover:text-bw950 dark:text-bw300 dark:bg-bw700 dark:hover:bg-bw700 border border-transparent dark:hover:border-bw500",
				headericon:
					"text-bw600 bg-bw200 hover:bg-bw300 dark:text-bw300 dark:bg-bw700 dark:hover:bg-bw700 border border-transparent dark:hover:border-bw500",
				success:
					"border bg-lightbggreen hover:bg-lighthovergreen dark:border-bw600 dark:text-bw100 dark:hover:border-bw500 dark:bg-darkbggreen dark:hover:bg-darkbghovergreen",
				refresh:
					"text-bw950	bg-bw200 hover:bg-bw300 hover:border-bw500 border dark:border-bw600 dark:bg-bw850 dark:text-bw100 dark:hover:bg-bw700 dark:hover:border-bw500",
				entitydefault:
					"rounded-[0px] hover:text-bw50 hover:bg-lightentities dark:hover:bg-darkentities",
				entityselected:
					"cursor-not-allowed rounded-[0px] text-bw50 bg-lightentitiesselected dark:bg-darkentitiesselected",
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
				// install(ref, ref.dataset.shortcut);
				const array = ref.dataset.shortcut.split(",");
				for (let i = 0; i < array.length; i++) {
					const key = array[i];
					Mousetrap.bind(array[i], function (e) {
						if (e.preventDefault) {
							e.preventDefault();
						} else {
							e.returnValue = false;
						}
						ref?.click();
					});
				}
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
