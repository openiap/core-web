<script lang="ts">
	import { HotkeyInput } from "$lib/components/ui/hotkeyinput";
	import { Search } from "lucide-svelte";

	let {
		searchstring = $bindable(""),
		class: _class = "w-full lg:max-w-[284px]",
	} = $props();
</script>

<div class={"flex flex-col gap-1.5" + " " + _class}>
	<div class="relative">
		<label for="searchstring" class="sr-only">Search</label>
		<HotkeyInput
			id="searchstring"
			placeholder="Search String or JSON Query"
			bind:value={searchstring}
			data-shortcut={"ctrl+f,meta+f"}
			type="text"
			class="shadow-light dark:shadow-dark bg-bw50 h-7 pl-8 py-2 rounded-[10px] border dark:border-bw600 dark:placeholder-bw500 dark:text-bw500 dark:bg-bw850 focus:outline-none"
		/>
		<div></div>
		<Search
			class="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-bw500"
		/>
	</div>
</div>
