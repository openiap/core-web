<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { Search } from "lucide-svelte";
</script>

<Dialog.Root>
    <Dialog.Trigger aria-label="Search" class="h-30 w-30">
        <div class="dark:bg-darkiconbg dark:text-darkicontext p-2 rounded-[10px]">
            <Search size={16} />
        </div>
    </Dialog.Trigger>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Search</Dialog.Title>
            <Dialog.Description>
                Search the whole site
            </Dialog.Description>
        </Dialog.Header>
    </Dialog.Content>
</Dialog.Root>
