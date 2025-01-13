<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { useSidebar } from "$lib/components/ui/sidebar/index.js";
    import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
    import Plus from "lucide-svelte/icons/plus";
    import DollarSign from "lucide-svelte/icons/dollar-sign";
    import type { Workspace } from "../../routes/workspace/schema";
    import { Building, ChevronDown, DollarSignIcon, Pencil } from "lucide-svelte";
    import { auth } from "$lib/stores/auth.svelte";
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
</script>
<Sidebar.Menu>
    <Sidebar.MenuItem>
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                {#snippet child({ props })}
                    <Sidebar.MenuButton
                        {...props}
                        class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-[1px] border-bw500 rounded-[10px] px-4"
                    >
                        {#if activeWorkspacename() != ""}
                            <Building />
                            <div
                                class="grid flex-1 text-left text-sm leading-tight justify-between"
                            >
                                <span class="truncate font-semibold">
                                    {activeWorkspacename()}
                                </span>
                                <span class="truncate text-xs"
                                    >{activeWorkspace()?.productname}</span
                                >
                            </div>
                            <ChevronsUpDown class="ml-auto" />
                        {:else}
                            <div class="flex text-sm items-center">
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
                class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg"
                align="start"
                side={sidebar.isMobile ? "bottom" : "right"}
                sideOffset={4}
            >
                <DropdownMenu.Label class="text-muted-foreground text-xs"
                    >Workspace</DropdownMenu.Label
                >
                {#each workspaces as workspace, index (workspace._id)}
                    <DropdownMenu.Item
                        onSelect={() => selectWorkspace(workspace)}
                        class="gap-2 p-2"
                    >

                    <div
                    class="grid flex-1 text-left text-sm leading-tight justify-between"
                >
                    <span class="truncate font-semibold">
                        {workspace.name}
                    </span>
                    <span class="truncate text-xs"
                        >{workspace.productname}</span
                    >
                </div>
                    </DropdownMenu.Item>
                {/each}
                <DropdownMenu.Separator />
                {#if workspaces.length > 0}
                    {#if currentworkspace != ""}
                    <DropdownMenu.Item
                            onSelect={() => selectWorkspace({ _id: "" } as any)}
                            class="gap-2 p-2"
                        >
                            Unselect Workspace
                        </DropdownMenu.Item>
                        {/if}
                    <DropdownMenu.Item
                        onSelect={() => goto(base + "/workspace")}
                        class="gap-2 p-2"
                    >
                        All Workspaces
                    </DropdownMenu.Item>
                {/if}
                {#if currentworkspace != ""}
                <DropdownMenu.Item
                    onSelect={() => goto(base + "/workspace/" + currentworkspace)}
                    class="gap-2 p-2 text-muted-foreground font-medium"
                >
                    <Pencil class="size-4" />
                    Edit {activeWorkspacename()}
                </DropdownMenu.Item>
                {#if auth.profile?.roles.includes("admins")}
                <DropdownMenu.Item
                    onSelect={() => goto(base + "/workspace/" + currentworkspace + "/billing")}
                    class="gap-2 p-2 text-muted-foreground font-medium"
                >
                    <DollarSignIcon class="size-4" />
                    Billing for {activeWorkspacename()}
                </DropdownMenu.Item>
                {/if}
                {/if}
                <DropdownMenu.Item
                    class="gap-2 p-2 cursor-pointer"
                    onclick={() => goto(base + "/workspace/new")}
                >
                    <div
                        class="bg-background flex size-6 items-center justify-center rounded-md border"
                    >
                        <Plus class="size-4" />
                    </div>
                    <div class="text-muted-foreground font-medium">
                        Create Workspace
                    </div>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </Sidebar.MenuItem>
</Sidebar.Menu>
