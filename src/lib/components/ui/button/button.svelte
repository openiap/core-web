<script lang="ts" module>
	import type { WithElementRef } from "bits-ui";
	import type {
		HTMLAnchorAttributes,
		HTMLButtonAttributes,
	} from "svelte/elements";
	import { type VariantProps, tv } from "tailwind-variants";

	export const buttonVariants = tv({
		base: "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
		variants: {
			variant: {
				default:
					"bg-gray-400 text-primary-foreground hover:bg-primary/90",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:bg-destructive/90 dark:bg-darkbgred dark:text-darktextred border-[1px] border-darkborderred",
				outline:
					"border-input bg-background hover:bg-accent hover:text-accent-foreground border",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost: "hover:bg-gray-300 hover:text-gray-500 text-gray-500",
				ghostfull: "",
				link: "text-primary underline-offset-4 hover:underline",
				entitydefault: "bg-indigo-400 cursor-not-allowed text-white",
				entityselected: "bg-indigo-200 text-black hover:opacity-80 ",
				icon: "dark:bg-bw700 dark:text-bw400 p-2",
				new: " dark:bg-bw850 dark:text-bw200 border-[1px] border-bw600 ",
			},
			size: {
				default: "p-1",
				sm: "h-9 rounded-md px-3",
				lg: "h-11 rounded-md px-8",
				icon: "h-7 w-7 rounded-[10px]",
				tableicon: "p-1 rounded-[10px]",
				new: " h-9 px-3 rounded-[10px] ",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
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
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		class={cn(buttonVariants({ variant, size, className }))}
		{href}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		class={cn(buttonVariants({ variant, size, className }))}
		{type}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
