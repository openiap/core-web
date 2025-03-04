<script lang="ts" module>
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import * as Sheet from "$lib/components/ui/sheet/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { type sort } from "$lib/stores/usersettings.svelte";
	import ArrowDown from "lucide-svelte/icons/arrow-down";
	import ArrowUp from "lucide-svelte/icons/arrow-up";
	import { TableHeader, type TTableHeader } from "./data.svelte.js";
</script>

<script lang="ts">
	import { browser } from "$app/environment";
	import { page as componentpage } from "$app/stores";
	import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
	import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
	import { CustomCheckbox } from "$lib/customcheckbox/index.js";
	import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
	import { auth } from "$lib/stores/auth.svelte.js";
	import { sidemenu } from "$lib/stores/sidemenu.svelte.js";
	import { usersettings } from "$lib/stores/usersettings.svelte.js";
	import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
	import {
		Check,
		CircleX,
		MoveLeft,
		MoveRight,
		SquareMousePointer,
		Trash2,
	} from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { data } from "./data.svelte.js";
	import IconRenderer from "./IconRenderer.svelte";

	export async function reload() {
		const id = $componentpage?.params?.id;
		const page = $componentpage?.url?.pathname;
		const { entities: entitiesdata, total_count: totalcount } =
			await data.Fetch(page, id, auth.access_token);
		entities = entitiesdata;
		total_count = totalcount;
		detectColumns();
		SetHeaders();
	}
	let {
		page = "entities",
		query = {},
		entities = $bindable([]),
		searchstring = $bindable(""),
		collectionname = "entities",
		selected_items = $bindable([]),
		loading = $bindable(false),
		total_count,
		caption = "",
		delete_selected = async (ids: string[]) => {
			try {
				loading = true;
				for (let id of ids) {
					const deletecount = await auth.client.DeleteOne({
						id: id,
						collectionname,
						jwt: auth.access_token,
					});
					if (deletecount > 1) {
						throw new Error(
							"Error while deleting " +
								id +
								" deleted " +
								deletecount +
								" items",
						);
					}
				}
				selected_items = [];
				toast.success("Deleted " + ids.length + " items successfully", {
					description: "",
				});
				GetData();
				data.persist();
			} catch (error: any) {
				toast.error("Error while deleting", {
					description: error.message,
				});
			} finally {
				loading = false;
			}
		},
		single_item_click = (item: any) => {},
		multi_select = true,
		...rest
	} = $props();

	let _searchstring = $state.snapshot(data.settings.searchstring);
	let _collectionname = $state.snapshot(collectionname);
	let multi_sort = $state(false);
	let page_index = $state(data.settings.page_index);
	let tableheaders: TTableHeader[] = $state([]);
	let showWarning = $state(false);

	let actioncellclass = $state("");
	let actionheadclass = $state("");
	selected_items = data.settings.selected_items;
	let toggleSheet = $state(false);

	function detectColumns() {
		if (entities.length > 0) {
			let keys = [];
			for (let i = 0; i < entities.length; i++) {
				let entity = entities[i];
				let subkeys = Object.keys(entity);
				for (let j = 0; j < subkeys.length; j++) {
					let key = subkeys[j];
					if (keys.indexOf(key) == -1) {
						keys.push(key);
					}
				}
			}
			for (let i = 0; i < keys.length; i++) {
				let key = keys[i];
				if (tableheaders.find((x) => x.field == key) == null) {
					let header = new TableHeader();
					header.field = key;
					header.name = key;
					header.show = false;
					tableheaders.push(header);
				}
			}
		}
	}
	async function GetData() {
		loading = true;
		try {
			const id = $componentpage?.params?.id;
			const page = $componentpage?.url?.pathname;
			const { entities: entitiesdata, total_count: totalcount } =
				await data.Fetch(page, id, auth.access_token);
			entities = entitiesdata;
			total_count = totalcount;
			detectColumns();
			SetHeaders();
			return entities;
		} catch (error: any) {
			toast.error("Error while loading data", {
				description: error.message,
			});
		} finally {
			loading = false;
		}
	}
	async function GetCount() {
		const page = $componentpage?.url?.pathname;
		total_count = await data.GetCount(
			page,
			collectionname,
			query,
			auth.access_token,
		);
	}
	if (browser && total_count == 99999) {
		GetCount();
	}
	function EnsureDefaultHeaders(page: string) {
		if (tableheaders.length == 0) {
			if (
				data.settings.headers != null &&
				data.settings.headers.length > 0
			) {
				for (let i = 0; i < data.settings.headers.length; i++) {
					let org = data.settings.headers[i];
					if (org.field == null) continue;
					let header = new TableHeader();
					header.show = true;
					header.field = org.field;
					if (org.order != null) header.order = org.order;
					if (org.orderindex != null)
						header.orderindex = org.orderindex;
					tableheaders.push(header);
				}
				return;
			}

			const defaultcolumnnames = data.defaultcolumnnames(page);
			for (let i = 0; i < defaultcolumnnames.length; i++) {
				let header = new TableHeader();
				header.field = defaultcolumnnames[i];
				if (header.field == "_id") {
					header.show = false;
					header.order = ""; // asc / desc
					header.orderindex = 100;
				}
				if (i == 0) {
					header.headclass = "w-[100px]";
					header.cellclass = "truncate overflow-ellipsis font-medium";
				}
				if (i == defaultcolumnnames.length - 1) {
					header.headclass = "text-right";
					header.cellclass = "truncate overflow-ellipsis text-right";
				}
				tableheaders.push(header);
			}
		}
	}
	function SetHeaders() {
		const page = $componentpage?.url?.pathname;
		EnsureDefaultHeaders(page);
		let foundfirst = false;
		let lastindex = -1;
		for (let i = 0; i < tableheaders.length; i++) {
			let header = tableheaders[i];
			if (foundfirst == false && header.show == true) {
				if (rest["action"] == null) lastindex = i;
				foundfirst = true;
				header.headclass = "";
				header.cellclass = "truncate overflow-ellipsis font-medium";
			} else if (header.show == true) {
				if (rest["action"] == null) lastindex = i;
				header.headclass = "w-[110px]";
				header.cellclass = "truncate overflow-ellipsis";
			}
		}
		if (lastindex > -1) {
			tableheaders[lastindex].headclass = "text-right w-[110px]";
			actioncellclass = "";
			actionheadclass = "";
		} else {
			actioncellclass = "text-right w-[200px]";
			actionheadclass = "text-right w-[200px]";
		}
	}
	function RenderItemData(item: any, field: string) {
		let value = item[field];
		if (field.indexOf(".")) {
			let parts = field.split(".");
			let obj = item;
			for (let i = 0; i < parts.length; i++) {
				obj = obj[parts[i]];
				if (obj == null) {
					break;
				}
			}
			value = obj;
		}
		if (value == null) {
			return "";
		}
		if (typeof value == "object") {
			if (value instanceof Date) {
				return value.toLocaleString();
			}
			return JSON.stringify(value);
		}
		return value;
	}
	let _workspaceid = $state.snapshot(usersettings.currentworkspace);
	let _updating = false;
	let lastsearchinput = new Date();
	let searchtimeout: any = null;
	let debounc = 500;
	$effect(() => {
		if (_updating) return;
		_updating = true;
		try {
			if (_searchstring != searchstring) {
				if (
					new Date().getTime() - lastsearchinput.getTime() >
					debounc
				) {
					if (searchtimeout != null) clearTimeout(searchtimeout);
					lastsearchinput = new Date();
					_searchstring = searchstring;
					data.settings.searchstring = searchstring;
					data.settings.page_index = 0;
					page_index = 0;
					data.persist();
					GetData();
				} else {
					if (searchtimeout != null) clearTimeout(searchtimeout);
					lastsearchinput = new Date();
					searchtimeout = setTimeout(async () => {
						lastsearchinput = new Date();
						_searchstring = searchstring;
						data.settings.searchstring = searchstring;
						data.settings.page_index = 0;
						page_index = 0;
						data.persist();
						GetData();
					}, debounc);
				}
			} else if (_workspaceid != usersettings.currentworkspace) {
				_workspaceid = usersettings.currentworkspace;
				GetData();
			} else if (_collectionname != collectionname) {
				_collectionname = collectionname;
				usersettings.entities_collectionname = collectionname;
				data.settings.page_index = page_index;
				const page = $componentpage?.url?.pathname;
				data.loadsettings(page);
				_searchstring = data.settings.searchstring;
				searchstring = data.settings.searchstring;
				total_count = 99999;
				selected_items = data.settings.selected_items;
				page_index = data.settings.page_index;
				GetData();
			}
			data.settings.selected_items = selected_items;
			data.settings.page_index = page_index;
			SetHeaders();
		} catch (error: any) {
			toast.error("Error while updating", {
				description: error.message,
			});
		} finally {
			_updating = false;
		}
	});

	SetHeaders();
	detectColumns();

	/**
	 * Ordering columns
	 * ******************************************
	 */
	let startrow = "";
	function ondragstart(event: DragEvent, head: TableHeader) {
		event.dataTransfer?.setData("text", head.field);
	}
	function ontouchstart(event: TouchEvent, head: TableHeader) {
		startrow = head.field;
	}
	function ondragover(event: DragEvent) {
		event.preventDefault();
	}
	function ondrop(event: DragEvent, head: TableHeader) {
		event.preventDefault();
		const fromfield = event.dataTransfer?.getData("text");
		const fromindex = tableheaders.findIndex((h) => h.field == fromfield);
		const toindex = tableheaders.findIndex((h) => h.field == head.field);
		if (fromindex != toindex) {
			tableheaders.splice(
				toindex,
				0,
				tableheaders.splice(fromindex, 1)[0],
			);
			data.SaveHeaders(tableheaders);
		}
	}
	function ontouchend(event: TouchEvent, head: TableHeader) {
		const fromindex = tableheaders.findIndex((h) => h.field == startrow);
		const toindex = tableheaders.findIndex((h) => h.field == head.field);
		if (fromindex != toindex) {
			tableheaders.splice(
				toindex,
				0,
				tableheaders.splice(fromindex, 1)[0],
			);
			data.SaveHeaders(tableheaders);
		}
	}
	function ontouchmove(event: TouchEvent) {
		event.preventDefault();
	}
	function sortby(field: string): sort {
		var exists = tableheaders.find((x) => x.field == field);
		if (exists == null) {
			return "";
		}
		return exists.order;
	}
	function setSort(field: string, value: sort) {
		if (Array.isArray(tableheaders) == false) tableheaders = [];
		let column = tableheaders.find((x) => x.field == field);
		let index = tableheaders.findIndex((x) => x.field == field);
		if (column != null) {
			if (value == "") {
				column.orderindex = 0;
			} else {
				column.orderindex =
					tableheaders.filter((x) => x.order != "").length + 1;
			}
			tableheaders[index] = {
				...column,
				order: value,
				show: column.show,
			};
			data.SaveHeaders(tableheaders);
		}
	}

	function toggleSort(e: any, field: string) {
		e.preventDefault();
		e.stopPropagation();
		const current = sortby(field);
		if (!multi_sort) {
			for (let i = 0; i < tableheaders.length; i++) {
				const _field = tableheaders[i].field;
				if (_field != field) {
					setSort(_field, "");
				}
			}
		}
		if (current == "") {
			setSort(field, "asc");
		} else if (current == "asc") {
			setSort(field, "desc");
		} else {
			setSort(field, "");
		}
		data.SaveHeaders(tableheaders);
		GetData();
	}

	/**
	 * ******************************************
	 * Sorting data
	 */

	/**
	 * Searching data
	 * ******************************************
	 */

	/**
	 * ******************************************
	 * Searching data
	 */

	/**
	 * Multi Select
	 * ******************************************
	 */
	function ClearSelected() {
		selected_items = [];
		data.settings.selected_items = selected_items;
		data.persist();
	}
	function ToogleAll() {
		entities.map((x) => {
			if (selected_items.indexOf(x._id) > -1) {
				selected_items = selected_items.filter((y) => y != x._id);
			} else {
				selected_items = [...selected_items, x._id];
			}
		});
		data.SaveHeaders(tableheaders);
	}
	function ToggleSelect(x: any) {
		if (selected_items.indexOf(x._id) > -1) {
			selected_items = selected_items.filter((y) => y != x._id);
		} else {
			selected_items = [...selected_items, x._id];
		}
		data.SaveHeaders(tableheaders);
	}
	let is_all_selected = $derived(
		() =>
			entities.length > 0 &&
			entities
				.map((x) => x._id)
				.every((x) => selected_items.indexOf(x) > -1),
	);
	/**
	 * ******************************************
	 * Multi Select
	 */
	async function handleAccept() {
		try {
			await delete_selected($state.snapshot(selected_items));
		} catch (error: any) {
			toast.error("Error while deleting", {
				description: error.message,
			});
		}
	}
	function onSelectColumnsOpenChange(open: boolean) {
		data.SaveHeaders(tableheaders);
	}
