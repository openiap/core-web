<script lang="ts">
    import {
        Bot,
        BotMessageSquare,
        ChartSpline,
        ChevronsLeftRightEllipsis,
        CircleGauge,
        ClipboardList,
        CloudCog,
        DatabaseZap,
        Dumbbell,
        FileClock,
        Files,
        Ghost,
        House,
        IdCard,
        Mail,
        MessageSquare,
        Receipt,
        ServerCog,
        UserPlus,
        Users,
        WalletCards,
        Zap,
    } from "lucide-svelte";
    export let title: string;
</script>

{#if title == "RPA Workflows"}
    <Bot />
{:else if title == "Form workflows"}
    <ClipboardList />
{:else if title == "Workitems"}
    <Dumbbell />
{:else if title == "Agents"}
    <Ghost />
{:else if title == "Users"}
    <Users />
{:else if title == "My Memberships"}
    <IdCard />
{:else if title == "Members"}
    <Users />
{:else if title == "Invite Member"}
    <UserPlus />
{:else if title == "Clients"}
    <Users />
{:else if title == "Forms"}
    <ClipboardList />
{:else if title == "Providers"}
    <ServerCog />
{:else if title == "Resources"}
    <Zap />
{:else if title == "HD Robots"}
    <BotMessageSquare />
{:else if title == "Config"}
    <CloudCog />
{:else if title == "Mail History"}
    <Mail />
{:else if title == "Billing accounts"}
    <Receipt />
{:else if title == "Files"}
    <Files />
{:else if title == "Credentials"}
    <WalletCards />
{:else if title == "Console"}
    <ChevronsLeftRightEllipsis />
{:else if title == "Form Resources"}
    <CircleGauge />
{:else if title == "Audit logs"}
    <FileClock />
{:else if title == "Entities"}
    <DatabaseZap />
{:else if title == "Home"}
    <House />
{:else if title == "Grafana"}
    <ChartSpline />
{:else}
    <MessageSquare />
{/if}
