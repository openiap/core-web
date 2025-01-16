<script lang="ts">
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import { Label } from "$lib/components/ui/label/index.js";

    const items = [
        { value: 2, label: "Read" },
        { value: 4, label: "Update" },
        { value: 8, label: "Delete" },
        { value: 16, label: "Invoke" },
        { value: 65535, label: "Full Control" },
    ];

    let { value = $bindable(null), loading = false } = $props();

    const IsBitSet = $derived((bit: number) => {
        return (value.rights & bit) === bit;
    });
    function isBitSet(bit: number) {
        return (value.rights & bit) === bit;
    }
    function toogleBit(bit: number) {
        if (bit == 65535 && value.rights < 65535) return 65535;
        if (bit == 65535) return 0;
        return value.rights ^ bit;
    }
</script>

<div class="flex flex-row items-center p-2 justify-between w-full">
    <div>
        {value.name}
    </div>

    <div class="flex">
        {#each items as item}
            <div
                role="button"
                tabindex="0"
                class="flex items-center"
                onclick={() =>
                    !loading && (value.rights = toogleBit(item.value))}
                onkeydown={(e) => {
                    if (e.key === "Enter") {
                        value.rights = toogleBit(item.value);
                    }
                }}
            >
                <div
                    class="peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {item.label}
                </div>
                <Checkbox
                    disabled={loading}
                    checked={IsBitSet(item.value)}
                    aria-label={item.label}
                    class="dark:border dark:border-bw300 dark:text-bw100 w-6 h-6 md:w-4 md:h-4 mr-5 ml-1.5"
                />
            </div>
        {/each}
    </div>
</div>
