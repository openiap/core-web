<script lang="ts">
    import git from "isomorphic-git";
    import FS from "@isomorphic-git/lightning-fs";
    import http from "isomorphic-git/http/web";
    import { goto, invalidateAll } from "$app/navigation";
    import { base } from "$app/paths";
    import { File, Folder, SquarePen, Trash2 } from "lucide-svelte";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
    import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
    import { toast } from "svelte-sonner";
    import { auth } from "$lib/stores/auth.svelte.js";
    const { children, data } = $props();

    let files: any[] = $state([]);
    let showDeleteFileWarning: boolean = $state(false);
    let selectedFile: any = $state(null);

    async function cloneRepo() {
        try {
            const author = {
                name: "Your Name",
                email: "you@example.com",
            };

            // const DBDeleteRequest = window.indexedDB.deleteDatabase(data.item._id);
            // DBDeleteRequest.onerror = (event) => {
            // console.error("Error deleting database.");
            // };

            // DBDeleteRequest.onsuccess = (event) => {
            //     console.log("Database deleted successfully");
            //     // @ts-ignore
            //     console.log(event.result); // should be undefined
            // };

            // Initialize the IndexedDB database
            // let db: IDBDatabase | null = null;
            // const DBOpenRequest = window.indexedDB.open(data.item._id, 4);
            // DBOpenRequest.onsuccess = (event) => {
            //     console.info("Database initialized.");

            //     // store the result of opening the database in the db variable. This is used a lot later on, for opening transactions and suchlike.
            //     db = DBOpenRequest.result;
            //     db.deleteDatabase();
            // };

            

            const url = `https://${auth.config.domain}/git/${data.item.repo}`;
            const fs = new FS(data.item._id);
            const dir = "/test-clone";

            // // Remove any stale clone and set up fresh
            // try {
            //     console.log("Removing clone at:", dir);
            //     await fs.promises.rmdir("/", { recursive: true } as any);
            //     console.log("Removed clone successfully");
            // } catch (error: any) {
            //     console.error("Failed to remove " + error.message);
            //     toast.error("Failed to remove " + error.message);
            // }

            // Check if repo already exists locally
            let dirExists = false;
            try {
                console.log("Checking if directory exists:", dir);
                const result = await fs.promises.stat(dir);
                dirExists = true;
                console.log("dirExists:", dirExists, result);
            } catch (error: any) {
                console.log("Directory does not exist:", dir, error.message);
                dirExists = false;
            }

            if (!dirExists) {
                console.log("Cloning repo");
                await git.clone({ fs, http, dir, url });
                // const result = await fs.promises.stat(dir);
                let files = await fs.promises.readdir(dir);
                let files2 = await fs.promises.readdir(dir + "/" + files[0]);
                let files3 = await fs.promises.readdir(
                    dir + "/" + files[0] + "/objects",
                );

                console.log("Clone result:", files, files2, files3);
                // await git.pull({ fs, http, dir, url, author });
                console.log("Pulled latest changes");
                await git.checkout({ fs, dir, ref: data.item.sha });
            } else {
                // Repo exists: fetch new refs without checkout to preserve local changes
                console.log("Repo exists, fetching latest changes");
                await git.fetch({ fs, http, dir, url });
            }

            const div = document.getElementById("gitstatus");
            if (div) {
                div.textContent = "ready";
            }
            // files = (await git.listFiles({ fs, dir })) as string[];
            // files = ((await git.readTree({ fs, dir, oid: data.item.sha })) as any)
            // .tree
            console.log("Reading commit for files", data.item.sha);
            const { commit } = await git.readCommit({
                fs,
                dir,
                oid: data.item.sha,
            });
            console.log("Commit OID:", commit);
            const treeOid = commit.tree;
            console.log("call listTreeRecursive, Commit tree OID:", treeOid);
            files = await listTreeRecursive({ fs, dir, oid: treeOid });
        } catch (error: any) {
            console.error("cloneRepo" + error.message);
            toast.error("cloneRepo" + error.message);
        }
    }
    cloneRepo();

    // Full recursive function to walk a tree
    async function listTreeRecursive(params: {
        fs: any;
        dir: string;
        oid: string;
        prefix?: string;
    }): Promise<any[]> {
        const { fs, dir, oid, prefix = "" } = params;
        console.log(
            "listTreeRecursive called with OID:",
            oid,
            "and prefix:",
            prefix,
        );
        const { tree } = await git.readTree({ fs, dir, oid });
        let results: any[] = [];
        for (const entry of tree) {
            const fullPath = prefix + entry.path;
            results.push({
                path: fullPath,
                mode: entry.mode,
                type: entry.type,
                oid: entry.oid,
            });
            if (entry.type === "tree") {
                console.log("Found sub-tree:", fullPath);
                const subEntries = await listTreeRecursive({
                    fs,
                    dir,
                    oid: entry.oid,
                    prefix: fullPath + "/",
                });
                results = results.concat(subEntries);
            }
        }
        return results;
    }
    async function handleDeleteFile() {
        if (!selectedFile) return;

        const fs = new FS(data.item._id);
        const dir = "/test-clone";
        const filePath = dir + "/" + selectedFile.path;

        try {
            await fs.promises.unlink(filePath);
            files.splice(selectedFile.index, 1); // Remove from local state
            showDeleteFileWarning = false;
            selectedFile = null;
            toast.success("File deleted successfully!");
            invalidateAll(); // Refresh the page to reflect changes
        } catch (err) {
            console.error("Failed to delete file:", err);
            toast.error("Failed to delete file: " + err);
        }
    }
