<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { useSidebar } from "$lib/components/ui/sidebar/index.js";
    import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
    import Plus from "lucide-svelte/icons/plus";
    import type { Workspace } from "../../routes/workspace/schema";

    let { workspaces, currentworkspace }: { workspaces: Workspace[], currentworkspace: string } =
        $props();
    const sidebar = useSidebar();

    let activeWorkspace = $state(workspaces.find(x => x._id == currentworkspace));
</script>

<Sidebar.Menu>
    <Sidebar.MenuItem>
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                {#snippet child({ props })}
                    <Sidebar.MenuButton
                        {...props}
                        size="lg"
                        class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                        <div
                            class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                        >
                        </div>
                        <div
                            class="grid flex-1 text-left text-sm leading-tight"
                        >
                            <span class="truncate font-semibold">
                                {activeWorkspace?.name}
                            </span>
                            <span class="truncate text-xs"
                                >{activeWorkspace?.price}</span
                            >
                        </div>
                        <ChevronsUpDown class="ml-auto" />
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
                        onSelect={() => (activeWorkspace = workspace)}
                        class="gap-2 p-2"
                    >
                        <div
                            class="flex size-6 items-center justify-center rounded-sm border"
                        >
                        </div>
                        {workspace.name}
                        <DropdownMenu.Shortcut
                            >⌘{index + 1}</DropdownMenu.Shortcut
                        >
                    </DropdownMenu.Item>
                {/each}
                <DropdownMenu.Separator />
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
                        Add Workspace
                    </div>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </Sidebar.MenuItem>
</Sidebar.Menu>
