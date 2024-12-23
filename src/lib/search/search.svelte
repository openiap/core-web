<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { Search } from "lucide-svelte";
</script>

<Dialog.Root>
    <Dialog.Trigger aria-label="Search">
            <Search />
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
