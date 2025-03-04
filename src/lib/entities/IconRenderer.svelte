<script lang="ts">
    import {
        CalendarCheck,
        CalendarDays,
        Clapperboard,
        Contact,
        Eye,
        Gauge,
        IdCard,
        Image,
        Laptop,
        Mail,
        Tag,
    } from "lucide-svelte";
    export let title: string;
    const iconClass = "h-4 w-4 me-1.5 text-bw500";
</script>

{#if title == "Action"}
    <Clapperboard class={iconClass} />
{:else if title == "name"}
    <IdCard class={iconClass} />
{:else if title == "_created"}
    <CalendarDays class={iconClass} />
{:else if title == "_modified"}
    <CalendarDays class={iconClass} />
{:else if title == "_createdby"}
    <Contact class={iconClass} />
{:else if title == "_type" || title == "stripeprice" || title == "_productname"}
    <Tag class={iconClass} />
{:else if title == "email"}
    <Mail class={iconClass} />
{:else if title == "lastseen"}
    <Eye class={iconClass} />
{:else if title == "metadata._created"}
    <CalendarCheck class={iconClass} />
{:else if title == "image"}
    <Image class={iconClass} />
{:else if title == "os"}
    <Laptop class={iconClass} />
    <!-- {:else if title == "stripeprice"}
    <Tag class={iconClass} /> -->
{:else if title == "status"}
    <Gauge class={iconClass} />
{:else if title == "image"}
    <Image class={iconClass} />
{:else}
    <!-- <MessageSquare class={iconClass} /> -->
{/if}
