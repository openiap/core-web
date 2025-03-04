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

<div class="flex flex-col space-y-2 lg:space-y-0 lg:flex-row items-center p-2 justify-between w-full">
    <div>
        {value.name}
    </div>

    <div class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-4 items-center lg:flex">
        {#each items as item}
            <div
                role="button"
                tabindex="0"
                class="flex items-center justify-end"
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
                    class={`dark:border dark:border-bw300 dark:text-bw100 w-4 h-4 ml-1.5 ${IsBitSet(item.value) && "dark:bg-bw500"}`}
                />
            </div>
        {/each}
    </div>
</div>
