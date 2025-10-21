import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { auth } from '$lib/stores/auth.svelte';

let apikey = OPENAI_API_KEY;

if (process.env.OPENAI_API_KEY != null) {
    apikey = process.env.OPENAI_API_KEY;
}
const openai = new OpenAI({ apiKey: apikey });

// Import tar utilities
// For packaging files like in create-tgz route
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import * as tar from 'tar';

// Server-side tool execution functions
interface ToolCall {
    id: string;
    type: string;
    function: {
        name: string;
        arguments: string;
    };
}

interface FileInput {
    filename: string;
    content: string;
}

// Fix and validate files for deployment
function fixAndValidateFiles(files: FileInput[], slug: string, selectedLanguage: string): FileInput[] {
    // Fix Dockerfile first
    const dockerfile = files.find(f => f.filename.toLowerCase() === "dockerfile");
    if (dockerfile) {
        // Replace the entire Dockerfile content with the correct format based on language
        if (selectedLanguage === "nodejs") {
            dockerfile.content = `FROM node22:latest\nCOPY . .\nLABEL image="${slug}"\nRUN npm install\nENTRYPOINT ["node", "/main.js"]`;
        } else if (selectedLanguage === "python") {
            dockerfile.content = `FROM python:latest\nLABEL image="${slug}"\nCOPY . .\nRUN pip install -t . -r requirements.txt\nENTRYPOINT ["python", "/main.py"]`;
        } else if (selectedLanguage === "php") {
            dockerfile.content = `FROM php:latest\nLABEL image="${slug}"\nCOPY . .\nRUN composer install\nENTRYPOINT ["php", "-S", "0.0.0.0:3000", "-t", "public"]`;
        }
    }

    // Node.js: ensure an entrypoint exists but do NOT modify provided code; package.json is optional
    if (selectedLanguage === "nodejs") {
        const hasMain = files.some(f => f.filename.toLowerCase() === 'main.js');
        if (!hasMain) {
            const defaultHttpServer = `const http = require('http');
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Node.js!');
});

server.listen(PORT, '0.0.0.0', () => console.log('Server listening on ' + PORT));
`;
            files.push({ filename: 'main.js', content: defaultHttpServer });
        }
    }

    // Ensure requirements.txt exists for Python projects
    if (selectedLanguage === "python") {
        const requirementsTxt = files.find(f => f.filename.toLowerCase() === "requirements.txt");
        if (!requirementsTxt) {
            files.push({
                filename: "requirements.txt",
                content: "flask\nflask-cors"
            });
        }
    }

    // Ensure composer.json exists for PHP projects
    if (selectedLanguage === "php") {
        const composerJson = files.find(f => f.filename.toLowerCase() === "composer.json");
        if (!composerJson) {
            files.push({
                filename: "composer.json",
                content: JSON.stringify({
                    require: {
                        "slim/slim": "^4.0",
                        "nyholm/psr7": "^1.4",
                        "nyholm/psr7-server": "^1.0",
                        "http-interop/http-factory-guzzle": "^1.2"
                    }
                }, null, 2)
            });
        }
    }

    return files;
}

type ToolProgress = {
    message: string;
    step?: string;
    progress?: number; // 0-100
};

type ProgressSender = (update: ToolProgress) => void;

function sanitizeCallPackageArgs(argsStr: string | undefined, lastPackageId?: string): string | undefined {
    if (!argsStr) return argsStr;
    try {
        const obj = JSON.parse(argsStr);
        const pid = obj?.packageId;
        const looksPlaceholder = typeof pid === 'string' && /[<>]/.test(pid);
        if ((!pid || looksPlaceholder) && lastPackageId) {
            obj.packageId = lastPackageId;
            return JSON.stringify(obj);
        }
        return argsStr;
    } catch {
        return argsStr;
    }
}

async function executeToolCall(
    toolCall: ToolCall,
    userToken: string,
    selectedLanguage: string,
    onProgress?: ProgressSender,
    workspaceId?: string
): Promise<{ success: boolean; result: string; packageId?: string; endpoint?: string }> {
    try {
        const args = JSON.parse(toolCall.function.arguments);
        
        if (toolCall.function.name === "deploypackage") {
            return await deployPackage(args, userToken, selectedLanguage, onProgress, workspaceId, toolCall.id);
        } else if (toolCall.function.name === "callpackagefunction") {
            return await callPackageFunction(args, userToken, onProgress);
        }
        
        return { success: false, result: `❌ Unknown tool: ${toolCall.function.name}` };
    } catch (error: any) {
        console.error('Server: Error executing tool call:', error);
        return { success: false, result: `❌ Error executing tool: ${error.message}` };
    }
}

