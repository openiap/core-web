<script lang="ts">
    import {
        Clapperboard,
        MessageSquare,
        CalendarDays,
        Contact,
        Tag,
        Mail,
        Eye,
        CalendarCheck,
        Image,
        Laptop,
        Gauge,
    } from "lucide-svelte";
    export let title: string;
</script>

{#if title == "Action"}
    <Clapperboard class="h-4 w-4 me-1.5" />
{:else if title == "name"}
    <Tag class="h-4 w-4 me-1.5" />
{:else if title == "_created"}
    <CalendarDays class="h-4 w-4 me-1.5" />
{:else if title == "_modified"}
    <CalendarDays class="h-4 w-4 me-1.5" />
{:else if title == "_createdby"}
    <Contact class="h-4 w-4 me-1.5" />
{:else if title == "_type" || title == "stripeprice" || title == "_productname"}
    <Tag class="h-4 w-4 me-1.5" />
{:else if title == "email"}
    <Mail class="h-4 w-4 me-1.5" />
{:else if title == "lastseen"}
    <Eye class="h-4 w-4 me-1.5" />
{:else if title == "metadata._created"}
    <CalendarCheck class="h-4 w-4 me-1.5" />
{:else if title == "image"}
    <Image class="h-4 w-4 me-1.5" />
{:else if title == "os"}
    <Laptop class="h-4 w-4 me-1.5" />
    <!-- {:else if title == "stripeprice"}
    <Tag class="h-4 w-4 me-1.5" /> -->
{:else if title == "status"}
    <Gauge class="h-4 w-4 me-1.5" />
{:else if title == "image"}
    <Image class="h-4 w-4 me-1.5" />
{:else}
    <!-- <MessageSquare class="h-4 w-4 me-1.5" /> -->
{/if}
