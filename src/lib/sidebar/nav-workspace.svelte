<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { useSidebar } from "$lib/components/ui/sidebar/index.js";
    import { auth } from "$lib/stores/auth.svelte";
    import {
        Check,
        ChevronDown,
        ChevronRight,
        DollarSignIcon,
        LandPlot,
        Layers2,
        SquarePlus,
        SquareX,
    } from "lucide-svelte";
    import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
    import { toast } from "svelte-sonner";
    import { capitalizeWords } from "../../helper";
    import type { Workspace } from "../../routes/workspace/schema";

    let {
        workspaces,
        currentworkspace,
        update_currentworkspace = (workspaceid: string) => {},
    }: {
        workspaces: Workspace[];
        currentworkspace: string;
        update_currentworkspace: (workspaceid: string) => void;
    } = $props();
    const sidebar = useSidebar();
    const isBrowser = typeof window !== "undefined";
    let isMobile = $state(false);

    const activeWorkspace = $derived(() => {
        return workspaces.find((x) => x._id == currentworkspace);
    });
    const activeWorkspacename = $derived(() => activeWorkspace()?.name || "");
    async function selectWorkspace(workspace: Workspace) {
        update_currentworkspace(workspace._id);
    }
    const hasBilling = $derived(() => {
        return (
            activeWorkspace()?._billingid != null &&
            activeWorkspace()?._billingid != ""
        );
    });
    function checkMobile() {
        const currentState =
            typeof navigator !== "undefined" &&
            /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (currentState) {
            isMobile = true;
        } else {
            isMobile = false;
        }
    }
    checkMobile();
    async function loadSearchResult() {
        let query = { _type: "workspace" };
        if (search != null || search != "") {
            query = {
                _type: "workspace",
                // @ts-ignore
                name: { $regex: search, $options: "i" },
            };
        }
        // else{
        //     return entities = [];
        // }
        try {
            entities = await auth.client.Query({
                collectionname: "users",
                query,
                top: 5,
                jwt: auth.access_token,
                // projection,
                // queryas:usersettings.workspaceid,
            });
            // if (!entities) {
            //     entities = [];
            // }
            $state.snapshot(entities);
        } catch (error: any) {
            toast.error("Error loading entities", {
                description: error.message,
            });
            entities = [];
        }
        // entities.unshift({
        //     _id: "",
        //     name: `(no workspace)`,
        //     value: null,
        //     _type: null,
        // } as any);
    }
    let entities: any[] = $state([]);
    let search: string = $state("");

    let triggerRef = $state<HTMLButtonElement>(null!);
</script>