async function deployPackage(
    args: any,
    userToken: string,
    selectedLanguage: string,
    onProgress?: ProgressSender,
    workspaceId?: string,
    correlationId?: string
): Promise<{ success: boolean; result: string; packageId?: string; endpoint?: string }> {
    try {
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        // Normalize input
        let files: FileInput[] = Array.isArray(args.files) ? args.files : [];

        // Generate slug for the package early (needed by fix step)
        const slug = "me-" + Math.random().toString(36).substring(2, 11) + "-you";
        const packageName = slug;

        onProgress?.({ message: 'Validating files', step: 'validate', progress: 10 });
        // Attempt to fix and complete required files first
        files = fixAndValidateFiles(files, slug, selectedLanguage);

        // Post-fix validation of required files per language
        const names = files.map(f => f.filename.toLowerCase());
        const missing: string[] = [];
        if (!names.includes('dockerfile')) missing.push('Dockerfile');
        if (selectedLanguage === 'nodejs') {
            if (!names.includes('main.js')) missing.push('main.js');
            if (!names.includes('package.json')) missing.push('package.json');
        } else if (selectedLanguage === 'python') {
            if (!names.includes('main.py')) missing.push('main.py');
            if (!names.includes('requirements.txt')) missing.push('requirements.txt');
        } else if (selectedLanguage === 'php') {
            if (!names.includes('index.php')) missing.push('index.php');
            if (!names.includes('composer.json')) missing.push('composer.json');
        }
        if (missing.length > 0) {
            return { success: false, result: `Error: Missing required files: ${missing.join(', ')}` };
        }

        onProgress?.({ message: 'Creating package archive', step: 'archive', progress: 25 });
        // Create a .tgz in tmp (same logic as /api/create-tgz)
        const tmp = join(tmpdir(), `tgz-${randomUUID()}`);
        mkdirSync(tmp, { recursive: true });
        for (const file of files) {
            const filePath = join(tmp, file.filename);
            mkdirSync(dirname(filePath), { recursive: true });
            writeFileSync(filePath, file.content);
        }
        const tgzPath = tmp + '.tgz';
        await tar.c({ gzip: true, file: tgzPath, cwd: tmp }, files.map((f: any) => f.filename));
        const tgzBuffer = readFileSync(tgzPath);
        rmSync(tmp, { recursive: true, force: true });

        // Upload the package archive to file store
        onProgress?.({ message: 'Uploading package', step: 'upload', progress: 40 });
        const fileid = await auth.client.UploadFile(
            'package.tgz',
            'application/gzip',
            tgzBuffer,
            userToken
        );

        // Resolve workspace
        let workspace: any = null;
        if (workspaceId) {
            try {
                workspace = await auth.client.FindOne<any>({
                    collectionname: 'users',
                    query: { _id: workspaceId },
                    jwt: userToken
                });
            } catch (e) {
                console.warn('Workspace lookup failed:', e);
            }
        }

        onProgress?.({ message: 'Registering package', step: 'register', progress: 55 });
        // Create or update package record
        let llmpackage = await auth.client.FindOne<any>({
            collectionname: 'agents',
            query: { name: packageName, _type: 'package' },
            jwt: userToken
        });
        if (!llmpackage) {
            const acl: any[] = [
                { rights: 65535, _id: '5a1702fa245d9013697656fb', name: 'admins' }
            ];
            if (workspace && workspace.users) {
                acl.push({ _id: workspace.users, name: (workspace.name || 'workspace') + ' users', rights: 65535 });
                acl.push({ _id: workspace.users, name: (workspace.name || 'workspace') + ' users', rights: 65535 });
            }
            llmpackage = await auth.client.InsertOne({
                collectionname: 'agents',
                item: {
                    name: packageName,
                    language: selectedLanguage,
                    daemon: true,
                    chromium: false,
                    fileid,
                    _type: 'package',
                    _acl: acl
                },
                jwt: userToken
            });
        } else {
            const oldfileid = llmpackage.fileid;
            llmpackage.fileid = fileid;
            await auth.client.UpdateOne({ collectionname: 'agents', item: llmpackage, jwt: userToken });
            try {
                await auth.client.DeleteOne({ collectionname: 'fs.files', id: oldfileid, jwt: userToken });
            } catch {}
        }

        // Trigger serverless builder and stream logs
        onProgress?.({ message: 'Triggering build', step: 'build', progress: 70 });
        const queuename = await auth.client.RegisterQueue(
            { queuename: '', jwt: userToken },
            (_msg: any, payload: any) => {
                if (payload?.logs) {
                    const logs: string = payload.logs.endsWith('\n') ? payload.logs : payload.logs + '\n';
                    onProgress?.({ message: logs });
                }
            }
        );
        const correlation_id = correlationId || Math.random().toString(36).substring(2, 11);
        let buildTime: number | undefined = undefined;
        try {
            const workspaceid = workspace?._id || workspaceId;
            const build_result = await auth.client.QueueMessage(
                {
                    queuename: 'sfbuilder',
                    data: {
                        command: 'build',
                        packageid: llmpackage._id,
                        fileid: llmpackage.fileid,
                        name: packageName,
                        workspaceid,
                        anonymous: true,
                        correlation_id,
                        queuename
                    },
                    jwt: userToken
                },
                true
            );
            if (build_result?.success === false) {
                return { success: false, result: `Error Building package: ${build_result.result}` };
            }
            if (build_result?.timetaken != null) {
                buildTime = build_result.timetaken;
            }
            onProgress?.({ message: `Image built successfully in ${build_result?.timetaken} seconds`, step: 'deploy', progress: 90 });
        } finally {
            try { await auth.client.UnRegisterQueue({ queuename, jwt: userToken }); } catch {}
        }

        onProgress?.({ message: 'Deploying function', step: 'deploy', progress: 95 });

        onProgress?.({ message: 'Finalizing', step: 'finalize', progress: 95 });

        // Build a concise JSON payload (no canned text)
        let domain = auth.config?.serverless_domain_schema?.replace('$slug$', llmpackage?.slug || packageName);
        if (auth.config?.serverless_domain_schema?.includes('.localhost.')) {
            domain = `http://${domain}`;
        } else if (domain && !domain.startsWith('http')) {
            domain = `https://${domain}`;
        }

        const payload = {
            packageId: llmpackage._id,
            name: packageName,
            filesProcessed: files.length,
            files: files.map((f: any) => f.filename),
            build: {
                success: true,
                timetaken: buildTime
            },
            functionUrl: domain || undefined
        } as any;
        onProgress?.({ message: 'Done', step: 'done', progress: 100 });
        return { 
            success: true, 
            result: JSON.stringify(payload, null, 2),
            packageId: llmpackage._id,
            endpoint: (domain?.endsWith('/') ? domain : domain + '/')
        };

    } catch (error: any) {
        console.error('Server: Error in deployPackage:', error);
        return { success: false, result: `❌ Error deploying package: ${error.message}` };
    }
}

