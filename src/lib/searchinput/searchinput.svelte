<script lang="ts">
	import { HotkeyInput } from "$lib/components/ui/hotkeyinput";
	import { Search } from "lucide-svelte";

	let {
		searchstring = $bindable(""),
		debounc = 500,
		class: _class = "",
	} = $props();
	let _searchstring = $state(searchstring);
	let lastinput = new Date();
	let timeout: any = null;
	$effect(() => {
		_searchstring;
		searchstring;
		if (new Date().getTime() - lastinput.getTime() > debounc) {
			if (timeout != null) clearTimeout(timeout);
			searchstring = _searchstring;
			lastinput = new Date();
		} else {
			if (timeout != null) clearTimeout(timeout);
			lastinput = new Date();
			timeout = setTimeout(async () => {
				searchstring = _searchstring;
				timeout = null;
				lastinput = new Date();
			}, debounc);
		}
	});
</script>

<div
	class={"flex w-full md:max-w-[288px] flex-col gap-1.5 mb-5 " +
		_class}
>
	<div class="relative">
		<label for="searchstring" class="sr-only">Search</label>
		<HotkeyInput
			id="searchstring"
			placeholder="Search string or JSON query"
			bind:value={_searchstring}
			data-shortcut={"ctrl+f,meta+f"}
			type="text"
			class="shadow-light dark:shadow-dark bg-bw50 w-full h-7 pl-8 py-2 rounded-[10px] border dark:border-bw600 dark:placeholder-bw500 dark:text-bw500 dark:bg-bw850 focus:outline-none"
		/>
		<div></div>
		<Search
			class="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-bw500"
		/>
	</div>
</div>
