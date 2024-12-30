<script lang="ts">
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import { Label } from "$lib/components/ui/label/index.js";

    const items = [
        { value: 2, label: "read" },
        { value: 4, label: "update" },
        { value: 8, label: "delete" },
        { value: 16, label: "invoke" },
        { value: 65535, label: "fullcontrol" },
    ];

    let { value = $bindable(null) } = $props();

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
                class="flex space-x-2"
                onclick={() => (value.rights = toogleBit(item.value))}
            >
                <Checkbox
                    checked={IsBitSet(item.value)}
                    aria-label={item.label}
                    class="ml-2 w-6 h-6 md:w-4 md:h-4"
                />
                <div class="grid gap-1.5 leading-none">
                    <Label
                        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        {item.label}
                    </Label>
                </div>
            </div>
        {/each}
    </div>
</div>
