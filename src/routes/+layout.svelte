<script lang="ts">
	import { browser } from "$app/environment";
	import { goto } from "$app/navigation";
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import { data as datacomponent } from "$lib/entities/data.svelte.js";
	import { HotkeyDialogue } from "$lib/hotkeydialogue";
	import AppSidebar from "$lib/sidebar/app-sidebar.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { sidemenu } from "$lib/stores/sidemenu.svelte";
	import { usersettings } from "$lib/stores/usersettings.svelte";
	import { ModeWatcher } from "mode-watcher";
	import { toast } from "svelte-sonner";
	import "../app.css";
	import Header from "./Header.svelte";
	import type { Workspace } from "./workspace/schema.js";
	import posthog from "posthog-js";
	import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
	import { Resource } from "@opentelemetry/resources";
	import {
		LoggerProvider,
		BatchLogRecordProcessor,
	} from "@opentelemetry/sdk-logs";
	import * as logsAPI from "@opentelemetry/api-logs";

	let { children, data } = $props();
	datacomponent.parsesettings(data.settings);
	const { wsurl, protocol, domain, client_id, profile, origin } = data;
	let { access_token } = data;

    if (auth.config.otel_log_url != null && auth.config.otel_log_url !== "") {
        let url = auth.config.otel_log_url;
        url = url.replace("https://otel.", "https://otelhttp.");
        url = url.replace("http://otel.", "http://otelhttp.");

        const logExporter = new OTLPLogExporter({ url });
        const resource = new Resource({
            ["service.name"]: "core-web",
            ["ofid"]: auth.config.ofid,
        });

        const loggerProvider = new LoggerProvider({ resource });
        loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
        const logger = loggerProvider.getLogger("default", auth.config?.version);

        // Store original console functions to avoid recursion
        const originalConsole = {
            log: console.log,
            debug: console.debug,
            warn: console.warn,
            error: console.error
        };

		function getCallerInfo(): { filename: string; line: number } {
			try {
				const stack = new Error().stack;
				if (!stack) return { filename: "unknown", line: 0 };

				const lines = stack.split("\n").map(line => line.trim());

				for (const line of lines) {
					// Skip internal logging functions
					if (line.includes("getCallerInfo") || line.includes("logWithStackPreserved")) {
						continue;
					}

					// Match browser stack traces (URLs)
					let match = line.match(/(?:\bat\b|\()?([^():\s]+):(\d+):(\d+)\)?$/);
					if (match) {
						const fullPath = match[1];  // Full URL or File Path
						const lineNumber = parseInt(match[2], 10);

						// Extract just the filename from the full path (strip directories)
						const filename = fullPath.split('/').pop() || "unknown";

						return { filename, line: lineNumber };
					}
				}
			} catch (e) {
				return { filename: "unknown", line: 0 };
			}

			return { filename: "unknown", line: 0 };
		}


		function logWithStackPreserved(
			originalConsoleFn: (...args: unknown[]) => void, 
			severityNumber: number, 
			severityText: string, 
			...args: unknown[]
		): void {
			// Log to the original console
			originalConsoleFn.apply(console, args);

			// Convert arguments to a single string message
			const message = args.map(arg => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ");

			// Get the correct caller info
			const callerInfo = getCallerInfo();

			// Emit logs to OTEL
			logger.emit({
				severityNumber,
				severityText,
				body: `${message.trim()}`,
				attributes: {
					filename: callerInfo.filename,
					line: callerInfo.line
				}
			});
		}


        // Override console methods while preserving both behaviors
        console.log = (...args: unknown[]) => logWithStackPreserved(originalConsole.log, logsAPI.SeverityNumber.INFO, "INFO", ...args);
        console.debug = (...args: unknown[]) => logWithStackPreserved(originalConsole.debug, logsAPI.SeverityNumber.DEBUG, "DEBUG", ...args);
        console.warn = (...args: unknown[]) => logWithStackPreserved(originalConsole.warn, logsAPI.SeverityNumber.WARN, "WARN", ...args);
        console.error = (...args: unknown[]) => logWithStackPreserved(originalConsole.error, logsAPI.SeverityNumber.ERROR, "ERROR", ...args);
    }

	if (auth.config != null) {
		console.log(
			"core-web version",
			data.webversion,
			"git commit",
			data.webcommit,
			"opencore version",
			auth.config.version,
		);
	} else if (browser) {
		console.log("core-web not initialized, is opencore down?");
	}

	let _workspaces = data.workspaces;
	let workspaces = $state(_workspaces);
	let currentworkspace = $state(usersettings.currentworkspace);
	let pagename = $derived(() =>
		$page.url.pathname.replace(base, "").replace("/", ""),
	);
	async function loadWorkspaces() {
		try {
			workspaces = await auth.client.Query<Workspace>({
				collectionname: "users",
				query: { _type: "workspace" },
				jwt: access_token,
				top: 5,
			});
			if (
				usersettings.currentworkspace != null &&
				usersettings.currentworkspace != ""
			) {
				let exists = workspaces.find(
					(x) => x._id == usersettings.currentworkspace,
				);
				if (exists == null) {
					let _workspace = await auth.client.FindOne<Workspace>({
						collectionname: "users",
						query: {
							_type: "workspace",
							_id: usersettings.currentworkspace,
						},
						jwt: access_token,
					});
					if (_workspace != null) {
						workspaces.pop();
						workspaces.unshift(_workspace);
					}
				}
			}
		} catch (error: any) {
			if (browser) {
				toast.error("Error assigning resource", {
					description: error.message,
				});
			}
		}
	}
	async function update_currentworkspace(workspaceid: string) {
		usersettings.currentworkspace = workspaceid;
		currentworkspace = workspaceid;
		await loadWorkspaces();
		await usersettings.dopersist();
		if (workspaceid == null || workspaceid == "") {
			return;
		}
		// goto(base + "/workspace/" + workspaceid);
	}
	$effect(() => {
		if (usersettings.currentworkspace != currentworkspace) {
			update_currentworkspace(usersettings.currentworkspace);
		}
	});

	if (data.code != null && data.code != "") {
		if (browser) {
			auth.signinRedirectCallback().then(async (res) => {
				if (res) {
					access_token = await auth.clientinit(
						wsurl,
						protocol,
						domain,
						client_id,
						origin,
						access_token,
						profile,
						fetch,
						null,
					);
					await usersettings.dbload(access_token);
					currentworkspace = usersettings.currentworkspace;
					await loadWorkspaces();
					const redirect = window.localStorage.getItem("redirect");
					window.localStorage.removeItem("redirect");
					goto(redirect || "/");
				}
			});
		}
	}
	if (browser && data.posthog_token != "") {
		posthog.init(data.posthog_token, {
			api_host: "https://eu.i.posthog.com",
			person_profiles: "identified_only",
		});
	}
</script>

<svelte:head>
	<title>OpenCore {pagename()}</title>
	<meta
		name="description"
		content="Get performance data and generates index suggestions for better database performance"
	/>
</svelte:head>

<ModeWatcher />
{#if $page.url.pathname != base + "/login" && $page.url.pathname != base + "/loginscreen"}
	<div
		class={`flex flex-col w-full h-screen dark:text-bw100 font-custom max-w-full`}
	>
		<HotkeyDialogue />
		<Sidebar.Provider open={sidemenu.status}>
			<AppSidebar
				{workspaces}
				{currentworkspace}
				{profile}
				{update_currentworkspace}
			/>
			<Sidebar.Inset class="overflow-hidden">
				<Header />
				<div
					class={"border bg-bw50 border-bw500 dark:bg-bw800 rounded-xl mb-4 mx-4 h-full overflow-auto tourcontent page " +
						` ${pagename().includes("entities") ? "px-4 py-5" : "px-[30px] py-7"}`}
				>
					{#if auth.isAuthenticated == true || auth.isAuthenticated == false}
						{@render children()}
					{/if}
				</div>
			</Sidebar.Inset>
		</Sidebar.Provider>
	</div>
{:else}
	{@render children()}
{/if}
<Toaster />

<style>
	:global(body) {
		overflow: hidden;
	}
	.page {
		display: flex;
		flex-direction: column;
		height: 100%;
		/* This ensures it fills the entire window height */
	}
</style>
