<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { useSidebar } from "$lib/components/ui/sidebar/index.js";
    import { auth } from "$lib/stores/auth.svelte";
    import { usersettings } from "$lib/stores/usersettings.svelte";
    import { Crown, LogOut, Trash2 } from "lucide-svelte";
    import BadgeCheck from "lucide-svelte/icons/badge-check";
    import Bell from "lucide-svelte/icons/bell";
    import CreditCard from "lucide-svelte/icons/credit-card";

    let { user }: { user: { name: string; email: string; avatar: string } } =
        $props();
    const sidebar = useSidebar();
    async function logout() {
        await auth.logout();
    }
    if (!user?.avatar) {
        const name = user.name;
        const names = name?.split(" ");
        if (names != null && names?.length > 1) {
            user.avatar = (names[0][0] + names[1][0]).toUpperCase();
        } else {
            user.avatar = name?.substring(0, 2).toUpperCase() || "U";
        }
    }
    function reset() {
        usersettings.reset();
        goto(base + `/`);
    }
</script>

<Sidebar.Menu>
    <Sidebar.MenuItem>
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <Avatar.Root
                    class="rounded-[10px] h-7 w-7 border border-bw500 dark:border-transparent dark:hover:border-bw500  text-bw600"
                >
                    <div
                        class="flex items-center justify-center text-sm h-full w-full bg-bw200 hover:bg-bw300 dark:text-bw300 dark:bg-bw700 dark:hover:bg-bw700"
                    >
                        {user.avatar}
                    </div>
                    <!-- <Avatar.Fallback class="rounded-xl text-sm"
                    ></Avatar.Fallback> -->
                </Avatar.Root>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
                class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg lg:me-3 bg-bw50 dark:bg-bw800"
                side={sidebar.isMobile ? "bottom" : "bottom"}
                align="start"
                sideOffset={4}
            >
                <DropdownMenu.Label class="p-0 font-normal">
                    <div
                        class="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
                    >
                        <Avatar.Root class="h-8 w-8 rounded-lg">
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
                    <!-- <DropdownMenu.Item>
                        <BadgeCheck />
                        Account
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                        <CreditCard />
                        Billing
                    </DropdownMenu.Item> -->
                    <DropdownMenu.Item onclick={reset} class="cursor-pointer">
                        <Trash2 />
                        Clear Filters and Settings
                    </DropdownMenu.Item>
                    {#if auth.config?.validlicense == false}
                        <DropdownMenu.Item
                            onclick={() =>
                                window.open("https://openiap.io", "_blank")}
                            class="cursor-pointer"
                        >
                            <Crown />
                            Premium Features
                        </DropdownMenu.Item>
                    {/if}
                </DropdownMenu.Group>
                <DropdownMenu.Separator />
                <DropdownMenu.Item class="cursor-pointer" onclick={logout}>
                    <LogOut class="h-4 w-4  " />
                    <HotkeyButton
                        class="p-0 m-0 focus-visible:ring-offset-0 focus-visible:ring-0 "
                        aria-label="Signout"
                        onclick={logout}
                        variant="ghostfull"
                        data-shortcut={"ctrl+q,meta+q"}
                    >
                        <div>Signout</div>
                    </HotkeyButton>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </Sidebar.MenuItem>
</Sidebar.Menu>
