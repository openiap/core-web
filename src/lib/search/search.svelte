<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
</script>

<Dialog.Root>
    <Dialog.Trigger>
        <HotkeyButton
            variant="ghost"
            class="text-muted-foreground"
            aria-label="Search"
            data-shortcut={"Control+k,Meta+k,Shift+?"}
        >
            <!-- <Search /> -->
        </HotkeyButton>
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
