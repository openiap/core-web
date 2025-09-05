<script lang="ts">
    import { browser } from "$app/environment";
    import { goto, invalidateAll } from "$app/navigation";
    import { base } from "$app/paths";
    import { page } from "$app/stores";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
    import { CustomInput } from "$lib/custominput/index.js";
    import Customselect from "$lib/customselect/customselect.svelte";
    import Customsuperdebug from "$lib/customsuperdebug/customsuperdebug.svelte";
    import { auth } from "$lib/stores/auth.svelte.js";
    import { usersettings } from "$lib/stores/usersettings.svelte.js";
    import Warningdialogue from "$lib/warningdialogue/warningdialogue.svelte";
    import FS from "@isomorphic-git/lightning-fs";
    import git from "isomorphic-git";
    import http from "isomorphic-git/http/web";
    import {
        ArrowUpFromLine,
        Check,
        Copy,
        Edit2,
        File,
        FolderClosed,
        FolderOpen,
        GitCommitHorizontal,
        Minus,
        Plus,
        RefreshCcw,
        Trash,
        Trash2,
        X,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { IsNullEmpty, IsNullUndefinded } from "../../../helper.js";

    const { children, data } = $props();

    let files: any[] = $state([]);
    let branches: any[] = $state([]);
    let selectedSha: string = $state("");
    let collapsedFolders: Set<string> = $state(new Set());
    let showDeleteFileWarning: boolean = $state(false);
    let selectedFile: any = $state(null);
    let showRenameInput: boolean = $state(false);
    let renameInputText: string = $state("");
    let renameFile: any = $state(null);
    let showNewFileInput: boolean = $state(false);
    let newFileName: string = $state("");
    let openAddFileDialog: boolean = $state(false);
    let commitmessage: string = $state("");
    let showDiscardAllChangesWarning: boolean = $state(false);
    let loading = $state(false);
    let historyview = $state(false);
    let openDialog = $state(false);
    let loadingDialog = $state(false);
    let builderlog = $state();
    const textEncoder = new TextEncoder();

    const currentFilePath = $derived(() => {
        const urlParts = $page.url.pathname.split("/");
        const shaIndex = urlParts.findIndex((p) => p === data.sha);
        if (shaIndex !== -1 && shaIndex + 1 < urlParts.length) {
            return urlParts.slice(shaIndex + 1).join("/");
        }
        return "";
    });

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

    function toggleFold(path: string) {
        const newSet = new Set(collapsedFolders);
        if (newSet.has(path)) newSet.delete(path);
        else newSet.add(path);
        collapsedFolders = newSet;
    }

    async function hasPendingChanges() {
        const fs = new FS(data.item.repo.split("/").join("_"));
        const dir = "/test-clone";
        const matrix = await git.statusMatrix({ fs, dir });
        const hasPendingChanges = matrix.some(
            ([filepath, head, workdir, stage]) => {
                // If any file differs in HEAD vs workdir vs index
                return head !== workdir || head !== stage;
            },
        );
        return hasPendingChanges;
    }

    async function cloneRepo(relaodsha: any = null) {
        loading = true;
        let sha = relaodsha || data.sha;
        try {
            if (auth.access_token === "" || auth.access_token == null) {
                toast.error("No access token found");
                return;
            }
            if (data.item.repo == null || data.item.repo === "") {
                toast.error("Empty repository ");
                // redirect to new page showing cloning instructions
                return;
            }
            if (sha == "null") {
                return;
            }
            const headers = { Authorization: "Bearer " + auth.access_token };
            const corsProxy = base + "/api/git-proxy";

            const url = `https://${auth.config.domain}/git/${data.item.repo}`;
            const fs = new FS(data.item.repo.split("/").join("_"));
            const dir = "/test-clone";

            let dirExists = false;
            try {
                const pendingChanges = await hasPendingChanges();
                if (pendingChanges == false) {
                    const databasename = data.item.repo.split("/").join("_");
                    await cleanDB(databasename);
                }
                await fs.promises.stat(dir);
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
            } else {
                // this is not working sometimes correctly
                // test comment above pending changes check and push something from local then reload data in browser
                await git.fetch({
                    fs,
                    http,
                    dir,
                    url,
                    headers,
                    corsProxy,
                });
            }

            const pendingChanges = await hasPendingChanges();

            if (pendingChanges === false) {
                const dbbranch = await auth.client.FindOne<any>({
                    collectionname: "git",
                    query: { sha: sha, ref: { $ne: "HEAD" } },
                    jwt: auth.access_token,
                });

                if (dbbranch == null) {
                    historyview = true;
                    await git.checkout({
                        fs,
                        dir,
                        ref: sha,
                        force: true,
                    });
                } else {
                    await git.checkout({
                        fs,
                        dir,
                        ref: dbbranch.ref.split("/").pop(),
                    });
                }
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

            const div = document.getElementById("gitstatus");
            if (div) {
                div.textContent = "ready";
            }
            const rawFiles = await listMatrixRecursive({
                fs,
                dir,
            });
            files = buildFileList(rawFiles);
        } catch (error: any) {
            toast.error("cloneRepo " + error.message);
        } finally {
            loading = false;
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
            // Show file if it exists in workdir or is staged (including new files)
            if (workdir > 0 || stage > 0) {
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

    function buildFileList(rawFiles: any[]): any[] {
        const items = rawFiles.map((f) => {
            const segments = f.path.split("/");
            return {
                ...f,
                depth: segments.length - 1,
                name: segments[segments.length - 1],
            };
        });
        const dirPaths = new Set<string>();
        items.forEach((item) => {
            const segments = item.path.split("/");
            let prefix = "";
            for (let i = 0; i < segments.length - 1; i++) {
                prefix = prefix ? `${prefix}/${segments[i]}` : segments[i];
                dirPaths.add(prefix);
            }
        });
        const dirs = Array.from(dirPaths).map((path) => ({
            path,
            type: "tree",
            depth: path.split("/").length - 1,
            name: path.split("/").pop(),
        }));
        const all = [...dirs, ...items];
        all.sort(
            (a, b) =>
                a.path.localeCompare(b.path) || a.type.localeCompare(b.type),
        );
        return all;
    }

    async function handleDeleteFile() {
        if (!selectedFile) return;

        const fs = new FS(data.item.repo.split("/").join("_"));
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

    async function handleRenameFile() {
        if (!renameFile) return;
        if (!renameInputText.trim()) {
            toast.error("File name cannot be empty");
            return;
        }
        const fs = new FS(data.item.repo.split("/").join("_"));
        const dir = "/test-clone";
        const oldRel = renameFile.path.replace(/^\/+/, "");
        // preserve directory when renaming, allow slashes in new name
        const newRel = renameInputText.replace(/^\/+/, "");
        const oldPath = `${dir}/${oldRel}`;
        const newPath = `${dir}/${newRel}`;
        // Check if new file already exists
        try {
            await fs.promises.stat(newPath);
            toast.error("A file or folder with that name already exists");
            return;
        } catch {}
        // Ensure parent directory exists for new path
        const parentDir = newPath.substring(0, newPath.lastIndexOf("/"));
        if (parentDir && parentDir !== dir) {
            await ensureDir(fs, parentDir);
        }
        let shouldGotoNewUrl = false;
        if (typeof window !== "undefined") {
            const urlParts = window.location.pathname.split("/");
            const lastSegment = urlParts[urlParts.length - 1];
            const oldFileName = renameFile.path.split("/").pop();
            if (lastSegment === oldFileName) {
                shouldGotoNewUrl = true;
            }
        }
        try {
            await fs.promises.rename(oldPath, newPath);
            await git.remove({ fs, dir, filepath: oldRel });
            await git.add({ fs, dir, filepath: newRel });
            const rawFiles = await listMatrixRecursive({ fs, dir });
            files = buildFileList(rawFiles);
            files = [...files];
            toast.success(`File renamed to ${newRel}`);
            showRenameInput = false;
            renameFile = null;
            renameInputText = "";
            if (shouldGotoNewUrl) {
                await goto(
                    base + `/git/${data.item._id}/${data.sha}/${newRel}`,
                );
            }
            invalidateAll();
        } catch (err: any) {
            toast.error("Failed to rename file: " + err.message);
        }
    }

    async function ensureDir(fs: any, dirPath: string) {
        const parts = dirPath.split("/").filter(Boolean);
        let current = "";
        for (const part of parts) {
            current += "/" + part;
            try {
                await fs.promises.stat(current);
            } catch {
                try {
                    await fs.promises.mkdir(current);
                } catch {}
            }
        }
    }

    async function handleCreateFile() {
        if (!newFileName.trim()) {
            toast.error("File name cannot be empty");
            return;
        }
        const fs = new FS(data.item.repo.split("/").join("_"));
        const dir = "/test-clone";
        // Sanitize path to remove any leading slashes
        const relPath = newFileName.replace(/^\/+/, "");
        const filePath = `${dir}/${relPath}`;
        const parentDir = filePath.substring(0, filePath.lastIndexOf("/"));
        try {
            // Check if file already exists
            await fs.promises.stat(filePath);
            toast.error("File already exists");
            return;
        } catch {
            // File does not exist, proceed
        }
        try {
            if (parentDir && parentDir !== dir) {
                await ensureDir(fs, parentDir);
            }
            await fs.promises.writeFile(filePath, ""); // Create empty file
            await git.add({ fs, dir, filepath: relPath });
            const rawFiles = await listMatrixRecursive({ fs, dir });
            files = buildFileList(rawFiles);
            files = [...files]; // Trigger reactivity
            toast.success(`File created: ${newFileName}`);
            showNewFileInput = false;
            newFileName = "";
            invalidateAll();
        } catch (err: any) {
            toast.error("Failed to create file: " + err.message);
        }
    }

    function handleCancelRename() {
        showRenameInput = false;
        renameFile = null;
        renameInputText = "";
    }

    async function handleCommitChanges() {
        const fs = new FS(data.item.repo.split("/").join("_"));
        const dir = "/test-clone";
        // let selectedSha = await git.resolveRef({ fs, dir, ref: "HEAD" });

        if (!commitmessage.trim()) {
            toast.error("Commit message cannot be empty");
            return;
        }

        // STEP 1: Stage all modified or untracked files
        const statusMatrix = await git.statusMatrix({ fs, dir });
        // let anyStaged = false;

        for (const [filepath, head, workdir, stage] of statusMatrix) {
            if (workdir !== stage) {
                // File is changed (or untracked) => stage it
                await git.add({ fs, dir, filepath });
                // anyStaged = true;
            } else if (workdir === 0 && (head > 0 || stage > 0)) {
                // File was deleted => remove it from index
                await git.remove({ fs, dir, filepath });
                // anyStaged = true;
            }
        }

        // STEP 2: Show file statuses for debugging
        // const debugStatus = await Promise.all(
        //     statusMatrix.map(async ([filepath]) => {
        //         const status = await git.status({ fs, dir, filepath });
        //         return `${filepath}: ${status}`;
        //     }),
        // );

        // STEP 3: Check if anything is staged
        const postStageMatrix = await git.statusMatrix({ fs, dir });
        const hasStagedChanges = postStageMatrix.some(
            ([filepath, head, workdir, stage]) => stage !== head,
        );

        if (!hasStagedChanges) {
            toast.error("No changes to commit.");
            return;
        }

        // STEP 4: Commit the staged changes
        let commitOid = null;
        try {
            commitOid = await git.commit({
                fs,
                dir,
                message: commitmessage,
                author: {
                    name: auth.profile?.name || "Anonymous",
                    email: auth.profile?.email || "anon@example.com",
                },
            });
        } catch (error: any) {
            toast.error("❌ Commit failed: " + error.message);
            return;
        }

        if (commitOid) {
            toast.success(`✅ Commit successful! OID: ${commitOid}`);
        } else {
            toast.error("❌ Commit failed: No commit OID returned");
        }

        // STEP 5: Reset UI
        commitmessage = "";
        openAddFileDialog = false;
    }

    async function handlePushChanges() {
        const fs = new FS(data.item.repo.split("/").join("_"));
        const dir = "/test-clone";
        try {
            // Try to get current branch, fallback to HEAD if needed
            const headSha = await git.resolveRef({ fs, dir, ref: "HEAD" });
            if (!headSha) {
                toast.error("Push failed: Could not determine current branch");
            } else {
                const dbbranch = await auth.client.FindOne<any>({
                    collectionname: "git",
                    query: { sha: data.sha, ref: { $ne: "HEAD" } },
                    jwt: auth.access_token,
                });

                const headers = {
                    Authorization: "Bearer " + auth.access_token,
                };
                const currentBranch =
                    branches.find((b) => b.sha === selectedSha)?.name ||
                    "Select Branch";

                if (dbbranch == null) {
                    await git.push({
                        fs,
                        http,
                        dir,
                        remote: "origin",
                        ref: currentBranch,
                        headers,
                    });
                } else {
                    await git.push({
                        fs,
                        http,
                        dir,
                        remote: "origin",
                        ref: currentBranch,
                        headers,
                    });
                }
                toast.success("Pushed to remote successfully");
            }
        } catch (pushErr: any) {
            toast.error("Push failed: " + (pushErr?.message || pushErr));
        }
    }
    async function cleanDB(name: string) {
        // i want to delete only this db dbname change the code bellow for this
        indexedDB
            .databases()
            .then((r) => {
                for (const db of r) {
                    let dbname = db.name as any;
                    if (dbname == name) {
                        const DBDeleteRequest =
                            window.indexedDB.deleteDatabase(dbname);
                        DBDeleteRequest.onerror = (event) => {};
                        DBDeleteRequest.onsuccess = (event) => {};
                    }
                }
                // toast.success("DB deleted successfully!" + name);
            })
            .catch((error) => {
                toast.error("Error deleting DB: " + error.message);
            });
    }

    async function discardAllChanges() {
        try {
            // name of current database in the indexedDB
            const databasename = data.item.repo.split("/").join("_");
            await cleanDB(databasename);
            toast.success("All changes discarded successfully");
            await reloadData();
        } catch (error: any) {
            toast.error("Error discarding changes: " + error.message);
        }
    }

    async function reloadData() {
        try {
            files = [];
            branches = [];
            const updatedData = await auth.client.FindOne<any>({
                collectionname: "git",
                query: { _id: data.item._id },
                jwt: auth.access_token,
            });

            // // check in the url if we have sha and filename then redirect to that
            // if (currentFilePath() != null || currentFilePath() != "") {
            //     goto(
            //         base +
            //             `/git/${updatedData._id}/${updatedData.sha}/${currentFilePath()}`,
            //     );
            // } else {
            //     goto(base + `/git/${updatedData._id}/${updatedData.sha}`);
            // }

            goto(base + `/git/${updatedData._id}/${updatedData.sha}`);
            await cloneRepo(updatedData.sha);
            toast.success("Data reloaded successfully!");
        } catch (error: any) {
            toast.error("Error reloading data: " + error.message);
        }
    }

    function stringToUint8Array(str: string): Uint8Array {
        return new TextEncoder().encode(str);
    }
    async function createTgzFromPayload(payload: {
        jwt: string; // (we won’t actually use this in the tar, but you could!)
        filename: string;
        files: { filename: string; content: string }[];
    }): Promise<Uint8Array> {
        if (!browser) {
            throw new Error(
                "createTgzFromPayload() can only run in the browser",
            );
        }

        // ──────── 2a. Dynamically import tar-js (default export = Tar constructor) ────────
        // At runtime in the browser, this yields:
        //   TarModule.default === the Tar class constructor
        // @ts-ignore
        const TarModule: any = await import("tar-js");
        const Tar: new (recordsPerBlock?: number) => {
            append(
                filepath: string,
                input: string | Uint8Array,
                opts?: any,
                callback?: (out: Uint8Array) => any,
            ): Uint8Array;
            clear(): void;
            // After appending, `out` holds the complete raw .tar as a Uint8Array
            out: Uint8Array;
            written: number;
        } = TarModule.default || TarModule;
        //

        // ──────── 2b. Dynamically import gzip from fflate’s ESM/browser build ────────
        // @ts-ignore
        const fflateModule: any = await import("fflate");
        const {
            gzip,
        }: {
            gzip: (
                data: Uint8Array,
                opts: { level: number },
                cb: (err: Error | null, result: Uint8Array) => void,
            ) => void;
        } = fflateModule;
        //

        // ─────────────────── 3. Build the raw .tar with tar-js ───────────────────
        const tarWriter = new Tar();
        for (const { filename: name, content: textContent } of payload.files) {
            // UTF-8 encode each string → Uint8Array
            const dataBytes = stringToUint8Array(textContent);
            // Append a file entry: path `name` + data `dataBytes`
            tarWriter.append(name, dataBytes);
        }
        // After appending all files, tarWriter.out is a Uint8Array of the raw .tar archive
        const tarBytes: Uint8Array = tarWriter.out;
        //

        // ──────────────────── 4. Gzip the raw .tar → get a Uint8Array for .tgz ────────────────────
        const tgzBytes: Uint8Array = await new Promise<Uint8Array>(
            (resolve, reject) => {
                gzip(
                    tarBytes,
                    { level: 6 },
                    (err: Error | null, compressed: Uint8Array) => {
                        if (err) reject(err);
                        else resolve(compressed);
                    },
                );
            },
        );
        //

        return tgzBytes;
    }

    async function getSlug(packageJson: any) {
        if (packageJson.openiap) {
            if (!packageJson.openiap.slug) {
                return "";
                throw new Error("Slug not found in package.json");
            } else {
                return packageJson.openiap.slug;
            }
        } else {
            return "";
            throw new Error("Openiap object not found in package.json");
        }
    }
    async function repackandUpload() {
        loading = true;
        try {
            const packageJsonEntry = files.find(
                (file: any) =>
                    file.name === "package.json" && file.type === "blob",
            );
            if (!packageJsonEntry) {
                throw new Error("package.json not found in package");
            }
            // Read the actual file content from the filesystem
            const fs = new FS(data.item.repo.split("/").join("_"));
            const dir = "/test-clone";
            const filePath = `${dir}/${packageJsonEntry.path}`;
            const fileContent = await fs.promises.readFile(filePath, {
                encoding: "utf8",
            });
            const packageJson = JSON.parse(fileContent);

            let slug = "";
            slug = await getSlug(packageJson);

            let packageData: any = null;
            if (!IsNullEmpty(slug)) {
                packageData = await auth.client.FindOne<any>({
                    collectionname: "agents",
                    query: { slug: slug, _type: "package" },
                    jwt: auth.access_token,
                });
            }

            let newfilename = "";
            let oldfile;
            if (!IsNullEmpty(packageData)) {
                oldfile = await auth.client.FindOne<any>({
                    collectionname: "files",
                    query: { _id: packageData.fileid },
                    jwt: auth.access_token,
                });
                newfilename = oldfile.filename;
                console.log("oldfile:", oldfile);
            } else {
                packageData = {};
                packageData.name = packageJson.name;
                newfilename = packageJson.name + ".tgz";
            }

            let newfiles = await Promise.all(
                files
                    .filter((entry: any) => entry.type === "blob") // Only include files, not directories
                    .map(async (entry: any) => {
                        try {
                            // Read file content from filesystem
                            const filePath = `${dir}/${entry.path}`;
                            const fileContent = await fs.promises.readFile(
                                filePath,
                                { encoding: "utf8" },
                            );
                            return {
                                filename: entry.path, // Use full path instead of just name
                                content: fileContent,
                            };
                        } catch (error) {
                            console.error(
                                `Error reading file ${entry.path}:`,
                                error,
                            );
                            return {
                                filename: entry.path,
                                content: "", // Fallback to empty content
                            };
                        }
                    }),
            );
            const body = {
                filename: newfilename,
                files: newfiles,
                jwt: data.access_token,
            };
            let uploadedfileid;
            try {
                // @ts-ignore
                const newfiledata = await createTgzFromPayload(body);
                uploadedfileid = await auth.client.UploadFile(
                    newfilename,
                    "application/gzip",
                    newfiledata,
                    data.access_token,
                );
            } catch (error: any) {
                console.error("Error preparing files for upload:", error);
                toast.error("Error preparing files for upload", {
                    description: error.message,
                });
                return;
            }
            // upload new tgz file

            // ensure package data
            packageData.fileid = uploadedfileid;

            let uploadedpackagedata: any = await auth.client.CustomCommand({
                command: "ensurepackage",
                data: packageData,
                jwt: auth.access_token,
            });
            uploadedpackagedata = JSON.parse(uploadedpackagedata);
            // write new slug to packagejson file
            if (uploadedpackagedata.slug != slug) {
                packageJson.openiap.slug = uploadedpackagedata.slug;

                const packageJsonPath = `${dir}/${packageJsonEntry.path}`;
                const updatedContent = JSON.stringify(packageJson, null, 2);
                await fs.promises.writeFile(
                    packageJsonPath,
                    updatedContent,
                    "utf8",
                );

                // Stage the file changes in git
                await git.add({ fs, dir, filepath: packageJsonEntry.path });

                // Refresh the file list to reflect changes
                const rawFiles = await listMatrixRecursive({ fs, dir });
                files = buildFileList(rawFiles);

                // Also update the buffer for consistency
                packageJsonEntry.buffer =
                    textEncoder.encode(updatedContent).buffer;

                // Trigger invalidation to refresh any cached content
                invalidateAll();
            }

            // delete old file
            if (oldfile) {
                await auth.client.DeleteOne({
                    collectionname: "fs.files",
                    id: oldfile._id,
                    jwt: auth.access_token,
                });
            }
            toast.success("Package uploaded successfully", {
                description: `File ID: ${uploadedfileid}`,
            });
        } catch (error: any) {
            console.error("Error uploading package:", error);
            toast.error("Error uploading package", {
                description: error.message,
            });
        }
        loading = false;
    }

    async function buildpackage() {
        let workspaceid = usersettings.currentworkspace;
        if (workspaceid == null || workspaceid == "") {
            if (workspaceid == "" || workspaceid == null) {
                toast.error("Error", {
                    description: "Please select a workspace",
                });
                return;
            }
        }

        loading = true;
        openDialog = true;
        loadingDialog = true;
        builderlog = "";
        let queuename = "";
        try {
            const packageJsonEntry = files.find(
                (file: any) =>
                    file.name === "package.json" && file.type === "blob",
            );
            if (!packageJsonEntry) {
                throw new Error("package.json not found in package");
            }
            const fs = new FS(data.item.repo.split("/").join("_"));
            const dir = "/test-clone";
            console.log("packageJsonEntry", packageJsonEntry);
            const filePath = `${dir}/${packageJsonEntry.path}`;
            const fileContent = await fs.promises.readFile(filePath, {
                encoding: "utf8",
            });
            const packageJson = JSON.parse(fileContent);
            const slug = await getSlug(packageJson);
            console.log("Package slug:", slug);

            if (IsNullEmpty(slug)) {
                throw new Error(
                    "Slug is required in package.json to build the package",
                );
            }

            // get the package id using slug from the database
            const packageData = await auth.client.FindOne<any>({
                collectionname: "agents",
                query: { slug: slug, _type: "package" },
                jwt: auth.access_token,
            });
            if (!packageData) {
                return toast.error("Package not found in database");
            }
            console.log("Package data:", packageData);

            queuename = await auth.client.RegisterQueue(
                { queuename: "", jwt: data.access_token },
                (msg, payload, user, jwt) => {
                    if (payload.logs != null) {
                        if (!payload.logs.endsWith("\n")) {
                            payload.logs += "\n";
                        }
                        builderlog = payload.logs + builderlog;
                    }
                    // const chatContainer = document.getElementById("chatcontainer");
                    // if (chatContainer) {
                    //   chatContainer.scrollTop = chatContainer.scrollHeight;
                    // }
                },
            );

            let correlation_id = Math.random().toString(36).substring(2, 11);
            const build_result = await auth.client.QueueMessage(
                {
                    queuename: "sfbuilder",
                    data: {
                        command: "build",
                        packageid: packageData._id,
                        workspaceid,
                        anonymous: true,
                        correlation_id: correlation_id,
                        queuename,
                    },
                    jwt: auth.access_token,
                },
                true,
            );
            if (build_result.success == false) {
                builderlog =
                    "Error Building package: " +
                    build_result.result +
                    "\n" +
                    builderlog;
                throw new Error(
                    "Error Building package: " + build_result.result,
                );
            }
            builderlog =
                "Image build successfully in " +
                build_result.timetaken +
                " seconds\n" +
                builderlog;
        } catch (error: any) {
            loading = false;
            loadingDialog = false;
            builderlog += "Error Building package: " + error.message + "\n";
            console.error("Building package:", error.message);
            throw new Error("Building package: " + error.message);
        } finally {
            loading = false;
            loadingDialog = false;
            if (queuename != "" || queuename != null) {
                auth.client.UnRegisterQueue({
                    queuename,
                    jwt: auth.access_token,
                });
            }
        }
        loading = false;
        loadingDialog = false;
    }
</script>

{#snippet refreshData()}
    <HotkeyButton
        disabled={loading}
        aria-label="Reload Data"
        title="Reload Data"
        onclick={reloadData}
    >
        <RefreshCcw />
        Reload Data
    </HotkeyButton>
{/snippet}

<div id="gitstatus" class="hidden">unknown</div>

<div class="flex flex-row w-full gap-4 h-full">
    {#if data.item.sha != null}
        <div
            class="md:h-full flex-shrink-0 p-4 rounded-[10px] bg-bw200 dark:bg-bw850 border dark:border-bw600"
        >
            <ul
                class="space-y-2 max-h-[500px] md:max-h-full md:h-full overflow-auto md:w-[240px] xl:w-[340px]"
            >
                <div class="font-bold">
                    Repo: {data?.item?.repo?.split("/").pop()}
                </div>
                <div class="grid grid-cols-1 xl:flex gap-2 mb-2">
                    <HotkeyButton
                        variant="danger"
                        aria-label="Clean All Local DBS"
                        disabled={loading}
                        onclick={() => {
                            indexedDB
                                .databases()
                                .then((r) => {
                                    for (const db of r) {
                                        let dbname = db.name as any;

                                        const DBDeleteRequest =
                                            window.indexedDB.deleteDatabase(
                                                dbname,
                                            );
                                        DBDeleteRequest.onerror = (event) => {};
                                        DBDeleteRequest.onsuccess = (
                                            event,
                                        ) => {};
                                    }
                                    toast.success(
                                        "All DBS cleaned successfully!",
                                    );
                                })
                                .catch((error) => {
                                    toast.error(
                                        "Error cleaning DBS: " + error.message,
                                    );
                                });
                        }}
                    >
                        <Trash class="h-5 w-5" />
                        Clean DBS
                    </HotkeyButton>
                    <HotkeyButton
                        title="Copy clone command"
                        aria-label="Copy clone command"
                        class="w-full mb-2"
                        onclick={async () => {
                            try {
                                const parts = data.item.repo.split("/");
                                let copycommand;
                                let protocol = auth.config.wsurl.startsWith(
                                    "wss",
                                )
                                    ? "https"
                                    : "http";

                                if ((auth.profile as any).name == "guest") {
                                    copycommand = `rm -rf ${parts[parts.length - 1]} && git clone ${protocol}://${auth.config.domain}/git/${data.item.repo} && code ${parts[parts.length - 1]}`;
                                } else {
                                    let tokenres =
                                        await auth.client.CustomCommand({
                                            command: "issueusertoken",
                                            // @ts-ignore
                                            data: {
                                                name: "web_git_clone",
                                                app: "git",
                                                exp: "365d", // 1 year
                                            },
                                            jwt: auth.access_token,
                                        });
                                    copycommand = `rm -rf ${parts[parts.length - 1]} && git clone ${protocol}://${auth.config.domain}/git/${data.item.repo} -c http.extraHeader="Authorization: Bearer ${JSON.parse(tokenres).access_token}" && code ${parts[parts.length - 1]}`;
                                }
                                navigator.clipboard.writeText(copycommand);
                                toast.success(
                                    "Clone command copied to clipboard!",
                                );
                            } catch (error: any) {
                                toast.error(
                                    "Error copying clone command: " +
                                        error.message,
                                );
                            }
                        }}
                    >
                        <Copy class="h-5 w-5" />
                        Copy Clone Command
                    </HotkeyButton>
                </div>

                <Customselect
                    {loading}
                    selectitems={branches}
                    value={selectedSha}
                    type="single"
                    width="w-full"
                    class="mb-2"
                    triggerContent={() => {
                        return branches.length > 0
                            ? branches.find((b) => b.sha === selectedSha)
                                  ?.name || "Select Branch"
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
                            const fs = new FS(
                                data.item.repo.split("/").join("_"),
                            );
                            const dir = "/test-clone";
                            const dbbranch = await auth.client.FindOne<any>({
                                collectionname: "git",
                                query: { sha: value, ref: { $ne: "HEAD" } },
                                jwt: auth.access_token,
                            });

                            // Log before checkout
                            const beforeHead = await git.resolveRef({
                                fs,
                                dir,
                                ref: "HEAD",
                            });

                            // Always checkout to the specific SHA, not the branch name
                            let checkoutPromise = git
                                .checkout({
                                    fs,
                                    dir,
                                    ref: value, // Always use the SHA directly
                                    force: true,
                                })
                                .catch(async (error) => {
                                    console.error(
                                        "Direct SHA checkout failed, trying temp branch:",
                                        error,
                                    );
                                    // Fallback: create temporary branch
                                    const tempBranchName = `temp-${value.substring(0, 8)}`;
                                    await git.branch({
                                        fs,
                                        dir,
                                        ref: tempBranchName,
                                        force: true,
                                    });
                                    return git.checkout({
                                        fs,
                                        dir,
                                        ref: tempBranchName,
                                        force: true,
                                    });
                                });

                            checkoutPromise
                                .then(async () => {
                                    const afterHead = await git.resolveRef({
                                        fs,
                                        dir,
                                        ref: "HEAD",
                                    });

                                    if (afterHead !== value) {
                                        console.error(
                                            "Branch switch FAILED! Expected:",
                                            value,
                                            "Got:",
                                            afterHead,
                                        );
                                    } else {
                                    }

                                    // Refresh files after checkout
                                    return listMatrixRecursive({ fs, dir });
                                })
                                .then((rawFiles) => {
                                    files = buildFileList(rawFiles);
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
                        <HotkeyButton
                            disabled={loading}
                            variant="ghostfull"
                            class="flex items-center gap-1 cursor-pointer"
                            style="padding-left: {file.depth}rem"
                            onclick={() => toggleFold(file.path)}
                        >
                            {#if collapsedFolders.has(file.path)}
                                <FolderClosed class="h-5 w-5" />
                            {:else}
                                <FolderOpen class="h-5 w-5" />
                            {/if}
                            {file.name}
                            {#if collapsedFolders.has(file.path)}
                                <Plus class="h-5 w-5" />
                            {:else}
                                <Minus class="h-5 w-5" />
                            {/if}
                        </HotkeyButton>
                    {:else if file.type === "blob"}
                        <div
                            class={`flex items-center justify-between w-full ${currentFilePath() === file.path && "p-1.5 bg-bw100 dark:bg-bw600 rounded"}`}
                            style="padding-left: {file.depth}rem"
                        >
                            <div class="flex items-center w-full gap-1">
                                <File class="h-5 w-5" />
                                {#if showRenameInput && renameFile.index === index}
                                    <div class="flex items-center w-full gap-2">
                                        <CustomInput
                                            width="w-full"
                                            bind:value={renameInputText}
                                        />
                                        <HotkeyButton
                                            disabled={loading}
                                            variant="success"
                                            aria-label="Confirm rename"
                                            title="Confirm"
                                            size="icon"
                                            onclick={handleRenameFile}
                                            ><Check /></HotkeyButton
                                        >
                                        <HotkeyButton
                                            disabled={loading}
                                            variant="danger"
                                            aria-label="Cancel rename"
                                            title="Cancel"
                                            size="icon"
                                            onclick={handleCancelRename}
                                            ><X /></HotkeyButton
                                        >
                                    </div>
                                {:else}
                                    <button
                                        onclick={() =>
                                            goto(
                                                base +
                                                    `/git/${data.item._id}/${data.sha}/${file.path}`,
                                            )}
                                    >
                                        {file.name}
                                    </button>
                                {/if}
                            </div>
                            {#if !(showRenameInput && renameFile.index === index)}
                                <div class="flex gap-2">
                                    <HotkeyButton
                                        disabled={loading}
                                        variant="danger"
                                        aria-label="Delete file"
                                        title="Delete file"
                                        size="icon"
                                        onclick={() => {
                                            selectedFile = {
                                                path: file.path,
                                                index,
                                            };
                                            showDeleteFileWarning = true;
                                        }}><Trash2 /></HotkeyButton
                                    >
                                    <HotkeyButton
                                        disabled={loading}
                                        aria-label="Rename file"
                                        title="Rename file"
                                        size="icon"
                                        onclick={() => {
                                            renameFile = {
                                                path: file.path,
                                                index,
                                            };
                                            renameInputText = file.name;
                                            showRenameInput = true;
                                        }}><Edit2 /></HotkeyButton
                                    >
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <li>
                            {file.path} ({file.type})
                        </li>
                    {/if}
                {/each}
                {#if showNewFileInput}
                    <div class="flex items-center gap-2">
                        <CustomInput
                            width="w-full"
                            bind:value={newFileName}
                            placeholder="Enter new file name"
                        />
                        <HotkeyButton
                            variant="success"
                            aria-label="Create file"
                            title="Create"
                            size="icon"
                            onclick={handleCreateFile}><Check /></HotkeyButton
                        >
                        <HotkeyButton
                            variant="danger"
                            aria-label="Cancel"
                            title="Cancel"
                            size="icon"
                            onclick={() => {
                                showNewFileInput = false;
                                newFileName = "";
                            }}><X /></HotkeyButton
                        >
                    </div>
                {/if}
                <HotkeyButton
                    disabled={loading || showNewFileInput}
                    aria-label="Create new file"
                    title="Create new file"
                    class="w-full mt-2"
                    onclick={() => {
                        showNewFileInput = true;
                    }}
                >
                    + New File
                </HotkeyButton>
                {@render refreshData()}
            </ul>
        </div>
    {/if}

    <div
        class="h-full w-full overflow-auto p-4 bg-bw200 dark:bg-bw850 border dark:border-bw600 rounded-[10px] md:h-full md:overflow-auto"
    >
        {#if data.item.sha != null}
            {@render children()}
            <div class="flex items-center gap-4 mt-4">
                <HotkeyButton
                    disabled={loading}
                    variant="danger"
                    aria-label="Discard changes"
                    title="Discard changes"
                    onclick={() => (showDiscardAllChangesWarning = true)}
                >
                    <Trash2 />
                    Discard changes
                </HotkeyButton>
                {#if historyview == false}
                    <HotkeyButton
                        disabled={loading || !auth.profile}
                        aria-label="Commit changes"
                        title="Commit changes"
                        onclick={() => (openAddFileDialog = true)}
                    >
                        <GitCommitHorizontal />
                        Commit changes
                    </HotkeyButton>
                    <HotkeyButton
                        disabled={loading || !auth.profile}
                        variant="success"
                        aria-label="Push changes"
                        title="Push changes"
                        onclick={handlePushChanges}
                    >
                        <ArrowUpFromLine />
                        Push changes
                    </HotkeyButton>
                {/if}
            </div>
        {:else}
            <div class="mb-4 text-bw600 dark:text-bw400">
                Repo: <b>{data.item.repo}</b> is empty. You can create a new file
                or push an existing repository.
            </div>
            {#if (auth.profile as any).name != "guest"}
                <div class="flex items-center gap-4 mb-4">
                    <div>Create a new repository on the command line</div>
                    <HotkeyButton
                        title="copy new repository command"
                        aria-label="copy new repository command"
                        onclick={async () => {
                            try {
                                const parts = data.item.repo.split("/");
                                let copycommand;
                                let tokenres = await auth.client.CustomCommand({
                                    command: "issueusertoken",
                                    // @ts-ignore
                                    data: {
                                        name: "web_git_clone",
                                        app: "git",
                                        exp: "365d", // 1 year
                                    },
                                    jwt: auth.access_token,
                                });
                                let protocol = auth.config.wsurl.startsWith(
                                    "wss",
                                )
                                    ? "https"
                                    : "http";

                                copycommand = `echo "# ${parts[parts.length - 1]}" >> README.md
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin ${protocol}://${auth.config.domain}/git/${data.item.repo}
git config --local http.extraHeader "Authorization: Bearer ${JSON.parse(tokenres).access_token}"
git push -u origin main`;

                                navigator.clipboard.writeText(copycommand);
                                toast.success(
                                    "Create new repository command copied to clipboard!",
                                );
                            } catch (error: any) {
                                toast.error(
                                    "Error copying create new repository command: " +
                                        error.message,
                                );
                            }
                        }}
                    >
                        <Copy class="h-5 w-5" />
                        Copy
                    </HotkeyButton>
                </div>
            {/if}
            <div class="flex items-center gap-4 mb-4">
                <div>Push an existing repository from the command line</div>
                <HotkeyButton
                    title="Copy push local repository command"
                    aria-label="Copy push local repository command"
                    onclick={async () => {
                        try {
                            let copycommand;
                            let protocol = auth.config.wsurl.startsWith("wss")
                                ? "https"
                                : "http";
                            if ((auth.profile as any).name == "guest") {
                                copycommand = `git remote add origin ${protocol}://${auth.config.domain}/git/${data.item.repo}\ngit push -u origin main\ngit push origin --all && git push origin --tags`;
                            } else {
                                let tokenres = await auth.client.CustomCommand({
                                    command: "issueusertoken",
                                    // @ts-ignore
                                    data: {
                                        name: "web_git_clone",
                                        app: "git",
                                        exp: "365d", // 1 year
                                    },
                                    jwt: auth.access_token,
                                });

                                copycommand = `git remote add origin ${protocol}://${auth.config.domain}/git/${data.item.repo}\ngit config --local http.extraHeader "Authorization: Bearer ${JSON.parse(tokenres).access_token}"\ngit push -u origin main\ngit push origin --all && git push origin --tags`;
                            }
                            navigator.clipboard.writeText(copycommand);
                            toast.success(
                                "Push local repository command copied to clipboard!",
                            );
                        } catch (error: any) {
                            toast.error(
                                "Error copying push local repository command: " +
                                    error.message,
                            );
                        }
                    }}
                >
                    <Copy class="h-5 w-5" />
                    Copy
                </HotkeyButton>
            </div>
            {@render refreshData()}
        {/if}
    </div>
</div>

{#if data.item.sha != null}
    <div class="hidden md:block">
        <div
            class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:flex lg:items-end lg:justify-between mt-4"
        >
            <div
                class="lg:flex lg:justify-end lg:items-end lg:w-[240px] xl:w-[370px]"
            >
                <HotkeyButton
                    aria-label="Pack and upload"
                    title="Pack and upload"
                    disabled={loading}
                    variant="success"
                    class="w-fit"
                    onclick={() => repackandUpload()}
                    >Pack and upload</HotkeyButton
                >
            </div>
            <div
                class="grid grid-cols-1 mt-4 lg:mt-0 lg:flex justify-end items-end gap-4 auto-rows-max"
            >
                <HotkeyButton
                    aria-label="Build and deploy to serverless"
                    title="Build and deploy to serverless"
                    disabled={loading}
                    variant="success"
                    class="w-fit"
                    onclick={() => buildpackage()}
                    >Build and deploy to serverless</HotkeyButton
                >
                <HotkeyButton
                    aria-label="Open in browser"
                    title="Open in browser"
                    disabled={loading}
                    class="w-fit"
                    onclick={async () => {
                        const packageJsonEntry = files.find(
                            (file: any) =>
                                file.name === "package.json" &&
                                file.type === "blob",
                        );
                        if (!packageJsonEntry) {
                            throw new Error(
                                "package.json not found in package",
                            );
                        }
                        const fs = new FS(data.item.repo.split("/").join("_"));
                        const dir = "/test-clone";
                        console.log("packageJsonEntry", packageJsonEntry);
                        const filePath = `${dir}/${packageJsonEntry.path}`;
                        const fileContent = await fs.promises.readFile(
                            filePath,
                            {
                                encoding: "utf8",
                            },
                        );
                        const packageJson = JSON.parse(fileContent);
                        const slug = await getSlug(packageJson);
                        window.open(auth.fnurl(slug), "_blank");
                    }}>Open in browser</HotkeyButton
                >
                <HotkeyButton
                    aria-label="Show logs"
                    title="Show logs"
                    disabled={!builderlog}
                    class="w-fit"
                    onclick={() => {
                        openDialog = true;
                    }}>Show logs</HotkeyButton
                >
            </div>
        </div>
    </div>
{/if}

<Warningdialogue
    bind:showWarning={showDeleteFileWarning}
    type="delete"
    onaccept={handleDeleteFile}
></Warningdialogue>

<Warningdialogue
    bind:showWarning={showDiscardAllChangesWarning}
    type="gitdiscard"
    onaccept={discardAllChanges}
></Warningdialogue>

<AlertDialog.Root bind:open={openAddFileDialog}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Commit changes</AlertDialog.Title>
            <AlertDialog.Description class="h-fit w-full">
                <div class="">
                    <CustomInput
                        size="md"
                        label="File name"
                        placeholder="Enter commit message"
                        bind:value={commitmessage}
                        class="my-4"
                        width="w-full"
                    />
                </div>
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <HotkeyButton
                aria-label="Commit changes"
                title="Commit changes"
                data-shortcut="enter"
                disabled={!commitmessage}
                variant="success"
                onclick={() => handleCommitChanges()}
                >Commit Changes</HotkeyButton
            >
            <HotkeyButton
                aria-label="Close dialog"
                title="Close dialog"
                variant="danger"
                onclick={() => {
                    openAddFileDialog = false;
                }}>Close</HotkeyButton
            >
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={openDialog}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Server logs</AlertDialog.Title>
            <AlertDialog.Description class="h-fit w-full">
                <div class="overflow-auto max-h-[60vh] max-w-[100vh]">
                    {#if loading}
                        <div class="mt-4 p-4 rounded dark:bg-bw500">
                            <p class="text-bw900">Processing...</p>
                        </div>
                    {:else}
                        <div class="mt-4 p-4 bg-gray-100 rounded dark:bg-bw500">
                            <p class="text-bw900">Completed</p>
                            <p></p>
                        </div>
                    {/if}

                    {#if builderlog}
                        <div class="mt-4 p-4 bg-gray-100 rounded dark:bg-bw500">
                            <pre
                                class="text-sm text-bw900 whitespace-pre-wrap">{builderlog}</pre>
                        </div>
                    {/if}
                </div>
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <HotkeyButton
                aria-label="Pack and upload"
                title="Pack and upload"
                disabled={loadingDialog}
                variant="success"
                class="w-fit mt-10"
                onclick={() => {
                    //   window.open(
                    //     auth.fnurl(data.packageData.slug || data.packageData.name),
                    //     "_blank",
                    //   );
                }}>Open in browser</HotkeyButton
            >
            <HotkeyButton
                aria-label="Close dialog"
                title="Close dialog"
                disabled={loadingDialog}
                variant="danger"
                class="w-fit mt-10"
                onclick={() => {
                    openDialog = false;
                }}>Close</HotkeyButton
            >
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<Customsuperdebug formData={data.item} />
