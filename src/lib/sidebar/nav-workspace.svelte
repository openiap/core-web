<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { useSidebar } from "$lib/components/ui/sidebar/index.js";
    import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
    import Plus from "lucide-svelte/icons/plus";
    import type { Workspace } from "../../routes/workspace/schema";
    import { usersettings } from "$lib/stores/usersettings.svelte.js";
    import { auth } from "$lib/stores/auth.svelte";
    import { browser } from "$app/environment";

    let {
        workspaces,
    }: { workspaces: Workspace[]; } = $props();
    const sidebar = useSidebar();

    let activeWorkspace = $state(
        workspaces.find((x) => x._id == usersettings.currentworkspace),
    );
    async function loadWorkspaces() {
        workspaces = await auth.client.Query<Workspace>({ collectionname: "users", query: { _type: "workspace" }, jwt: auth.access_token, top: 5 });
    }
    $effect(() => {
        if(usersettings.currentworkspace && browser){
            loadWorkspaces();
        } else {
            loadWorkspaces();
        }
    });
    async function selectWorkspace(workspace: Workspace) {
        activeWorkspace = workspace;
        usersettings.currentworkspace = workspace._id;
        await usersettings.dopersist();
        goto(base + "/workspace/" + workspace._id);
    }
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
                        {#if workspaces.length > 1}
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
                        {:else}
                            <span class="truncate font-semibold">Create workspace</span>
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
                        Create Workspace
                    </div>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </Sidebar.MenuItem>
</Sidebar.Menu>