async function callPackageFunction(args: any, userToken: string, onProgress?: ProgressSender): Promise<{ success: boolean; result: string; endpoint?: string }> {
    try {
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        
        const { packageId, functionName, urlParameters, Method = 'GET', Body } = args;
        
        // Validate packageId presence and avoid placeholder values
        if (!packageId) {
            return { success: false, result: '❌ Error: packageId is required' };
        }
        if (typeof packageId !== 'string' || /[<>]/.test(packageId)) {
            return { success: false, result: `❌ Error: Invalid packageId '${String(packageId)}'. Use the real packageId returned by deploypackage.` };
        }

        onProgress?.({ message: 'Resolving service endpoint', step: 'resolve', progress: 15 });
        // Lookup package to resolve slug/domain
        const llmpackage = await auth.client.FindOne<any>({
            collectionname: 'agents',
            query: { _id: packageId },
            jwt: userToken
        });
        if (!llmpackage && (!packageId || /[<>]/.test(packageId))) {
            return { success: false, result: `❌ Error: Invalid or placeholder packageId '${String(packageId)}'.` };
        }
        let slug = llmpackage?.slug || llmpackage?.name || packageId;
        // Build domain from config
        let domain = auth.config?.serverless_domain_schema?.replace('$slug$', slug);
        if (!domain) {
            domain = `faas.openiap.io/${slug}`;
        }
        if (auth.config?.serverless_domain_schema?.includes('.localhost.')) {
            domain = `http://${domain}`;
        } else if (!domain.startsWith('http')) {
            domain = `https://${domain}`;
        }
        const cleanParams = (urlParameters || '').toString().replace(/^\?/, '');
        const targetUrl = cleanParams ? `${domain}/?${cleanParams}` : `${domain}/`;
        onProgress?.({ message: `Calling ${targetUrl}`, step: 'request', progress: 40 });

        // Perform request with basic retry similar to proxy-function
        const method = Method || 'GET';
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (method !== 'GET' && Body) {
            options.body = typeof Body === 'string' ? Body : JSON.stringify(Body);
        }
        let response: Response | null = null;
        for (let attempt = 0; attempt < 6; attempt++) {
            try {
                response = await fetch(targetUrl, options);
                if (response.status === 502) {
                    onProgress?.({ message: `Bad Gateway (502), retrying...`, step: 'retry', progress: 60 });
                    await sleep(2000);
                    continue;
                }
                break;
            } catch (e) {
                if (attempt < 5) {
                    onProgress?.({ message: `Request error, retrying...`, step: 'retry', progress: 60 });
                    await sleep(2000);
                    continue;
                }
                throw e;
            }
        }
        if (!response) {
            return { success: false, result: '❌ No response received' };
        }
        onProgress?.({ message: 'Waiting for response', step: 'wait', progress: 65 });
        const contentType = response.headers.get('content-type') || '';
        let data: any;
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        onProgress?.({ message: 'Parsing response', step: 'parse', progress: 85 });

        // Do not overwrite with a hard-coded string; return actual response payload
        const payload = {
            packageId,
            function: functionName || 'main',
            url: targetUrl,
            method,
            status: response.status,
            statusText: response.statusText,
            data
        };

        onProgress?.({ message: 'Done', step: 'done', progress: 100 });
        return { success: response.ok, result: JSON.stringify(payload, null, 2), endpoint: targetUrl };

    } catch (error: any) {
        console.error('Server: Error in callPackageFunction:', error);
        return { success: false, result: `❌ Error calling package function: ${error.message}` };
    }
}

