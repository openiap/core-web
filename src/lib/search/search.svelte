<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
    import { Search } from "lucide-svelte";
</script>

<Dialog.Root>
    <Dialog.Trigger>
            <Search />
    </Dialog.Trigger>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
            <Dialog.Description>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
            </Dialog.Description>
        </Dialog.Header>
    </Dialog.Content>
</Dialog.Root>