{#if auth.config?.workspace_enabled == true && auth.config?.validlicense == true && auth.isAuthenticated}
    <Sidebar.Menu>
        <Sidebar.MenuItem>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                        <Sidebar.MenuButton
                            {...props}
                            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-[1px] border-bw500 rounded-[10px] px-4 py-6 bg-bw50 hover:bg-bw100 dark:bg-bw850 dark:hover:bg-bw700 "
                        >
                            {#if activeWorkspacename() != ""}
                                <LandPlot class="text-bw600 dark:text-bw500" />
                                <div
                                    class="grid flex-1 text-left leading-tight justify-between"
                                >
                                    <span
                                        class="truncate font-semibold dark:text-bw100"
                                    >
                                        {capitalizeWords(activeWorkspacename())}
                                    </span>
                                    <span class="truncate text-xs text-bw400"
                                        >{capitalizeWords(
                                            activeWorkspace()?._productname,
                                        )}</span
                                    >
                                </div>
                                <ChevronsUpDown class="ml-auto text-bw500" />
                            {:else}
                                <div class="flex items-center">
                                    <span class="truncate font-semibold">
                                        Select Workspace
                                    </span>
                                </div>
                                {#if isMobile}
                                    <ChevronDown class="ml-auto text-bw500" />
                                {:else}
                                    <ChevronRight class="ml-auto text-bw500" />
                                {/if}
                            {/if}
                        </Sidebar.MenuButton>
                    {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                    loop={false}
                    class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg shadow-light dark:shadow-dark bg-bw50 dark:bg-bw850"
                    align="start"
                    side={sidebar.isMobile ? "bottom" : "right"}
                    sideOffset={4}
                >
                    <DropdownMenu.Label
                        class="dark:text-bw100 font-semibold"
                        >Workspaces</DropdownMenu.Label
                    >
                    <!-- <Command.Root
                        shouldFilter={false}
                        class="bg-bw50 dark:bg-bw800"
                    >
                        <Command.Input
                            placeholder="Search workspace"
                            onkeyup={async (e) => {
                                // @ts-ignore
                                search = e.target.value;
                                await loadSearchResult();
                            }}
                        />
                        {#if search != null && search != ""}
                            <Command.List>
                                <Command.Empty>No entity found.</Command.Empty>
                                {#each entities as item}
                                    <Command.Item
                                        onSelect={() => {
                                            const returnObject = false;
                                            if (returnObject) {
                                                currentworkspace = item;
                                            } else {
                                                currentworkspace = item._id;
                                            }
                                            // closeAndRefocusTrigger();
                                        }}
                                        value={item._id}
                                        class="text-sm"
                                    >
                                        {item.name}
                                    </Command.Item>
                                {/each}
                            </Command.List>
                        {/if}
                    </Command.Root>
                    <Separator /> -->
                    {#if search == null || search == ""}
                        {#each workspaces as workspace}
                            <DropdownMenu.Item
                                onSelect={() => selectWorkspace(workspace)}
                                class={`rounded-[10px] p-1.5 px-2.5`}
                            >
                                <div
                                    class="grid flex-1 text-left leading-tight justify-between cursor-pointer"
                                >
                                    <span
                                        class="truncate text-bw950 dark:text-bw100"
                                    >
                                        {capitalizeWords(workspace.name)}
                                    </span>
                                    <span class="truncate text-xs text-bw400"
                                        >{capitalizeWords(
                                            workspace._productname,
                                        )}</span
                                    >
                                </div>
                                {#if workspace._id == currentworkspace}
                                    <div
                                        class="bg-darkbordergreen text-bw50 rounded-full"
                                    >
                                        <Check class="p-0.5" />
                                    </div>
                                {/if}
                            </DropdownMenu.Item>
                        {/each}
                    {/if}
                    <DropdownMenu.Separator class="mx-1" />
                    {#if workspaces.length > 0}
                        {#if currentworkspace != ""}
                            <DropdownMenu.Item
                                onSelect={() =>
                                    selectWorkspace({ _id: "" } as any)}
                                class="rounded-[10px] p-1.5 px-2.5 cursor-pointer dark:text-bw100"
                            >
                                <SquareX class="text-bw500" />
                                Unselect Workspace
                            </DropdownMenu.Item>
                        {/if}
                        <DropdownMenu.Item
                            onSelect={() => goto(base + "/workspace")}
                            class="rounded-[10px] p-1.5 px-2.5 cursor-pointer dark:text-bw100"
                        >
                            <Layers2 class="size-4 text-bw500" />
                            All Workspaces
                        </DropdownMenu.Item>
                    {/if}

                    {#if currentworkspace != ""}
                        <DropdownMenu.Item
                            onSelect={() =>
                                goto(base + "/workspace/" + currentworkspace)}
                            class="rounded-[10px] p-1.5 px-2.5 cursor-pointer text-muted-foreground  dark:text-bw100"
                        >
                            <DollarSignIcon class="size-4 text-bw500" />
                            Billing for {capitalizeWords(activeWorkspacename())}
                        </DropdownMenu.Item>
                    {/if}
                    <DropdownMenu.Separator class="mx-1" />

                    <DropdownMenu.Item
                        class="rounded-[10px] p-1.5 px-2.5 cursor-pointer dark:text-bw100"
                        onclick={() => goto(base + "/workspace/new")}
                    >
                        <!-- <div
                            class="bg-background flex size-6 items-center justify-center rounded-md border"
                        >
                            <Plus class="size-4" />
                        </div>
                        <div class=" ">Create Workspace</div> -->
                        <SquarePlus class="size-4 text-bw500" />
                        <div class=" ">New Workspace</div>
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </Sidebar.MenuItem>
    </Sidebar.Menu>
{:else}
    OpenCore <small>{auth.config?.version}</small>
{/if}

<!-- {#if auth.config?.workspace_enabled == true}
    <Popover.Root>
        <Popover.Trigger bind:ref={triggerRef} onclick={loadSearchResult}>
            {#snippet child({ props })}
                <HotkeyButton
                    {...props}
                    class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-[1px] border-bw500 rounded-[10px] px-4 py-6 bg-bw50 dark:bg-bw800 "
                >
                    {#if activeWorkspacename() != ""}
                        <Building />
                        <div
                            class="grid flex-1 text-left leading-tight justify-between"
                        >
                            <span class="truncate font-semibold">
                                {capitalizeWords(activeWorkspacename())}
                            </span>
                            <span class="truncate text-xs text-bw400"
                                >{capitalizeWords(
                                    activeWorkspace()?._productname,
                                )}</span
                            >
                        </div>
                        <ChevronsUpDown class="ml-auto" />
                    {:else}
                        <div class="flex items-center">
                            <span class="truncate font-semibold">
                                Select Workspace
                            </span>
                        </div>
                        {#if isMobile}
                            <ChevronDown class="ml-auto" />
                        {:else}
                            <ChevronRight class="ml-auto" />
                        {/if}
                    {/if}
                </HotkeyButton>
            {/snippet}
        </Popover.Trigger>
        <Popover.Content class="w-[200px] p-0">
            <Command.Root>
                <Command.Input
                    placeholder="Search workspace"
                    onkeyup={async (e) => {
                        // @ts-ignore
                        search = e.target.value;
                        await loadSearchResult();
                    }}
                />
                <Command.List>
                    <Command.Empty>No workspace found.</Command.Empty>
                    <Command.Group>
                        {#each entities as workspace, index (workspace._id)}
                            <Command.Item
                                onSelect={() => selectWorkspace(workspace)}
                                class={`gap-2 px-2 py-1`}
                            >
                                <div
                                    class="grid flex-1 text-left leading-tight justify-between"
                                >
                                    <span class="truncate font-semibold">
                                        {capitalizeWords(workspace.name)}
                                    </span>
                                    <span class="truncate text-xs text-bw400"
                                        >{capitalizeWords(
                                            workspace._productname,
                                        )}</span
                                    >
                                </div>
                                {#if workspace._id == currentworkspace}
                                    <div
                                        class="bg-darkbordergreen text-bw50 rounded-full"
                                    >
                                        <Check class="p-0.5" />
                                    </div>
                                {/if}
                            </Command.Item>
                        {/each}
                    </Command.Group>
                </Command.List>
            </Command.Root>
            <Popover.Content>
                {#if currentworkspace != ""}
                    <div
                        onSelect={() =>
                            goto(base + "/workspace/" + currentworkspace)}
                        class="gap-2 p-2 text-muted-foreground font-medium"
                    >
                        <DollarSignIcon class="size-4" />
                        Billing for {capitalizeWords(activeWorkspacename())}
                    </div>
                {/if}
                <Popover.Separator class="mx-1" />

                <div
                    class="gap-2 p-2 cursor-pointer"
                    onclick={() => goto(base + "/workspace/new")}
                >
                    <div
                        class="bg-background flex size-6 items-center justify-center rounded-md border"
                    >
                        <Plus class="size-4" />
                    </div>
                    <div class=" font-medium">Create Workspace</div>
                </div>
            </Popover.Content>
        </Popover.Content>
    </Popover.Root>
{:else}
    OpenCore <small>{auth.config?.version}</small>
{/if} -->
