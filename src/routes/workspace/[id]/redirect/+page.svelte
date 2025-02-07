<script>
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    const { data } = $props();

    goto(base + "/workspace/" + data.id);
</script>
