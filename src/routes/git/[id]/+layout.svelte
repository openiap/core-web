<script lang="ts">
    import { goto, invalidateAll } from "$app/navigation";
    import { base } from "$app/paths";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
    import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
    import { auth } from "$lib/stores/auth.svelte.js";
    import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
    import FS from "@isomorphic-git/lightning-fs";
    import git from "isomorphic-git";
    import http from "isomorphic-git/http/web";
    import {
        File,
        FolderClosed,
        FolderOpen,
        Minus,
        Plus,
        Trash2
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    const { children, data } = $props();

    let files: any[] = $state([]);
    // Track collapsed folder paths
    let collapsedFolders: Set<string> = $state(new Set());
    let showDeleteFileWarning: boolean = $state(false);
    let selectedFile: any = $state(null);

    /**
     * Returns the list of files that are not hidden by collapsed folders
     */
    function visibleFiles() {
        return files.filter((f) => {
            const segments = f.path.split("/");
            let prefix = "";
            for (let i = 0; i < segments.length - 1; i++) {
                prefix = prefix ? `${prefix}/${segments[i]}` : segments[i];
                if (collapsedFolders.has(prefix)) return false;
            }
            return true;
        });
    }

    // Toggle collapse state for a folder
    function toggleFold(path: string) {
        const newSet = new Set(collapsedFolders);
        if (newSet.has(path)) newSet.delete(path);
        else newSet.add(path);
        collapsedFolders = newSet;
    }

    async function cloneRepo() {
        if (auth.access_token === "" || auth.access_token == null) {
            console.error("No access token found");
            toast.error("No access token found");
            return;
        }
        try {
            const author = {
                name: "Your Name",
                email: "you@example.com",
            };
            const headers = { 'Authorization': 'Bearer ' + auth.access_token };
            const corsProxy = base + "/api/git-proxy";
            console.info("Using CORS proxy:", corsProxy);
            // corsProxy: 'https://yourdomain.com/api/git-proxy?target=https://github.com'


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
            //     await fs.promises.rmdir("/", { recursive: true } as any);
            // } catch (error: any) {
            //     console.error("Failed to remove " + error.message);
            //     toast.error("Failed to remove " + error.message);
            // }

            // Check if repo already exists locally
            let dirExists = false;
            try {
                const result = await fs.promises.stat(dir);
                dirExists = true;
            } catch (error: any) {
                dirExists = false;
            }

            if (!dirExists) {
                console.info("Cloning repository...");
                await git.clone({ fs, http, dir, url, headers, corsProxy });
                // const result = await fs.promises.stat(dir);
                let files = await fs.promises.readdir(dir);
                let files2 = await fs.promises.readdir(dir + "/" + files[0]);
                let files3 = await fs.promises.readdir(
                    dir + "/" + files[0] + "/objects",
                );

                // await git.pull({ fs, http, dir, url, author });
                await git.checkout({ fs, dir, ref: data.item.sha });
            } else {
                console.info("Repository already exists, fetching latest changes...");
                // Repo exists: fetch new refs without checkout to preserve local changes
                await git.fetch({ fs, http, dir, url, headers, corsProxy });
            }
            console.info("Repository ready at", dir);

            const div = document.getElementById("gitstatus");
            if (div) {
                div.textContent = "ready";
            }
            // files = (await git.listFiles({ fs, dir })) as string[];
            // files = ((await git.readTree({ fs, dir, oid: data.item.sha })) as any)
            // .tree
            const { commit } = await git.readCommit({
                fs,
                dir,
                oid: data.item.sha,
            });
            const treeOid = commit.tree;
            const rawFiles = await listTreeRecursive({ fs, dir, oid: treeOid });
            // Compute depth for VSCode-like indentation (segments - 1)
            files = rawFiles.map((f) => {
                const segments = f.path.split("/");
                return {
                    ...f,
                    depth: segments.length - 1,
                    name: segments[segments.length - 1],
                };
            });
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
        // Sanitize path to remove any leading slashes
        const relPath = selectedFile.path.replace(/^\/+/, "");
        const filePath = `${dir}/${relPath}`;
        // Check if the file exists before attempting deletion

        try {
            await fs.promises.stat(filePath);
        } catch (statErr) {
            console.error("File not found:", filePath, statErr);
            toast.error(`File not found: ${selectedFile.path}`);
            showDeleteFileWarning = false;
            selectedFile = null;
            return;
        }

        try {
            await fs.promises.unlink(filePath);
            files.splice(selectedFile.index, 1); // Remove from local state
            files = [...files]; // Trigger reactivity
            const fileKey = selectedFile.path; // capture path before clearing
            // also remove from the local IndexedDB
            const dbRequest = window.indexedDB.open(data.item._id, 4);
            dbRequest.onupgradeneeded = (event) => {
                const dbInst = (event.target as IDBOpenDBRequest).result;
                if (!dbInst.objectStoreNames.contains("files")) {
                    dbInst.createObjectStore("files", { keyPath: "path" });
                }
            };
            dbRequest.onsuccess = (event) => {
                const dbInstance = (event.target as IDBOpenDBRequest).result;
                if (dbInstance.objectStoreNames.contains("files")) {
                    const tx = dbInstance.transaction("files", "readwrite");
                    tx.objectStore("files").delete(fileKey);
                } else {
                    console.warn(
                        "IndexedDB store 'files' not found, skipping deletion",
                    );
                }
            };
            dbRequest.onerror = (event) => {
                console.error("Error accessing IndexedDB:", event);
                toast.error("Error deleting file from IndexedDB");
            };
            toast.success(`File deleted successfully: ${selectedFile.path}`);
            showDeleteFileWarning = false;
            selectedFile = null; // safe: db callbacks use fileKey
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
            <Hotkeybutton
                variant="ghostfull"
                class="w-full mb-2"
                onclick={() => {
            indexedDB.databases().then(r => {
                for (const db of r) {
                    let dbname = db.name as any;

                    const DBDeleteRequest = window.indexedDB.deleteDatabase(dbname);
                    DBDeleteRequest.onerror = (event) => {
                        console.error("Error deleting database: ", event);
                    };
                    DBDeleteRequest.onsuccess = (event) => {
                        console.info("Database deleted successfully.");
                    };
                }
                    }).catch(error => {
                    console.error("Error listing databases: ", error);
                    });

                }}
            >
                Clean DBS
            </Hotkeybutton>
            {#each visibleFiles() as file, index}
                {#if file.type === "tree"}
                    <Hotkeybutton
                        variant="ghostfull"
                        class="flex items-center gap-1 cursor-pointer"
                        style="padding-left: {file.depth}rem"
                        onclick={() => toggleFold(file.path)}
                    >
                        {#if collapsedFolders.has(file.path)}
                            <FolderClosed class="h-4 w-4" />
                        {:else}
                            <FolderOpen class="h-4 w-4" />
                        {/if}
                        {file.name}
                        {#if collapsedFolders.has(file.path)}
                            <Plus class="h-4 w-4" />
                        {:else}
                            <Minus class="h-4 w-4" />
                        {/if}
                    </Hotkeybutton>
                {:else if file.type === "blob"}
                    <div
                        class="flex items-center justify-between"
                        style="padding-left: {file.depth}rem"
                    >
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
                                {file.name}
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
                                    selectedFile = { path: file.path, index };
                                    showDeleteFileWarning = true;
                                }}><Trash2 /></HotkeyButton
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
