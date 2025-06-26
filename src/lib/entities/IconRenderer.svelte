<script lang="ts">
    import {
        ALargeSmall,
        BookOpenCheck,
        Bug,
        CalendarCheck,
        CalendarDays,
        CalendarSearch,
        Clapperboard,
        Clock4,
        Contact,
        CornerDownRight,
        Drama,
        Eye,
        FileBadge,
        Fingerprint,
        Flag,
        Gauge,
        Ghost,
        Glasses,
        Globe,
        HardDrive,
        IdCard,
        Image,
        Languages,
        Laptop,
        LayoutList,
        Mail,
        RefreshCcw,
        Ruler,
        SearchCode,
        Send,
        Server,
        SlidersVertical,
        SquareEqual,
        SquareStack,
        Tag,
        Timer,
        TrendingUp,
        User,
        UserRoundX,
        UsersRound,
        Workflow,
    } from "lucide-svelte";
    export let title: string;
    const iconClass = "h-4 w-4 me-1.5 text-bw600 dark:text-bw500";
</script>

{#if title == "Action"}
    <Clapperboard class={iconClass} />
{:else if title == "name" || title == "repo"}
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
{:else if title == "nextrun"}
    <CalendarDays class={iconClass} />
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
{:else if title == "language"}
    <Languages class={iconClass} />
{:else if title == "size"}
    <HardDrive class={iconClass} />
{:else if title == "timestamp"}
    <Clock4 class={iconClass} />
{:else if title == "to"}
    <Send class={iconClass} />
{:else if title == "read"}
    <Glasses class={iconClass} />
{:else if title == "readcount"}
    <BookOpenCheck class={iconClass} />
{:else if title == "nodered_id"}
    <Workflow class={iconClass} />
{:else if title == "projectandname"}
    <ALargeSmall class={iconClass} />
{:else if title == "docsExamined"}
    <SearchCode class={iconClass} />
{:else if title == "nreturned"}
    <CornerDownRight class={iconClass} />
{:else if title == "ts"}
    <Clock4 class={iconClass} />
{:else if title == "ns" || title == "op" || title == "planSummary" || title == "millis"}
    <SquareEqual class={iconClass} />
    <!-- {:else} -->
    <!-- <MessageSquare class={iconClass} /> -->
{/if}
