<script lang="ts">
    import BadgeCheck from "lucide-svelte/icons/badge-check";
    import Bell from "lucide-svelte/icons/bell";
    import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
    import CreditCard from "lucide-svelte/icons/credit-card";
    import LogOut from "lucide-svelte/icons/log-out";
    import Sparkles from "lucide-svelte/icons/sparkles";

    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { useSidebar } from "$lib/components/ui/sidebar/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
    import { auth } from "$lib/stores/auth.svelte";

    let { user }: { user: { name: string; email: string; avatar: string } } =
        $props();
    const sidebar = useSidebar();
    async function logout() {
        await auth.logout();
    }
    if (!user?.avatar) {
        const name = user.name;
        const names = name.split(" ");
        if (names.length > 1) {
            user.avatar = (names[0][0] + names[1][0]).toUpperCase();
        } else {
            user.avatar = name.substring(0, 2).toUpperCase();
        }
    }
</script>

<Sidebar.Menu>
    <Sidebar.MenuItem>
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                {#snippet child({ props })}
                    <Sidebar.MenuButton
                        {...props}
                        size="lg"
                        class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground m-2"
                    >
                        <Avatar.Root class="rounded-lg h-full w-full">
                            <!-- <Avatar.Image src={user.avatar} alt={user.name} /> -->
                            <Avatar.Fallback class="rounded-lg"
                                >{user.avatar}</Avatar.Fallback
                            >
                        </Avatar.Root>
                        <!-- <div
                            class="grid flex-1 text-left text-sm leading-tight"
                        >
                            <span class="truncate font-semibold"
                                >{user.name}</span
                            >
                            <span class="truncate text-xs">{user.email}</span>
                        </div> -->
                        <!-- <ChevronsUpDown class="ml-auto size-4" /> -->
                    </Sidebar.MenuButton>
                {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
                class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg"
                side={sidebar.isMobile ? "bottom" : "bottom"}
                align="start"
                sideOffset={4}
            >
                <DropdownMenu.Label class="p-0 font-normal">
                    <div
                        class="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
                    >
                        <Avatar.Root class="h-8 w-8 rounded-lg">
                            <!-- <Avatar.Image src={user.avatar} alt={user.name} /> -->
                            <Avatar.Fallback class="rounded-lg"
                                >{user.avatar}</Avatar.Fallback
                            >
                        </Avatar.Root>
                        <div
                            class="grid flex-1 text-left text-sm leading-tight"
                        >
                            <span class="truncate font-semibold"
                                >{user.name}</span
                            >
                            <span class="truncate text-xs">{user.email}</span>
                        </div>
                    </div>
                </DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Group>
                    <DropdownMenu.Item>
                        <BadgeCheck />
                        Account
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                        <CreditCard />
                        Billing
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                        <Bell />
                        Notifications
                    </DropdownMenu.Item>
                </DropdownMenu.Group>
                <DropdownMenu.Separator />
                <DropdownMenu.Item>
                    <HotkeyButton
                        aria-label="Signout"
                        onclick={() => logout()}
                        data-shortcut={"Control+q,Meta+q"}>Signout</HotkeyButton
                    >
                    <!-- <LogOut />
                    Log out -->
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </Sidebar.MenuItem>
</Sidebar.Menu>
