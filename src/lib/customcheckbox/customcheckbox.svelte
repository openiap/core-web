<script lang="ts">
	import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
	let {
		checked = $bindable(false),
		type = "text",
		loading = false,
		...props
	} = $props();
</script>

<div class="flex flex-col gap-1.5">
	<Checkbox disabled={loading} {...props} bind:checked={checked} />
</div>
