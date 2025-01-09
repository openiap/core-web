<script lang="ts">
	import { HotkeyInput } from "$lib/components/ui/hotkeyinput";
	import { Search } from "lucide-svelte";

	let { searchstring = $bindable("") } = $props();
</script>

<div class="flex w-full max-w-xs flex-col gap-1.5 mb-6">
	<div class="relative">
		<label for="searchstring" class="sr-only">Search</label>
		<HotkeyInput
			id="searchstring"
			placeholder="Search string or JSON query"
			bind:value={searchstring}
			data-shortcut={"Control+f,Meta+f"}
			type="text"
			class="w-full pl-8 py-2 border border-darkborder rounded-md focus:outline-none"
		/>
		<div></div>
		<Search
			class="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
		/>
	</div>
</div>
