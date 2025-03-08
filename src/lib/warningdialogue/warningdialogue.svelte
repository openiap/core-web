<script lang="ts">
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
    import { CustomInput } from "$lib/custominput";
    import { toast } from "svelte-sonner";

    let {
        showWarning = $bindable(false),
        action = null,
        type = "default",
        oncancel = (item: any) => {},
        onaccept = (item: any) => {},
        disabled = false,
        entityname = "",
        ...restProps
    } = $props();

    let title: string = $state("");
    let description: string = $state("");
    let buttonaname: string = $state("");
    let confirmentity: string = $state("");

    switch (type) {
        case "delete":
            title = "Are you absolutely sure?";
            description =
                "This action cannot be undone. This will permanently delete the item.";
            buttonaname = "Delete";
            break;
        case "logout":
            title = "Are you sure you want to logout?";
            description =
                "You will not be able to see your data in the platform until you log in again.";
            buttonaname = "Logout";
            break;
        case "deleteall":
            title = "Are you absolutely sure?";
            description =
                "This action is irreversible. This will permanently delete all selected items.";
            buttonaname = "Delete All";
            break;
        case "purgequeue":
            title = "Are you absolutely sure?";
            description =
                "This action is irreversible. This will permanently purge all workitems inside this queue.";
            buttonaname = "Purge All";
            break;
        case "toggle":
            title = "Are you sure?";
            description = "This is toggle the state of the item.";
            buttonaname = "Toggle";
            break;
        case "deleteentity":
            title = `Are you sure you want to delete this collection?`;
            description =
                "Plase type in the name of the collection to confirm.";
            buttonaname = "Delete";
            break;

        case "default":
            title = "Are you sure?";
            description = "This action cannot be undone.";
            break;
    }

    function handleChange() {
        if (showWarning === true) {
        }
    }
</script>

<AlertDialog.Root
    bind:open={showWarning}
    {...restProps}
    onOpenChange={handleChange}
>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>{title}</AlertDialog.Title>
            <AlertDialog.Description>
                {description}
            </AlertDialog.Description>
            {#if entityname != ""}
                <div class="py-2">
                    Collection name:
                    {entityname}
                </div>
                <CustomInput
                    bind:value={confirmentity}
                    placeholder="Confirm collection name"
                    width=""
                />
            {/if}
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <HotkeyButton
                tabindex={0}
                variant="base"
                {disabled}
                onclick={async () => {
                    showWarning = false;
                    await oncancel();
                }}>Cancel</HotkeyButton
            >
            <HotkeyButton
                tabindex={1}
                variant="danger"
                {disabled}
                onclick={async () => {
                    if (entityname != "") {
                        if (confirmentity === "") {
                            return toast.error(
                                "Please type in the name of the collection to confirm.",
                            );
                        }
                        if (confirmentity != entityname) {
                            return toast.error(
                                "Incorrect collection name. Please try again.",
                            );
                        }
                        if (confirmentity === entityname) {
                            showWarning = false;
                            await onaccept();
                            confirmentity = "";
                        }
                    } else {
                        showWarning = false;
                        await onaccept();
                    }
                }}>{buttonaname}</HotkeyButton
            >
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
