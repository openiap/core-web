<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { useSidebar } from "$lib/components/ui/sidebar/index.js";
    import { auth } from "$lib/stores/auth.svelte";
    import {
        Building,
        Check,
        ChevronDown,
        CircleCheck,
        DollarSignIcon,
        Pencil,
        Rows3,
        Ticket,
        X,
    } from "lucide-svelte";
    import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
    import Plus from "lucide-svelte/icons/plus";
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
</script>

{#if auth.config.workspace_enabled == true}
    <Sidebar.Menu>
        <Sidebar.MenuItem>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                        <Sidebar.MenuButton
                            {...props}
                            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-[1px] border-bw500 rounded-[10px] px-4 py-6 bg-bw50 dark:bg-bw800 "
                        >
                            {#if activeWorkspacename() != ""}
                                <Building />
                                <div
                                    class="grid flex-1 text-left leading-tight justify-between"
                                >
                                    <span class="truncate font-semibold">
                                        {activeWorkspacename()}
                                    </span>
                                    <span class="truncate text-xs text-bw400"
                                        >{activeWorkspace()?._productname}</span
                                    >
                                </div>
                                <ChevronsUpDown class="ml-auto" />
                            {:else}
                                <div class="flex items-center">
                                    <span class="truncate font-semibold">
                                        Select workspace
                                    </span>
                                </div>
                                <ChevronDown class="ml-auto" />
                            {/if}
                        </Sidebar.MenuButton>
                    {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                    class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg shadow-light dark:shadow-dark bg-bw50 dark:bg-bw800"
                    align="start"
                    side={sidebar.isMobile ? "bottom" : "right"}
                    sideOffset={4}
                >
                    <DropdownMenu.Label class="text-muted-foreground font-bold "
                        >Workspaces</DropdownMenu.Label
                    >
                    {#each workspaces as workspace, index (workspace._id)}
                        <DropdownMenu.Item
                            onSelect={() => selectWorkspace(workspace)}
                            class={`gap-2 px-2 py-1`}
                        >
                            <div
                                class="grid flex-1 text-left leading-tight justify-between"
                            >
                                <span class="truncate font-semibold">
                                    {workspace.name}
                                </span>
                                <span class="truncate text-xs text-bw400"
                                    >{workspace._productname}</span
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
                    <DropdownMenu.Separator class="mx-1" />
                    {#if workspaces.length > 0}
                        {#if currentworkspace != ""}
                            <DropdownMenu.Item
                                onSelect={() =>
                                    selectWorkspace({ _id: "" } as any)}
                                class="gap-2 p-2"
                            >
                                <X />
                                Unselect Workspace
                            </DropdownMenu.Item>
                        {/if}
                        <DropdownMenu.Item
                            onSelect={() => goto(base + "/workspace")}
                            class="gap-2 p-2"
                        >
                            <Rows3 class="size-4" />
                            All Workspaces
                        </DropdownMenu.Item>
                    {/if}

                    {#if currentworkspace != ""}
                        <DropdownMenu.Item
                            onSelect={() =>
                                goto(base + "/workspace/" + currentworkspace)}
                            class="gap-2 p-2 text-muted-foreground font-medium"
                        >
                            <Pencil class="size-4" />
                            Edit {activeWorkspacename()}
                        </DropdownMenu.Item>
                        {#if hasBilling()}
                            <DropdownMenu.Item
                                onSelect={() =>
                                    goto(
                                        base +
                                            "/workspace/" +
                                            currentworkspace +
                                            "/billing",
                                    )}
                                class="gap-2 p-2 text-muted-foreground font-medium"
                            >
                                <DollarSignIcon class="size-4" />
                                Billing for {activeWorkspacename()}
                            </DropdownMenu.Item>
                        {/if}
                    {/if}
                    <DropdownMenu.Separator class="mx-1" />

                    <DropdownMenu.Item
                        class="gap-2 p-2 cursor-pointer"
                        onclick={() => goto(base + "/workspace/new")}
                    >
                        <div
                            class="bg-background flex size-6 items-center justify-center rounded-md border"
                        >
                            <Plus class="size-4" />
                        </div>
                        <div class=" font-medium">Create Workspace</div>
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </Sidebar.MenuItem>
    </Sidebar.Menu>
{:else}
    OpenCore <small>{auth.config.version}</small>
{/if}
