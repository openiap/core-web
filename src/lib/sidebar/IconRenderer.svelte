<script lang="ts">
    import {
        BookUser,
        Bot,
        ChartSpline,
        CircleGauge,
        ClipboardList,
        Cloudy,
        DatabaseZap,
        Drama,
        FileClock,
        FolderOpen,
        Ghost,
        GitMerge,
        House,
        Layers2,
        ListTodo,
        Lock,
        Mail,
        MessageSquare,
        Receipt,
        Rocket,
        ScanFace,
        Server,
        Settings,
        ShieldBan,
        SquareCode,
        SquareTerminal,
        UserRoundPlus,
        Users,
        UsersRound,
        Zap,
    } from "lucide-svelte";
    export let title: string;
</script>

{#if title == "RPA Workflows"}
    <Bot />
{:else if title == "Form Workflows"}
    <ClipboardList />
{:else if title == "Roles"}
    <Drama />
{:else if title == "Work Items"}
    <SquareCode />
{:else if title == "All Workspaces"}
    <Layers2 />
{:else if title == "Work Item Queues"}
    <ListTodo />
{:else if title == "Agents"}
    <Ghost />
{:else if title == "Users"}
    <Users />
{:else if title == "My Memberships"}
    <BookUser />
{:else if title == "Members"}
    <UsersRound />
{:else if title == "Invite Member"}
    <UserRoundPlus />
{:else if title == "Clients"}
    <Cloudy />
{:else if title == "Forms"}
    <ClipboardList />
{:else if title == "Providers"}
    <Server />
{:else if title == "Resources"}
    <Zap />
{:else if title == "HD Robots"}
    <Rocket />
{:else if title == "Config"}
    <Settings />
{:else if title == "Mail History"}
    <Mail />
{:else if title == "Billing Accounts"}
    <Receipt />
{:else if title == "Files"}
    <FolderOpen />
{:else if title == "Credentials"}
    <ScanFace />
{:else if title == "Console"}
    <SquareTerminal />
{:else if title == "Form Resources"}
    <CircleGauge />
{:else if title == "Audit Logs"}
    <FileClock />
{:else if title == "Database"}
    <DatabaseZap />
{:else if title == "Entities"}
    <DatabaseZap />
{:else if title == "Home"}
    <House />
{:else if title == "Grafana"}
    <ChartSpline />
{:else if title == "Git Repositories"}
    <GitMerge />
{:else if title == "Entity Restrictions"}
    <ShieldBan />
{:else if title == "OAuth Clients"}
    <Lock />
{:else}
    <MessageSquare />
{/if}
