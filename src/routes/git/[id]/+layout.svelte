<script lang="ts">
    import { goto, invalidateAll } from "$app/navigation";
    import { base } from "$app/paths";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
    import Hotkeybutton from "$lib/components/ui/hotkeybutton/hotkeybutton.svelte";
    import Customselect from "$lib/customselect/customselect.svelte";
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
        Trash2,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";

    const { children, data } = $props();

    let files: any[] = $state([]);
    let branches: any[] = $state([]);
    let selectedSha: string = $state("");
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
            toast.error("No access token found");
            return;
        }
        if (data.item.repo == null || data.item.repo === "") {
            toast.error("Empty repository ");
            // redirect to new page showing cloning instructions
            return;
        }

        try {
            const author = {
                name: "Your Name",
                email: "you@example.com",
            };
            const headers = { Authorization: "Bearer " + auth.access_token };
            const corsProxy = base + "/api/git-proxy";

            const url = `https://${auth.config.domain}/git/${data.item.repo}`;
            const fs = new FS(data.item.repo.split("/").join("_"));
            const dir = "/test-clone";

            let dirExists = false;
            try {
                const result = await fs.promises.stat(dir);
                dirExists = true;
            } catch (error: any) {
                dirExists = false;
            }

            if (!dirExists) {
                await git.clone({
                    fs,
                    http,
                    dir,
                    url,
                    headers,
                    corsProxy,
                    singleBranch: false,
                });

                await git.checkout({ fs, dir, ref: "HEAD" });
            } else {
                await git.fetch({ fs, http, dir, url, headers, corsProxy });
            }

            const headSha = await git.resolveRef({ fs, dir, ref: "HEAD" });
            const branches1 = await git.listBranches({ fs, dir });
            for (const b of branches1) {
                const branchSha = await git.resolveRef({
                    fs,
                    dir,
                    ref: `refs/heads/${b}`,
                });
                if (branchSha === headSha) {
                    selectedSha = b;  

                    break;
                }
            }

            branches = await git.listBranches({ fs, dir, remote: "origin" });
            const result = await Promise.all(
                branches.map(async (name) => {
                    const sha = await git.resolveRef({
                        fs,
                        dir,
                        ref: `refs/remotes/origin/${name}`,
                    });
                    return { name, sha };
                }),
            );
            branches = result.filter((b) => {
                return b.name != "HEAD";
            });

            selectedSha = await git.resolveRef({ fs, dir, ref: "HEAD" });

            if (selectedSha != data.sha) {
                const matrix = await git.statusMatrix({ fs, dir });
                const hasPendingChanges = matrix.some(
                    ([filepath, head, workdir, stage]) => {
                        // If any file differs in HEAD vs workdir vs index
                        return head !== workdir || head !== stage;
                    },
                );

                if (hasPendingChanges == false) {
                    selectedSha = data.sha as any; 
                    await git.checkout({
                        fs,
                        dir,
                        ref: data.sha,
                        remote: "origin",
                        force: true,
                    });
                } else {
                    toast.error(
                        "You have pending changes in your local repository. Please commit or stash them before switching branches.",
                    );
                }
            }


            const div = document.getElementById("gitstatus");
            if (div) {
                div.textContent = "ready";
            }
            const rawFiles = await listMatrixRecursive({
                fs,
                dir,
            });
            files = rawFiles.map((f) => {
                const segments = f.path.split("/");
                return {
                    ...f,
                    depth: segments.length - 1,
                    name: segments[segments.length - 1],
                };
            });
        } catch (error: any) {
            toast.error("cloneRepo " + error.message);
        }
    }
    cloneRepo();

    async function listMatrixRecursive(params: {
        fs: any;
        dir: string;
        prefix?: string;
    }): Promise<any[]> {
        const { fs, dir, prefix = "" } = params;
        const matrix = await git.statusMatrix({
            fs,
            dir,
            filter: (filepath) => filepath.startsWith(prefix),
        });
        const results: any[] = [];
        for (const [filepath, head, workdir, stage] of matrix) {
            let mode: number | null = null;
            // Check if file exists in workdir and get mode (if supported)
            if (workdir === 1) {
                try {
                    const stat = await fs.promises.stat(`${dir}/${filepath}`);
                    mode = stat.mode;
                } catch {
                    mode = null;
                }
                results.push({
                    path: filepath,
                    mode,
                    type: "blob",
                    oid: null,
                });
            } else if (workdir === 0 && head === 1) {
                // File deleted in workdir, still in HEAD
                results.push({
                    path: filepath,
                    mode: null,
                    type: "deleted",
                    oid: null,
                });
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
            toast.error(`File not found: ${selectedFile.path}`);
            showDeleteFileWarning = false;
            selectedFile = null;
            return;
        }

        try {
            await fs.promises.unlink(filePath);
            files.splice(selectedFile.index, 1); // Remove from local state
            files = [...files]; // Trigger reactivity
            toast.success(`File deleted successfully: ${selectedFile.path}`);
            showDeleteFileWarning = false;
            selectedFile = null; // safe: db callbacks use fileKey
            toast.success("File deleted successfully!");
            invalidateAll(); // Refresh the page to reflect changes
        } catch (err) {
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
                    indexedDB
                        .databases()
                        .then((r) => {
                            for (const db of r) {
                                let dbname = db.name as any;

                                const DBDeleteRequest =
                                    window.indexedDB.deleteDatabase(dbname);
                                DBDeleteRequest.onerror = (event) => {
                                    
                                };
                                DBDeleteRequest.onsuccess = (event) => {
                                  
                                };
                            }
                        })
                        .catch((error) => {
                            toast.error("Error cleaning DBS: " + error.message);
                        });
                }}
            >
                Clean DBS
            </Hotkeybutton>
            <Customselect
                selectitems={branches}
                value={selectedSha}
                type="single"
                width="w-full"
                class="mb-2"
                triggerContent={() => {
                    return branches.length > 0
                        ? branches.find((b) => b.sha === selectedSha)?.name ||
                              "Select Branch"
                        : "No branches available";
                }}
                onValueChangeFunction={async (value) => {
                    const _selectedSha = selectedSha;
                    selectedSha = "";

                    const fs = new FS(data.item.repo.split("/").join("_"));
                    const dir = "/test-clone";
                    const matrix = await git.statusMatrix({ fs, dir });
                    const hasPendingChanges = matrix.some(
                        ([filepath, head, workdir, stage]) => {
                            // If any file differs in HEAD vs workdir vs index
                            return head !== workdir || head !== stage;
                        },
                    );

                    if (hasPendingChanges == false) {
                        const fs = new FS(data.item.repo.split("/").join("_"));
                        const dir = "/test-clone";
                        git.checkout({
                            fs,
                            dir,
                            ref: value,
                            remote: "origin",
                            force: true,
                        })
                            .then(() => {
                                // Refresh files after checkout
                                return listMatrixRecursive({ fs, dir });
                            })
                            .then((rawFiles) => {
                                files = rawFiles.map((f) => {
                                    const segments = f.path.split("/");
                                    return {
                                        ...f,
                                        depth: segments.length - 1,
                                        name: segments[segments.length - 1],
                                    };
                                });
                            })
                            .catch((error) => {
                                toast.error(
                                    "Checkout failed: " + error.message,
                                );
                            });
                        selectedSha = value;
                        goto(base + `/git/${data.item._id}/${value}`);
                    } else {
                        selectedSha = _selectedSha;
                        toast.error(
                            "You have pending changes in your local repository. Please commit or stash them before switching branches.",
                        );
                    }
                }}
            ></Customselect>
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
                                            `/git/${data.item._id}/${data.sha}/${file.path}`,
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
