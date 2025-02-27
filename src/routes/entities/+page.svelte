<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
</script>

<HotkeyButton onclick={() => goto(base + "/entities/entities/view")}
    >Goto collection</HotkeyButton
>
