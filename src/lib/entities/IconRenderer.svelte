<script lang="ts">
    import {
        Bug,
        CalendarCheck,
        CalendarDays,
        CalendarSearch,
        Clapperboard,
        Contact,
        Drama,
        Eye,
        FileBadge,
        Fingerprint,
        Flag,
        Gauge,
        Ghost,
        Globe,
        IdCard,
        Image,
        Laptop,
        LayoutList,
        Mail,
        RefreshCcw,
        Ruler,
        Server,
        SlidersVertical,
        SquareStack,
        Tag,
        Timer,
        TrendingUp,
        User,
        UserRoundX,
        UsersRound,
    } from "lucide-svelte";
    export let title: string;
    const iconClass = "h-4 w-4 me-1.5 text-bw600 dark:text-bw500";
</script>

{#if title == "Action"}
    <Clapperboard class={iconClass} />
{:else if title == "name"}
    <IdCard class={iconClass} />
{:else if title == "_created"}
    <CalendarDays class={iconClass} />
{:else if title == "_modified"}
    <SlidersVertical class={iconClass} />
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
{:else if title == "state"}
    <Gauge class={iconClass} />
{:else if title == "errortype"}
    <Bug class={iconClass} />
{:else if title == "retries"}
    <RefreshCcw class={iconClass} />
{:else if title == "priority"}
    <Flag class={iconClass} />
{:else if title == "wiq"}
    <SquareStack class={iconClass} />
{:else if title == "lastrun"}
    <CalendarSearch class={iconClass} />
{:else if title == "runtime"}
    <Timer class={iconClass} />
{:else if title == "role"}
    <Drama class={iconClass} />
{:else if title == "workspacename"}
    <IdCard class={iconClass} />
{:else if title == "id"}
    <Fingerprint class={iconClass} />
{:else if title == "clientagent"}
    <IdCard class={iconClass} />
{:else if title == "clientversion"}
    <Ghost class={iconClass} />
{:else if title == "remoteip"}
    <Globe class={iconClass} />
{:else if title == "workspacename"}
    <IdCard class={iconClass} />
{:else if title == "members"}
    <UsersRound class={iconClass} />
{:else if title == "provider"}
    <Server class={iconClass} />
{:else if title == "impostorname"}
    <UserRoundX class={iconClass} />
{:else if title == "username"}
    <User class={iconClass} />
{:else if title == "dbusage"}
    <TrendingUp class={iconClass} />
{:else if title == "filename"}
    <FileBadge class={iconClass} />
{:else if title == "metadata.name"}
    <IdCard class={iconClass} />
{:else if title == "length"}
    <Ruler class={iconClass} />
{:else if title == "collection"}
    <LayoutList class={iconClass} />
{:else if title == "dbusage"}
    <TrendingUp class={iconClass} />
{:else if title == "filename"}
    <FileBadge class={iconClass} />
{:else if title == "metadata.name"}
    <IdCard class={iconClass} />
{:else if title == "metadata._createdby"}
    <Contact class={iconClass} />
{:else}
    <!-- <MessageSquare class={iconClass} /> -->
{/if}