</script>

<!-- <div
	class={`flex flex-col justify-between ${usersettings.currentpage.includes("entities") ? "md:h-[91%] lg:h-[94%] xl:h-[96%]" : "md:h-[91%] lg:h-full xl:min-h-max"}`}
> -->
<div class="main">
	<div class="mb-2">
		<div class="text-red-500">{data.errormessage}</div>
		<div class="overflow-hidden rounded-[10px] border border-bw500">
			<div class={`border-bw500 rounded-[10px]`}>
				<Table.Root>
					{#if entities.length === 0}
						<Table.Caption class="mb-2 text-bw300"
							>No data found in this workspace.
							{searchstring != ""
								? " Try searching for something else."
								: ""}
						</Table.Caption>
					{:else if caption != ""}
						<Table.Caption>{caption}</Table.Caption>
					{/if}
					<Table.Header>
						<Table.Row
							class={`bg-lighttableheader hover:bg-lighttableheader dark:bg-bw900 dark:hover:bg-bw900 text-nowrap ${!loading && "cursor-pointer"} `}
						>
							{#if multi_select}
								<Table.Head class="w-8 " role="cell"
									><CustomCheckbox
										class=" "
										arialabel="Select all"
										checked={is_all_selected()}
										handleClick={ToogleAll}
									/></Table.Head
								>
							{/if}
							{#each tableheaders as head, index}
								{#if head.show}
									<Table.Head
										class={head.headclass +
											" text-bw950 dark:text-bw200 font-normal "}
										role="cell"
										draggable="true"
										onclick={(e) =>
											toggleSort(e, head.field)}
										ondragstart={(e) =>
											ondragstart(e, head)}
										{ondragover}
										ondrop={(e) => ondrop(e, head)}
										ontouchstart={(e) =>
											ontouchstart(e, head)}
										ontouchend={(e) => ontouchend(e, head)}
										{ontouchmove}
									>
										<div
											class="flex items-center justify-center w-max"
										>
											<IconRenderer title={head.field} />
											{data.RenderHeaderName(head)}
										</div>
										{#if sortby(head.field) == "asc"}
											<ArrowUp class="ml-2 h-4 w-4" />
										{:else if sortby(head.field) == "desc"}
											<ArrowDown class="ml-2 h-4 w-4" />
										{/if}
									</Table.Head>
								{/if}
							{/each}
							{#if rest["action"]}
								<Table.Head
									class="text-bw950 dark:text-bw200 font-normal {actionheadclass}"
								>
									<div
										class={`flex items-center justify-end `}
									>
										<IconRenderer title="Action" />
										Actions
									</div>
								</Table.Head>
							{/if}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each entities as item}
							<Table.Row
								class="border-b border-bw500 text-bw950 dark:text-bw200 text-nowrap"
								ondblclick={() => {
									if (!loading) {
										single_item_click(item);
									}
								}}
							>
								{#if multi_select}
									<Table.Cell
										class="w-8"
										onclick={() => ToggleSelect(item)}
										><CustomCheckbox
											class=" "
											arialabel="Select Item"
											checked={selected_items.indexOf(
												item._id,
											) > -1}
										/></Table.Cell
									>
								{/if}
								{#each tableheaders as head}
									{#if head.show}
										{#if head.field == "name"}
											<Table.Cell
												class={head.cellclass +
													` ${!loading && "cursor-pointer"} `}
												onclick={() => {
													if (
														multi_select &&
														selected_items.length >
															0
													) {
														ToggleSelect(item);
													} else {
														if (!loading) {
															single_item_click(
																item,
															);
														}
													}
												}}
												>{RenderItemData(
													item,
													head.field,
												)}
											</Table.Cell>
										{:else if rest[head.field] != null}
											<Table.Cell class={head.cellclass}
												>{@render rest[head.field](
													item,
												)}</Table.Cell
											>
										{:else}
											<Table.Cell
												class={head.cellclass}
												onclick={() => {
													if (multi_select) {
														ToggleSelect(item);
													} else {
														if (!loading) {
															single_item_click(
																item,
															);
														}
													}
												}}
												>{RenderItemData(
													item,
													head.field,
												)}</Table.Cell
											>
										{/if}
									{/if}
								{/each}
								{#if rest["action"]}
									<Table.Cell class={actioncellclass}
										>{@render rest["action"](
											item,
										)}</Table.Cell
									>
								{/if}
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>

		<div
			class="grid grid-cols-1 gap-2 md:grid-cols-2 md:space-y-0 lg:flex mt-4 lg:space-x-5 items-center mb-2"
		>
			{#if multi_select}
				<HotkeyButton
					aria-label={`Delete ${selected_items.length} Items`}
					disabled={selected_items.length === 0}
					onclick={() => (showWarning = true)}
					data-shortcut="del"
					size="base"
					variant="danger"
				>
					<Trash2 />
					Delete {selected_items.length} Items</HotkeyButton
				>
				<Hotkeybutton
					aria-label="Clear All Selections"
					disabled={selected_items.length === 0}
					variant="base"
					size="base"
					onclick={ClearSelected}
				>
					<CircleX />
					Clear All Selections</Hotkeybutton
				>
			{/if}
			<Hotkeybutton
				aria-label="Select Columns"
				variant="base"
				size="base"
				disabled={tableheaders.length == 0}
				onclick={() => {
					toggleSheet = true;
				}}
			>
				<SquareMousePointer />
				Select Columns
			</Hotkeybutton>
		</div>
	</div>

	<div
		class="flex text-center justify-between items-center dark:text-bw300 gap-4 overflow-auto"
	>
		<HotkeyButton
			aria-label="Previous"
			title="Previous (Left Arrow Key)"
			size="base"
			variant="base"
			data-shortcut="left"
			onclick={() => {
				page_index = page_index - 1;
				data.settings.page_index = page_index;
				data.persist();
				GetData();
			}}
			disabled={page_index <= 0 || loading}
		>
			<div class="flex items-center space-x-2">
				<div>
					<MoveLeft class="text-bw500" />
				</div>
				<div>Previous</div>
			</div>
		</HotkeyButton>
		<div class="text-sm md:text-base">
			Page {page_index + 1}
			{#if entities.length == total_count}
				Showing {total_count}
			{:else}
				Showing {page_index * data.pagesize + 1}
				{#if entities.length > 1}
					to {page_index * data.pagesize + entities.length}
				{/if}
				of {total_count}
			{/if}
		</div>
		<HotkeyButton
			aria-label="Next"
			title="Previous (Right Arrow Key)"
			size="base"
			variant="base"
			data-shortcut="right"
			onclick={() => {
				page_index = page_index + 1;
				data.settings.page_index = page_index;
				data.persist();
				GetData();
			}}
			disabled={entities.length < data.pagesize ||
				page_index * data.pagesize >= total_count ||
				loading}
		>
			<div class="flex items-center space-x-2">
				<div>Next</div>
				<div>
					<MoveRight class="text-bw500" />
				</div>
			</div>
		</HotkeyButton>
	</div>
</div>

{#if tableheaders.length > 0}
	<Sheet.Root
		bind:open={toggleSheet}
		onOpenChange={onSelectColumnsOpenChange}
	>
		<Sheet.Content>
			<Sheet.Header>
				<div class="flex items-center space-x-1.5 dark:text-bw50">
					<SquareMousePointer class="h-4 w-4" />
					<div class="text-[16px] dark:text-bw50">Select columns</div>
				</div>
				<div class="dark:text-bw400 text-[14px] w-[256px]">
					Choose which columns to display in the table.
				</div>
				<!-- <Sheet.Title>
								Select columns</Sheet.Title
							>
							<Sheet.Description>
								Choose which columns to display in the table.
							</Sheet.Description> -->
			</Sheet.Header>
			<div class="grid gap-4 py-4">
				<ScrollArea class="max-h-[84vh]">
					{#each tableheaders as head}
						<div
							class="h-[36px] flex items-center rounded-[10px] border border-bw500 p-2.5 mb-1.5 mr-4"
						>
							<div class="flex-1 space-y-1">
								<p class="text-muted-foreground text-sm">
									{data.RenderHeaderName(head)}
								</p>
							</div>
							<Switch
								bind:checked={head.show}
								onclick={() => {}}
							/>
						</div>
					{/each}
				</ScrollArea>
			</div>
		</Sheet.Content>
	</Sheet.Root>
{/if}

<HotkeyButton
	data-shortcut="ctrl+a,meta+a"
	onclick={() => {
		if (!is_all_selected()) {
			entities.map((x) => {
				if (selected_items.indexOf(x._id) == -1) {
					selected_items = [...selected_items, x._id];
					data.settings.selected_items = selected_items;
					data.persist();
				}
			});
		} else {
			entities.map((x) => {
				if (selected_items.indexOf(x._id) >= -1) {
					selected_items = selected_items.filter((y) => y != x._id);
					data.settings.selected_items = selected_items;
					data.persist();
				}
			});
		}
	}}
	class="hidden"
	hidden={true}
/>

<CustomSuperDebug formData={entities} />

<Warningdialogue bind:showWarning type="deleteall" onaccept={handleAccept}
></Warningdialogue>

<style>
	.main {
		/* Grow to fill leftover vertical space */
		flex: 1;
		/* We want to arrange two sub-divs in a column, spaced apart */
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}
</style>