</script>

<div id="gitstatus" class="hidden">unknown</div>

<div class="flex flex-row w-full gap-4 h-full">
    <div
        class="md:h-full flex-shrink-0 p-4 rounded-[10px] bg-bw200 dark:bg-bw850 border dark:border-bw600"
    >
        <ul
            class="space-y-2 max-h-[500px] md:max-h-full md:h-full overflow-auto md:w-[240px] xl:w-[340px]"
        >
            {#each files as file, index}
                {#if file.type === "tree"}
                    <br />
                    <div class="flex items-center gap-1">
                        <Folder class="h-4 w-4" />
                        {file.path}
                    </div>
                {:else if file.type === "blob"}
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1">
                            <File class="h-4 w-4" />
                            <button
                                onclick={async () => {
                                    goto(
                                        base +
                                            `/git/${data.item._id}/${file.oid}/${file.path}`,
                                    );
                                }}
                            >
                                {file.path}
                            </button>
                        </div>
                        <!-- delete file -->
                        <div class="flex gap-2">
                            <HotkeyButton
                                variant="danger"
                                aria-label="Delete file"
                                title="Delete file"
                                size="icon"
                                onclick={() => {
                                    selectedFile = {
                                        path: file.path,
                                        index: index,
                                    };
                                    showDeleteFileWarning = true;
                                }}><Trash2 /></HotkeyButton
                            >
                            <!-- edit file -->
                            <HotkeyButton
                                aria-label="Edit file"
                                title="Edit file"
                                size="icon"
                                onclick={async () => {
                                    goto(
                                        base +
                                            `/git/${data.item._id}/${file.oid}/${file.path}`,
                                    );
                                }}><SquarePen /></HotkeyButton
                            >
                        </div>
                    </div>
                {:else}
                    <li>
                        {file.path} ({file.type})
                    </li>
                {/if}
            {/each}
        </ul>
    </div>

    <div
        class="h-full w-full overflow-auto p-4 bg-bw200 dark:bg-bw850 border dark:border-bw600 rounded-[10px] md:h-full md:overflow-auto"
    >
        {@render children()}
    </div>
</div>

<Warningdialogue
    bind:showWarning={showDeleteFileWarning}
    type="delete"
    onaccept={handleDeleteFile}
></Warningdialogue>