export const POST = async ({ request }) => {
    const body = await request.json();
    const { messages, tools, stream, selectedLanguage, workspaceId } = body || {};
    let autheader = request.headers.get('authorization');
    let userToken = '';
    
    if (autheader) {
        let token = autheader.split(' ')[1];
        if (token && token.length > 10 && token !== apikey) {
            userToken = token;
        }
    }

    // Direct tool re-run endpoint (used by client Retry button)
    if (body?.rerunTool && body?.rerunTool?.name) {
        try {
            const toolName: string = body.rerunTool.name;
            const toolArgs: any = body.rerunTool.arguments || {};
            const toolId: string = body.rerunTool.id || ('retry_' + Math.random().toString(36).substring(2,11));
            const syntheticToolCall = {
                id: toolId,
                type: 'function',
                function: {
                    name: toolName,
                    arguments: typeof toolArgs === 'string' ? toolArgs : JSON.stringify(toolArgs)
                }
            } as any;

            const result = await executeToolCall(
                syntheticToolCall,
                userToken,
                selectedLanguage || 'nodejs',
                undefined,
                workspaceId
            );

            // Build concise display result consistent with streaming UI
            let displayResult = '';
            try {
                const raw = result.result || '';
                const MAX_LEN = 2000;
                const nameLower = (toolName || '').toLowerCase();
                if (nameLower === 'callpackagefunction') {
                    try {
                        const parsed = JSON.parse(raw);
                        const status = parsed?.status;
                        const statusText = parsed?.statusText || '';
                        const data = parsed?.data;
                        let bodySnippet = '';
                        if (typeof data === 'string') {
                            bodySnippet = data;
                        } else if (data != null) {
                            const s = JSON.stringify(data);
                            bodySnippet = 'Body: ' + s;
                        }
                        displayResult = `status ${status ?? ''} ${statusText} — ${bodySnippet}`.trim();
                    } catch {
                        displayResult = raw;
                    }
                } else if (nameLower === 'deploypackage') {
                    const parts: string[] = [];
                    if (result.endpoint) parts.push(`Endpoint: ${result.endpoint}`);
                    if (result.packageId) parts.push(`Package: ${result.packageId}`);
                    displayResult = parts.join('  ');
                } else {
                    displayResult = raw;
                }
                if (displayResult && (displayResult.trim().startsWith('{') || displayResult.trim().startsWith('['))) {
                    displayResult = 'Result: ' + displayResult;
                }
                if (displayResult.length > MAX_LEN) {
                    displayResult = displayResult.slice(0, MAX_LEN) + `\n... (${displayResult.length - MAX_LEN} more chars)`;
                }
            } catch {}

            const payload = {
                tool_result: {
                    tool_call_id: toolId,
                    name: toolName,
                    result: displayResult,
                    success: result.success,
                    packageId: result.packageId,
                    endpoint: result.endpoint
                }
            };
            return new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' } });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e?.message || 'Failed to run tool' }), { status: 500, headers: { 'content-type': 'application/json' } });
        }
    }

    // Prepare OpenAI request
    const openaiRequest: any = {
        model: 'gpt-4o-mini',
        messages,
        stream: stream || false
    };

    // Add tools if provided
    if (tools && tools.length > 0) {
        openaiRequest.tools = tools;
    }

    if (stream) {
        // For streaming, we need to explicitly set stream to true
        const streamCompletion = await openai.chat.completions.create({
            ...openaiRequest,
            stream: true
        }) as any; // Type assertion to handle the streaming response
        const encoder = new TextEncoder(); 
        
        const body = new ReadableStream<Uint8Array>({
            async start(controller) {
                try {
                    let accumulatedToolCalls: any[] = [];
                    // Stream assistant content immediately to preserve order
                    let initialHasToolCalls = false;

                    for await (const chunk of streamCompletion) {
                        const delta = chunk.choices?.[0]?.delta;

                        // Handle text content: stream immediately to client
                        if (delta?.content) {
                            controller.enqueue(encoder.encode(delta.content));
                        }

                        // Handle tool calls - accumulate them
                        if (delta?.tool_calls) {
                            initialHasToolCalls = true;
                            // Accumulate tool calls from multiple chunks
                            for (const toolCall of delta.tool_calls) {
                                if (toolCall.index !== undefined) {
                                    // Initialize or update the tool call at this index
                                    if (!accumulatedToolCalls[toolCall.index]) {
                                        accumulatedToolCalls[toolCall.index] = {
                                            id: toolCall.id || '',
                                            type: toolCall.type || 'function',
                                            function: {
                                                name: toolCall.function?.name || '',
                                                arguments: toolCall.function?.arguments || ''
                                            }
                                        };
                                    } else {
                                        // Append to existing tool call
                                        if (toolCall.function?.arguments) {
                                            accumulatedToolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
                                        }
                                        if (toolCall.function?.name) {
                                            // Overwrite name to avoid duplicates
                                            accumulatedToolCalls[toolCall.index].function.name = toolCall.function.name;
                                        }
                                        if (toolCall.id) {
                                            accumulatedToolCalls[toolCall.index].id = toolCall.id;
                                        }
                                    }
                                }
                            }
                        }

                        // Check if stream is done
                        if (chunk.choices?.[0]?.finish_reason) {
                            // Content was already streamed above; only handle tool calls here
                            
                            // Execute tools on server if we have any
                            if (accumulatedToolCalls.length > 0) {
                                const validToolCalls = accumulatedToolCalls.filter(tc => tc && tc.function?.name);
                                
                                // First, send the tool calls to the client so it can show them in the UI
                                if (validToolCalls.length > 0) {
                                    controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                        tool_calls: validToolCalls
                                    }) + '\n'));
                                }
                                
                                // Execute each tool call
                                const toolOutputsForOpenAI: Array<{ id: string; name: string; content: string }> = [];
                                let anyToolFailed = false;
                                const autoFollowupCalls: Array<{ packageId: string }> = [];
                                let lastDeployedPackageId: string | undefined = undefined;
                                for (const toolCall of validToolCalls) {
                                    try {
                                        // Short-circuit execution: if any earlier tool failed, skip remaining tool calls
                                        if (anyToolFailed) {
                                            const skippedResult = {
                                                tool_call_id: toolCall.id,
                                                name: toolCall.function.name,
                                                result: 'Skipped due to previous tool failure',
                                                success: false
                                            };
                                            controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                                tool_result: skippedResult
                                            }) + '\n'));
                                            continue;
                                        }
                                        // Provide a progress sender that streams updates to the client
                                        const sendProgress: ProgressSender = (update) => {
                                            try {
                                                controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                                    tool_progress: {
                                                        tool_call_id: toolCall.id,
                                                        name: toolCall.function.name,
                                                        ...update
                                                    }
                                                }) + '\n'));
                                            } catch (e) {
                                                console.error('Failed to send progress:', e);
                                            }
                                        };

                                        // If calling package function without a valid id, try to inject the last deployed id
                                        if ((toolCall.function?.name || '').toLowerCase() === 'callpackagefunction' && lastDeployedPackageId) {
                                            toolCall.function.arguments = sanitizeCallPackageArgs(toolCall.function.arguments, lastDeployedPackageId) || toolCall.function.arguments;
                                        }

                                        const result = await executeToolCall(
                                            toolCall,
                                            userToken,
                                            selectedLanguage || 'nodejs',
                                            sendProgress,
                                            workspaceId
                                        );
                                        
                                        // Prepare a concise display result for UI
                                        let displayResult = '';
                                        try {
                                            const raw = result.result || '';
                                            const MAX_LEN = 2000;
                                            const nameLower = (toolCall.function?.name || '').toLowerCase();

                                            // Special formatting for callpackagefunction: extract status and response body
                                            if (nameLower === 'callpackagefunction') {
                                                try {
                                                    const parsed = JSON.parse(raw);
                                                    const status = parsed?.status;
                                                    const statusText = parsed?.statusText || '';
                                                    const data = parsed?.data;
                                                    let bodySnippet = '';
                                                    if (typeof data === 'string') {
                                                        bodySnippet = data;
                                                    } else if (data != null) {
                                                        const s = JSON.stringify(data);
                                                        bodySnippet = 'Body: ' + s;
                                                    }
                                                    displayResult = `status ${status ?? ''} ${statusText} — ${bodySnippet}`.trim();
                                                } catch {
                                                    displayResult = raw;
                                                }
                                            } else if (nameLower === 'deploypackage') {
                                                // Do NOT include the full payload JSON. Provide a concise summary.
                                                const parts: string[] = [];
                                                if (result.endpoint) parts.push(`Endpoint: ${result.endpoint}`);
                                                if (result.packageId) parts.push(`Package: ${result.packageId}`);
                                                displayResult = parts.join('  ');
                                            } else {
                                                displayResult = raw;
                                            }

                                            // Ensure it doesn't start with JSON braces to avoid client filtering
                                            if (displayResult && (displayResult.trim().startsWith('{') || displayResult.trim().startsWith('['))) {
                                                displayResult = 'Result: ' + displayResult;
                                            }

                                            // Cap overly large payloads to keep UI snappy
                                            if (displayResult.length > MAX_LEN) {
                                                displayResult = displayResult.slice(0, MAX_LEN) + `\n... (${displayResult.length - MAX_LEN} more chars)`;
                                            }
                                        } catch {}

                                        // Send tool execution result (include concise result so UI can show it)
                                        const toolResult = {
                                            tool_call_id: toolCall.id,
                                            name: toolCall.function.name,
                                            result: displayResult,
                                            success: result.success,
                                            packageId: result.packageId,
                                            endpoint: result.endpoint
                                        };

                                        // Accumulate full result for OpenAI follow-up
                                        toolOutputsForOpenAI.push({
                                            id: toolCall.id,
                                            name: toolCall.function.name,
                                            content: result.result || ''
                                        });
                                        
                                        controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                            tool_result: toolResult
                                        }) + '\n'));

                                        // Queue an automatic function call if this was a successful deploy
                                        if ((toolCall.function?.name || '').toLowerCase() === 'deploypackage' && result.success && result.packageId) {
                                            autoFollowupCalls.push({ packageId: result.packageId });
                                            lastDeployedPackageId = result.packageId;
                                        }
                                        if (!result.success) {
                                            anyToolFailed = true;
                                        }

                                    } catch (error: any) {
                                        console.error('Error executing tool:', error);
                                        const errorResult = {
                                            tool_call_id: toolCall.id,
                                            name: toolCall.function.name,
                                            result: `Error: ${error.message}`,
                                            success: false
                                        };
                                        
                                        controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                            tool_result: errorResult
                                        }) + '\n'));
                                        anyToolFailed = true;
                                    }
                                    // If the tool succeeded flag is available, update failure state
                                    // Note: success is conveyed via tool_result above as well
                                    // We consider any non-success result as failure
                                    // success state captured via result.success in displayResult branch above
                                    // but explicit failure handled in catch.
                                }

                                // Defer any automatic follow-up to after we check the model's next tool_calls

                                // After all tools complete, send their results back to OpenAI
                                if (!anyToolFailed) {
                                try {
                                    const assistantToolMessage = {
                                        role: 'assistant' as const,
                                        content: null,
                                        tool_calls: validToolCalls.map(tc => ({
                                            id: tc.id,
                                            type: 'function',
                                            function: {
                                                name: tc.function.name,
                                                arguments: tc.function.arguments
                                            }
                                        }))
                                    };

                                    const toolMessages = toolOutputsForOpenAI.map(o => ({
                                        role: 'tool' as const,
                                        tool_call_id: o.id,
                                        name: o.name,
                                        content: o.content
                                    }));

                                    const followupMessages = [
                                        ...messages,
                                        assistantToolMessage,
                                        ...toolMessages
                                    ];

                                    const followupStream = await openai.chat.completions.create({
                                        model: openaiRequest.model,
                                        messages: followupMessages,
                                        stream: true
                                    }) as any;

                                    const followAccumulatedToolCalls: any[] = [];
                                    // Stream follow-up assistant content immediately as well
                                    let followupHasToolCalls = false;
                                    for await (const fchunk of followupStream) {
                                        const fdelta = fchunk.choices?.[0]?.delta;
                                        if (fdelta?.content) {
                                            controller.enqueue(encoder.encode(fdelta.content));
                                        }
                                        if (fdelta?.tool_calls) {
                                            followupHasToolCalls = true;
                                            // Accumulate only; do not emit partial tool_calls yet
                                            for (const t of fdelta.tool_calls) {
                                                if (t.index !== undefined) {
                                                    if (!followAccumulatedToolCalls[t.index]) {
                                                        followAccumulatedToolCalls[t.index] = {
                                                            id: t.id || '',
                                                            type: t.type || 'function',
                                                            function: {
                                                                name: t.function?.name || '',
                                                                arguments: t.function?.arguments || ''
                                                            }
                                                        };
                                                    } else {
                                                        if (t.function?.arguments) {
                                                            followAccumulatedToolCalls[t.index].function.arguments += t.function.arguments;
                                                        }
                                                        if (t.function?.name) {
                                                            // Overwrite to avoid duplicated names
                                                            followAccumulatedToolCalls[t.index].function.name = t.function.name;
                                                        }
                                                        if (t.id) {
                                                            followAccumulatedToolCalls[t.index].id = t.id;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    const nextToolCalls = followAccumulatedToolCalls.filter((tc: any) => tc && tc.function?.name);
                                    if (nextToolCalls.length > 0) {
                                        // Surface the complete tool calls to the client
                                        controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                            tool_calls: nextToolCalls
                                        }) + '\n'));

                                        const secondToolOutputs: Array<{ id: string; name: string; content: string }> = [];
                                        let followAnyFailed = false;
                                        let lastDeployedPackageId2: string | undefined = undefined;
                                        for (const toolCall of nextToolCalls as any[]) {
                                            try {
                                                if (followAnyFailed) {
                                                    const skippedResult = {
                                                        tool_call_id: toolCall.id,
                                                        name: toolCall.function.name,
                                                        result: 'Skipped due to previous tool failure',
                                                        success: false
                                                    };
                                                    controller.enqueue(encoder.encode('\n' + JSON.stringify({ tool_result: skippedResult }) + '\n'));
                                                    continue;
                                                }
                                                const sendProgress: ProgressSender = (update) => {
                                                    try {
                                                        controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                                            tool_progress: {
                                                                tool_call_id: toolCall.id,
                                                                name: toolCall.function.name,
                                                                ...update
                                                            }
                                                        }) + '\n'));
                                                    } catch (e) {
                                                        console.error('Failed to send progress (follow-up):', e);
                                                    }
                                                };
                                                // Attempt to inject last deployed id in follow-up tool calls
                                                if ((toolCall.function?.name || '').toLowerCase() === 'callpackagefunction' && lastDeployedPackageId2) {
                                                    toolCall.function.arguments = sanitizeCallPackageArgs(toolCall.function.arguments, lastDeployedPackageId2) || toolCall.function.arguments;
                                                }

                                                const result = await executeToolCall(
                                                    toolCall,
                                                    userToken,
                                                    selectedLanguage || 'nodejs',
                                                    sendProgress,
                                                    workspaceId
                                                );

                                                // Build concise display string
                                                let displayResult = '';
                                                try {
                                                    const raw = result.result || '';
                                                    const MAX_LEN = 2000;
                                                    const nameLower = (toolCall.function?.name || '').toLowerCase();
                                                    if (nameLower === 'callpackagefunction') {
                                                        try {
                                                            const parsed = JSON.parse(raw);
                                                            const status = parsed?.status;
                                                            const statusText = parsed?.statusText || '';
                                                            const data = parsed?.data;
                                                            let bodySnippet = '';
                                                            if (typeof data === 'string') {
                                                                bodySnippet = data;
                                                            } else if (data != null) {
                                                                const s = JSON.stringify(data);
                                                                bodySnippet = 'Body: ' + s;
                                                            }
                                                            displayResult = `status ${status ?? ''} ${statusText} — ${bodySnippet}`.trim();
                                                        } catch {
                                                            displayResult = raw;
                                                        }
                                                    } else if (nameLower === 'deploypackage') {
                                                        const parts: string[] = [];
                                                        if (result.endpoint) parts.push(`Endpoint: ${result.endpoint}`);
                                                        if (result.packageId) parts.push(`Package: ${result.packageId}`);
                                                        displayResult = parts.join('  ');
                                                    } else {
                                                        displayResult = raw;
                                                    }
                                                    if (displayResult && (displayResult.trim().startsWith('{') || displayResult.trim().startsWith('['))) {
                                                        displayResult = 'Result: ' + displayResult;
                                                    }
                                                    if (displayResult.length > MAX_LEN) {
                                                        displayResult = displayResult.slice(0, MAX_LEN) + `\n... (${displayResult.length - MAX_LEN} more chars)`;
                                                    }
                                                } catch {}

                                                controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                                    tool_result: {
                                                        tool_call_id: toolCall.id,
                                                        name: toolCall.function.name,
                                                        result: displayResult,
                                                        success: result.success,
                                                        packageId: result.packageId,
                                                        endpoint: result.endpoint
                                                    }
                                                }) + '\n'));

                                                secondToolOutputs.push({ id: toolCall.id, name: toolCall.function.name, content: result.result || '' });
                                                if ((toolCall.function?.name || '').toLowerCase() === 'deploypackage' && result.success && result.packageId) {
                                                    lastDeployedPackageId2 = result.packageId;
                                                }
                                                if (!result.success) {
                                                    followAnyFailed = true;
                                                }
                                            } catch (e: any) {
                                                controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                                    tool_result: {
                                                        tool_call_id: toolCall.id,
                                                        name: toolCall.function.name,
                                                        result: `Error: ${e?.message || 'Unknown error'}`,
                                                        success: false
                                                    }
                                                }) + '\n'));
                                                followAnyFailed = true;
                                            }
                                        }

                                        // Ask OpenAI for the final assistant message after second tools
                                        const assistantToolMessage2 = {
                                            role: 'assistant' as const,
                                            content: null,
                                            tool_calls: nextToolCalls.map(tc => ({
                                                id: tc.id,
                                                type: 'function',
                                                function: {
                                                    name: tc.function.name,
                                                    arguments: tc.function.arguments
                                                }
                                            }))
                                        };
                                        const toolMessages2 = secondToolOutputs.map(o => ({
                                            role: 'tool' as const,
                                            tool_call_id: o.id,
                                            name: o.name,
                                            content: o.content
                                        }));
                                        const finalMessages = [
                                            ...followupMessages,
                                            assistantToolMessage2,
                                            ...toolMessages2
                                        ];
                                        const finalStream = await openai.chat.completions.create({
                                            model: openaiRequest.model,
                                            messages: finalMessages,
                                            stream: true
                                        }) as any;
                                        // Stream assistant follow-up text to preserve event order
                                        for await (const chunk2 of finalStream) {
                                            const d2 = chunk2.choices?.[0]?.delta;
                                            if (d2?.content) {
                                                controller.enqueue(encoder.encode(d2.content));
                                            }
                                        }
                                    } else if (autoFollowupCalls.length > 0) {
                                        // No follow-up from model; proactively call the function once so UI sees the result
                                        for (const info of autoFollowupCalls) {
                                            const syntheticId = 'auto_call_' + Math.random().toString(36).substring(2, 11);
                                            const syntheticArgs = {
                                                packageId: info.packageId,
                                                functionName: 'main',
                                                Method: 'GET',
                                                urlParameters: ''
                                            };
                                            const syntheticToolCall = {
                                                id: syntheticId,
                                                type: 'function',
                                                function: {
                                                    name: 'callpackagefunction',
                                                    arguments: JSON.stringify(syntheticArgs)
                                                }
                                            } as any;
                                            // Advertise the tool call to UI
                                            controller.enqueue(encoder.encode('\n' + JSON.stringify({ tool_calls: [syntheticToolCall] }) + '\n'));
                                            // Execute it
                                            const sendProgress: ProgressSender = (update) => {
                                                try {
                                                    controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                                        tool_progress: {
                                                            tool_call_id: syntheticId,
                                                            name: 'callpackagefunction',
                                                            ...update
                                                        }
                                                    }) + '\n'));
                                            } catch {}
                                            };
                                            try {
                                                const result = await executeToolCall(
                                                    syntheticToolCall,
                                                    userToken,
                                                    selectedLanguage || 'nodejs',
                                                    sendProgress,
                                                    workspaceId
                                                );
                                                let displayResult = '';
                                                try {
                                                    const raw = result.result || '';
                                                    const MAX_LEN = 2000;
                                                    try {
                                                        const parsed = JSON.parse(raw);
                                                        const status = parsed?.status;
                                                        const statusText = parsed?.statusText || '';
                                                        const data = parsed?.data;
                                                        let bodySnippet = '';
                                                        if (typeof data === 'string') bodySnippet = data;
                                                        else if (data != null) bodySnippet = 'Body: ' + JSON.stringify(data);
                                                        displayResult = `status ${status ?? ''} ${statusText} — ${bodySnippet}`.trim();
                                                    } catch { displayResult = raw; }
                                                    if (displayResult.trim().startsWith('{') || displayResult.trim().startsWith('[')) displayResult = 'Result: ' + displayResult;
                                                    if (displayResult.length > MAX_LEN) displayResult = displayResult.slice(0, MAX_LEN) + `\n... (${displayResult.length - MAX_LEN} more chars)`;
                                                } catch {}
                                                controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                                    tool_result: {
                                                        tool_call_id: syntheticId,
                                                        name: 'callpackagefunction',
                                                        result: displayResult,
                                                        success: result.success,
                                                        packageId: info.packageId,
                                                        endpoint: result.endpoint
                                                    }
                                                }) + '\n'));
                                            } catch (e: any) {
                                                controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                                    tool_result: {
                                                        tool_call_id: syntheticId,
                                                        name: 'callpackagefunction',
                                                        result: `Error: ${e?.message || 'Unknown error'}`,
                                                        success: false
                                                    }
                                                }) + '\n'));
                                            }
                                        }
                                    }
                                } catch (followErr) {
                                    console.error('Error sending tool results to OpenAI:', followErr);
                                }
                                }
                            }
                            break;
                        }
                    }
                } catch (err) {
                    console.error('Stream error:', err);
                    controller.error(err);
                    return;
                }
                controller.close();
            }
        });

        return new Response(body, {
            headers: {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'no-cache',
                'x-no-compression': '1',
                'connection': 'keep-alive'
            }
        });
    } else {
        // Non-streaming response
        const completion = await openai.chat.completions.create({
            ...openaiRequest,
            stream: false
        });

        const choice = completion.choices?.[0];
        const toolCalls = choice?.message?.tool_calls as any[] | undefined;

        if (toolCalls && toolCalls.length > 0) {
            // Execute tools server-side
            const validToolCalls = toolCalls
                .map((tc: any) => ({
                    id: tc.id,
                    type: tc.type || 'function',
                    function: {
                        name: tc.function?.name,
                        arguments: tc.function?.arguments
                    }
                }))
                .filter((tc: any) => tc.function?.name);

            const toolOutputsForOpenAI: Array<{ id: string; name: string; content: string }> = [];
            let lastDeployedPackageId3: string | undefined = undefined;
            for (const toolCall of validToolCalls) {
                try {
                    if ((toolCall.function?.name || '').toLowerCase() === 'callpackagefunction' && lastDeployedPackageId3) {
                        toolCall.function.arguments = sanitizeCallPackageArgs(toolCall.function.arguments, lastDeployedPackageId3) || toolCall.function.arguments;
                    }
                    const result = await executeToolCall(
                        toolCall as any,
                        userToken,
                        selectedLanguage || 'nodejs',
                        undefined,
                        workspaceId
                    );
                    toolOutputsForOpenAI.push({
                        id: toolCall.id,
                        name: toolCall.function.name,
                        content: result.result || ''
                    });
                    if ((toolCall.function?.name || '').toLowerCase() === 'deploypackage' && result.success && result.packageId) {
                        lastDeployedPackageId3 = result.packageId;
                    }
                } catch (e: any) {
                    toolOutputsForOpenAI.push({
                        id: toolCall.id,
                        name: toolCall.function.name,
                        content: `Error: ${e?.message || 'Unknown error'}`
                    });
                }
            }

            // Send results back to OpenAI and return the follow-up
            const assistantToolMessage = {
                role: 'assistant' as const,
                content: null,
                tool_calls: validToolCalls.map(tc => ({
                    id: tc.id,
                    type: 'function',
                    function: {
                        name: tc.function.name,
                        arguments: tc.function.arguments
                    }
                }))
            };
            const toolMessages = toolOutputsForOpenAI.map(o => ({
                role: 'tool' as const,
                tool_call_id: o.id,
                name: o.name,
                content: o.content
            }));
            const followupMessages = [
                ...messages,
                assistantToolMessage,
                ...toolMessages
            ];

            const followup = await openai.chat.completions.create({
                model: openaiRequest.model,
                messages: followupMessages,
                stream: false
            });
            return new Response(JSON.stringify(followup), {
                headers: { 'content-type': 'application/json' }
            });
        }

        // No tool calls; return first completion
        return new Response(JSON.stringify(completion), {
            headers: {
                'content-type': 'application/json'
            }
        });
    }
};
