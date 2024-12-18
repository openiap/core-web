<script lang="ts">
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import Button from "$lib/components/ui/button/button.svelte";

    let {
        showWarning = $bindable(false),
        action = null,
        type = "default",
        oncancel = (item: any) => {},
        onaccept = (item: any) => {},
        ...restProps
    } = $props();

    let title: string = $state("");
    let description: string = $state("");

    switch (type) {
        case "delete":
            title = "Are you absolutely sure?";
            description =
                "This action cannot be undone. This will permanently delete the item.";
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
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <Button
                tabindex={0}
                variant="outline"
                onclick={() => {
                    // oncancel();
                    showWarning = false;
                }}>Cancel</Button
            >
            <Button
                tabindex={1}
                variant="destructive"
                onclick={async () => {
                    await onaccept();
                    showWarning = false;
                }}>Delete</Button
            >
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
