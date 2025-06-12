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

    import { HotkeyButton } from "$lib/components/ui/hotkeybutton/index.js";
    import { File, Folder, PencilIcon, Trash2, FolderClosed } from "lucide-svelte";
    import FileTreeNode from "./FileTreeNode.svelte";
</script>

{#each nodes as node (node.path)}
    <div
        class="flex items-center justify-between w-full text-sm gap-1"
        style="padding-left: {node.level * 1}rem"
    >
        {#if node.children}
            <FolderClosed class="mr-2 h-4 w-4" />
        {:else}
            <File class="mr-2 h-4 w-4" />
        {/if}

        <span class="flex-1">{node.name}</span>
        {#if !node.children}
        <div class="flex items-center gap-2">
            
            <HotkeyButton size="icon" variant="danger" onclick={() => onDelete(node.path)}><Trash2 /></HotkeyButton>
            <HotkeyButton size="icon" onclick={() => onEdit(node.path)}><PencilIcon /></HotkeyButton>
        </div>
        {/if}
    </div>
    {#if node.children}
        <FileTreeNode nodes={node.children} {onDelete} {onEdit} />
    {/if}
{/each}
