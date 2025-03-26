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
    import { BadgeCheck, Crown, LogOut, Trash2 } from "lucide-svelte";

    const sidebar = useSidebar();
    let avatar = $state("");
    async function logout() {
        await auth.logout();
    }
    if (auth.profile != null) {
        // svelte-ignore state_referenced_locally
        if(avatar ==  ""){
            const name = auth.profile?.name;
            const names = name?.split(" ");
            if (names != null && names?.length > 1) {
                avatar = (names[0][0] + names[1][0]).toUpperCase();
            } else {
                avatar = name?.substring(0, 2).toUpperCase() || "U";
            }
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
                        {avatar}
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
                                >{avatar}</Avatar.Fallback
                            >
                        </Avatar.Root>
                        <div
                            class="grid flex-1 text-left text-sm leading-tight"
                        >
                            <span class="truncate font-semibold"
                                >{auth.profile?.name}</span
                            >
                            <span class="truncate text-xs">{auth.profile.email}</span>
                        </div>
                    </div>
                </DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Group>
                    <DropdownMenu.Item
                    class="cursor-pointer dark:text-bw100"
                    onclick={() => {
                        goto(base + `/user/${auth.profile?.sub}`);
                    }}
                    >
                        <BadgeCheck />
                        Account Page
                    </DropdownMenu.Item>
                    <!-- <DropdownMenu.Item>
                        <CreditCard />
                        Billing
                    </DropdownMenu.Item> -->
                    <DropdownMenu.Item
                        onclick={reset}
                        class="cursor-pointer dark:text-bw100"
                        aria-label="Clear Filters and Settings"
                        title="Clear Filters and Settings"
                    >
                        <Trash2 class="text-bw500" />
                        Clear Filters and Settings
                    </DropdownMenu.Item>
                    {#if auth.config?.validlicense == false}
                        <DropdownMenu.Item
                            aria-label="Premium Features"
                            title="Premium Features"
                            onclick={() =>
                                window.open("https://openiap.io", "_blank")}
                            class="cursor-pointer dark:text-bw100"
                        >
                            <Crown class="text-bw500" />
                            Premium Features
                        </DropdownMenu.Item>
                    {/if}
                </DropdownMenu.Group>
                <DropdownMenu.Separator />
                <DropdownMenu.Item class="cursor-pointer" onclick={logout}>
                    <LogOut class="h-4 w-4  " />
                    <HotkeyButton
                        class="p-0 m-0 focus-visible:ring-offset-0 focus-visible:ring-0 dark:text-bw100"
                        aria-label="Sign Out"
                        onclick={logout}
                        variant="ghostfull"
                        data-shortcut={"ctrl+q,meta+q"}
                    >
                        Sign Out
                    </HotkeyButton>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </Sidebar.MenuItem>
</Sidebar.Menu>
