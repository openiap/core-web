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

    import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
    import {
        Check,
        Edit2,
        File,
        FolderClosed,
        SquarePen,
        Trash2,
        X,
    } from "lucide-svelte";
    import FileTreeNode from "./FileTreeNode.svelte";

    let renamingPath: string | null = null;
    let renameValue = "";
</script>

{#each nodes as node (node.path)}
    <div
        class="flex items-center justify-between w-full text-sm"
        style="padding-left: {node.level * 1}rem"
    >
        {#if node.children}
            <FolderClosed class="mr-2 h-5 w-5" />
        {:else if node.level != 0}
            - <File class="mr-2 h-5 w-5" />
        {:else}
            <File class="mr-2 h-5 w-5" />
        {/if}

        {#if renamingPath === node.path}
            <input
                class="flex-1 mr-2 border rounded px-1"
                bind:value={renameValue}
            />
            <div class="flex items-center gap-2">
                <HotkeyButton
                    size="icon"
                    onclick={() => {
                        onRename(node.path, renameValue);
                        renamingPath = null;
                    }}><Check /></HotkeyButton
                >
                <HotkeyButton
                    size="icon"
                    onclick={() => {
                        renamingPath = null;
                    }}><X /></HotkeyButton
                >
            </div>
        {:else}
            <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-2">
                    <span class="flex-1 cursor-pointer">{node.name}</span>
                    {#if !node.children}
                        <HotkeyButton
                            size="icon"
                            onclick={() => {
                                renamingPath = node.path;
                                renameValue = node.name;
                            }}><Edit2 /></HotkeyButton
                        >
                    {/if}
                </div>
                {#if !node.children}
                    <div class="flex items-center gap-2">
                        <HotkeyButton
                            size="icon"
                            variant="danger"
                            onclick={() => onDelete(node.path)}
                            ><Trash2 /></HotkeyButton
                        >
                        <HotkeyButton
                            size="icon"
                            onclick={() => onEdit(node.path)}
                            ><SquarePen /></HotkeyButton
                        >
                    </div>
                {/if}
            </div>
        {/if}
    </div>
    {#if node.children}
        <FileTreeNode nodes={node.children} {onDelete} {onEdit} {onRename} />
    {/if}
{/each}
