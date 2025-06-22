<script lang="ts">
    import git from "isomorphic-git";
    import FS from "@isomorphic-git/lightning-fs";
    import http from "isomorphic-git/http/web";
    import { goto, invalidateAll } from "$app/navigation";
    import { base } from "$app/paths";
    const { children, data } = $props();

    let files: any[] = $state([]);

    async function cloneRepo() {
        const author = {
            name: "Your Name",
            email: "you@example.com",
        };
        const url = `https://dev.openiap.io/git/${data.item.repo}`;
        const fs = new FS(data.item._id);
        const dir = "/test-clone";
        await git.clone({ fs, http, dir, url });
        await git.pull({
            fs,
            http,
            dir,
            url,
            author,
        });
        await git.checkout({
            fs,
            dir,
            ref: data.item.sha, // Checkout the specific commit SHA
        });

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
        files = await listTreeRecursive({ fs, dir, oid: treeOid });
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
</script>

<div id="gitstatus" class="hidden">unknown</div>

<div class="flex flex-row gap-4">
    <ul>
        {#each files as file}
            {#if file.type === "tree"}
                {file.path}
                <br />
            {:else if file.type === "blob"}
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
                <br />
                <br />
            {:else}
                <li>
                    {file.path} ({file.type})
                </li>
            {/if}
        {/each}
    </ul>

    <div>
        {@render children()}
    </div>
</div>
