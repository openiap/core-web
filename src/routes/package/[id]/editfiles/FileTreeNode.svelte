<!-- @ts-nocheck -->
<script lang="ts" context="module">
    // Represents a file or folder node in the tree
    export type TreeNode = {
        name: string;
        path: string;
        fullName?: string;
        children?: TreeNode[];
        level: number;
    };
</script>

<script lang="ts">
    // @ts-nocheck
    export let nodes: TreeNode[];
    export let onDelete: (path: string) => void;
    export let onEdit: (path: string) => void;
    export let onRename: (oldPath: string, newName: string) => void;
    // the path of the file currently being edited, for highlighting
    export let currentPath: string | null = null;

    // Reference currentPath in script so Svelte recognizes usage
    $: _usedCurrentPath = currentPath;

    import {
        Check,
        Edit2,
        File,
        FolderClosed,
        FolderOpen,
        Minus,
        Plus,
        SquarePen,
        Trash2,
        X,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import FileTreeNode from "./FileTreeNode.svelte";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
    import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
    import { CustomInput } from "$lib/custominput";

    let renamingPath: string | null = null;
    let renameValue = "";
    // tracks open/collapsed folder paths
    let openPaths: Set<string> = new Set();
    // on mount, open all folders by default
    onMount(() => {
        const collectPaths = (arr: TreeNode[]): string[] =>
            arr.flatMap((n) =>
                n.children ? [n.path, ...collectPaths(n.children)] : [],
            );
        openPaths = new Set(collectPaths(nodes));
    });
    function toggleFolder(path: string) {
        const newSet = new Set(openPaths);
        if (newSet.has(path)) newSet.delete(path);
        else newSet.add(path);
        openPaths = newSet;
    }
</script>

{#each nodes as node (node.path)}
    <div
        class={`flex items-center justify-between w-full text-sm ${node.path === currentPath && "p-1.5 bg-bw100 dark:bg-bw600 rounded"}`}
        style="padding-left: {node.level * 1}rem"
    >
        {#if node.children}
            <HotkeyButton
                variant="ghostfull"
                class="text-center cursor-pointer"
                onclick={() => toggleFolder(node.path)}
                title="Toggle folder"
                aria-label="Toggle folder"
            >
                {#if openPaths.has(node.path)}
                    <FolderOpen class="mr-2 h-5 w-5" />
                {:else}
                    <FolderClosed class="mr-2 h-5 w-5" />
                {/if}
            </HotkeyButton>
        {:else if node.level != 0}
            - <File class="mr-1 h-5 w-5" />
        {:else}
            <File class="mr-1 h-5 w-5" />
        {/if}

        {#if renamingPath === node.path}
            <CustomInput
                width="w-full"
                class="mr-2"
                bind:value={renameValue}
            />
            <div class="flex items-center gap-2">
                <HotkeyButton
                    variant="success"
                    data-shortcut="enter"
                    aria-label="Rename file"
                    title="Rename file"
                    size="icon"
                    onclick={() => {
                        onRename(node.path, renameValue);
                        renamingPath = null;
                    }}><Check /></HotkeyButton
                >
                <HotkeyButton
                    variant="danger"
                    data-shortcut="esc"
                    aria-label="Cancel"
                    title="Cancel"
                    size="icon"
                    onclick={() => {
                        renamingPath = null;
                    }}><X /></HotkeyButton
                >
            </div>
        {:else}
            <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-2">
                    {#if !node.children}
                        <HotkeyButton
                            variant="ghostfull"
                            aria-label="Edit file"
                            title="Edit file"
                            class="p-0"
                            onclick={() => onEdit(node.path)}
                            >{node.name}</HotkeyButton
                        >
                        <!-- <span class="flex-1 whitespace-nowrap"
                        onclick={() => onEdit(node.path)}
                        title="Edit file"
                            >{node.name}</span
                        > -->
                    {:else}
                        <Hotkeybutton
                            variant="ghostfull"
                            aria-label="Toggle folder"
                            title="Toggle folder"
                            class="p-0"
                            onclick={() => toggleFolder(node.path)}
                        >
                            <span class="flex-1 whitespace-nowrap">
                                {node.fullName || node.name}
                            </span>
                            {#if openPaths.has(node.path)}
                                <Minus class="h-5 w-5" />
                            {:else}
                                <Plus class="h-5 w-5" />
                            {/if}
                        </Hotkeybutton>
                    {/if}
                </div>
                {#if !node.children}
                    <div class="flex items-center gap-2">
                        <HotkeyButton
                            aria-label="Delete file"
                            title="Delete file"
                            size="icon"
                            variant="danger"
                            onclick={() => onDelete(node.path)}
                            ><Trash2 /></HotkeyButton
                        >
                        <!-- <HotkeyButton
                            aria-label="Edit file"
                            title="Edit file"
                            size="icon"
                            onclick={() => onEdit(node.path)}
                            ><SquarePen /></HotkeyButton
                        > -->
                        <HotkeyButton
                            aria-label="Rename file"
                            title="Rename file"
                            size="icon"
                            onclick={() => {
                                renamingPath = node.path;
                                renameValue = node.name;
                            }}><Edit2 /></HotkeyButton
                        >
                    </div>
                {/if}
            </div>
        {/if}
    </div>
    {#if node.children && openPaths.has(node.path)}
        <FileTreeNode
            nodes={node.children}
            {onDelete}
            {onEdit}
            {onRename}
            {currentPath}
        />
    {/if}
{/each}
