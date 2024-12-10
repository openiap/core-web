<script lang="ts">
    import { SelectEntity } from "$lib/selectentity/index.js";
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

    const IsBitSet = $derived(
        (bit:number) => {
            return (value.rights & bit) === bit;
        }
    );
    function isBitSet(bit:number) {
        return (value.rights & bit) === bit;
    }
    function toogleBit(bit:number) {
        if (bit == 65535 && value.rights < 65535) return 65535;
        if (bit == 65535) return 0;
        return value.rights ^ bit;
    }
</script>
<!-- align all horizantanily   -->
 <div class="flex flex-row border-2">
    <SelectEntity bind:value={value._id} />
    {#each items as item}

    <button type="button" class="items-top flex space-x-2"
    onclick={() => value.rights = toogleBit(item.value)}>
        <Checkbox id="terms1" checked={isBitSet(item.value)} 
        />
        <div class="grid gap-1.5 leading-none">
          <Label
            for="terms1"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
          {item.label}
          </Label>
        </div>
      </button>
    {/each}
 </div>