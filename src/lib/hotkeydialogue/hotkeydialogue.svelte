<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
	import Separator from "$lib/components/ui/separator/separator.svelte";
	import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-svelte";

	let open = $state(false);
</script>

<Dialog.Root bind:open>
	<HotkeyButton
		data-shortcut={"?"}
		onclick={() => (open = !open)}
		class="hidden">Keyboard shortcuts</HotkeyButton
	>
	<Dialog.Content class="w-screen">
		<Dialog.Header>
			<Dialog.Title>Keyboard shortcuts</Dialog.Title>
			<Separator />
			<Dialog.Description class="w-full">
				<div class="grid grid-cols-2 overflow-auto p-2">
					<div class="grid grid-cols-4">
						<div class="justify-self-end col-span-1">
							<span class="text-yellow-300">Ctrl</span>
							<span>+</span>
							<span class="text-yellow-300">s</span>
						</div>

						<span class="col-span-3"> : Save form </span>
					</div>
					<div class="grid grid-cols-4">
						<div class="justify-self-end col-span-1">
							<span class="text-yellow-300">g</span>
							<span>+</span>
							<span class="text-yellow-300">l</span>
						</div>

						<span class="col-span-3"> : Goto licence page </span>
					</div>
					<div class="grid grid-cols-4">
						<div class="justify-self-end col-span-1">
							<span class="text-yellow-300">g</span>
							<span>+</span>
							<span class="text-yellow-300">a</span>
						</div>

						<span class="col-span-3"> : Goto agents page </span>
					</div>
					<div class="grid grid-cols-4">
						<div class="justify-self-end col-span-1">
							<span class="text-yellow-300">g</span>
							<span>+</span>
							<span class="text-yellow-300">w</span>
						</div>

						<span class="col-span-3"> : Goto workitems page </span>
					</div>
					<div class="grid grid-cols-4">
						<div class="justify-self-end col-span-1">
							<span class="text-yellow-300">g</span>
							<span>+</span>
							<span class="text-yellow-300"></span>
						</div>

						<span class="col-span-3">
							: Goto Workitem queue page
						</span>
					</div>
					<div class="grid grid-cols-4">
						<div class="justify-self-end col-span-1">
							<span class="text-yellow-300">g</span>
							<span>+</span>
							<span class="text-yellow-300">f</span>
						</div>

						<span class="col-span-3"> : Goto grafana page </span>
					</div>
					<div class="grid grid-cols-4">
						<div class="justify-self-end col-span-1">
							<div class="text-yellow-300 flex">
								<ArrowLeft class="h-4 w-4" />
								<ArrowUp class="h-4 w-4" />
								<ArrowRight class="h-4 w-4" />
								<ArrowDown class="h-4 w-4" />
							</div>
						</div>

						<span class="col-span-3">
							: Used to navigate the entities page
						</span>
					</div>
					<div class="grid grid-cols-4">
						<div class="justify-self-end col-span-1">
							<span class="text-yellow-300">g</span>
							<span>+</span>
							<span class="text-yellow-300">t</span>
						</div>

						<span class="col-span-3"> : Provide tour for the page </span>
					</div>
					<div class="grid grid-cols-4">
						<div class="justify-self-end col-span-1">
							<span class="text-yellow-300">Ctrl</span>
							<span>+</span>
							<span class="text-yellow-300">d</span>
						</div>

						<span class="col-span-3"> : Open debug console on any page that has data </span>
					</div>
				</div>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
