import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { auth } from '$lib/stores/auth.svelte';

let apikey = OPENAI_API_KEY;

if (process.env.OPENAI_API_KEY != null) {
    apikey = process.env.OPENAI_API_KEY;
}
// console.log("Using OpenAI API Key:", apikey.substring(0, 4) + '...');
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

    // Ensure package.json exists for Node.js projects
    if (selectedLanguage === "nodejs") {
        const packageJson = files.find(f => f.filename.toLowerCase() === "package.json");
        if (!packageJson) {
            files.push({
                filename: "package.json",
                content: JSON.stringify({
                    name: "hello-world-nodejs",
                    version: "1.0.0",
                    main: "main.js",
                    dependencies: {
                        express: "^4.17.1",
                        cors: "^2.8.5"
                    }
                }, null, 2)
            });
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

async function executeToolCall(
    toolCall: ToolCall,
    userToken: string,
    selectedLanguage: string,
    onProgress?: ProgressSender,
    workspaceId?: string
): Promise<{ success: boolean; result: string; packageId?: string }> {
    try {
        console.log(`Server: Executing tool call: ${toolCall.function.name}`);
        const args = JSON.parse(toolCall.function.arguments);
        
        if (toolCall.function.name === "deploypackage") {
            return await deployPackage(args, userToken, selectedLanguage, onProgress, workspaceId, toolCall.id);
        } else if (toolCall.function.name === "callpackagefunction") {
            return await callPackageFunction(args, userToken, onProgress);
        }
        
        console.log(`Server: Unknown tool: ${toolCall.function.name}`);
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
): Promise<{ success: boolean; result: string; packageId?: string }> {
    try {
        console.log('Server: Executing deployPackage tool with args:', args);
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        
        let files = args.files;
        if (!Array.isArray(files) || files.length < 3) {
            return { success: false, result: `Error: At least 3 files are required for deployment (Dockerfile, code file, and dependency file if needed). Got ${files ? files.length : 0}.` };
        }

        // Generate slug for the package
        const slug = "me-" + Math.random().toString(36).substring(2, 11) + "-you";
        const packageName = slug;

        console.log(`Server: Generated package name: ${packageName}`);

        onProgress?.({ message: 'Validating files', step: 'validate', progress: 10 });
        // Fix and validate files with the generated slug
        files = fixAndValidateFiles(files, slug, selectedLanguage);
        console.log(`Server: Fixed and validated ${files.length} files`);

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
        console.log(`Server: Created tgz buffer of size: ${tgzBuffer.byteLength} bytes`);

        // Upload the package archive to file store
        onProgress?.({ message: 'Uploading package', step: 'upload', progress: 40 });
        const fileid = await auth.client.UploadFile(
            'package.tgz',
            'application/gzip',
            tgzBuffer,
            userToken
        );
        console.log('Server: Uploaded package file with id:', fileid);

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
        console.log('Server: Package deployment completed successfully');
        onProgress?.({ message: 'Done', step: 'done', progress: 100 });
        return { 
            success: true, 
            result: JSON.stringify(payload, null, 2),
            packageId: llmpackage._id
        };

    } catch (error: any) {
        console.error('Server: Error in deployPackage:', error);
        return { success: false, result: `❌ Error deploying package: ${error.message}` };
    }
}

async function callPackageFunction(args: any, userToken: string, onProgress?: ProgressSender): Promise<{ success: boolean; result: string }> {
    try {
        console.log('Server: Executing callPackageFunction tool with args:', args);
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        
        const { packageId, functionName, urlParameters, Method = 'GET', Body } = args;
        
        if (!packageId) {
            return { success: false, result: '❌ Error: packageId is required' };
        }

        onProgress?.({ message: 'Resolving service endpoint', step: 'resolve', progress: 15 });
        // Lookup package to resolve slug/domain
        const llmpackage = await auth.client.FindOne<any>({
            collectionname: 'agents',
            query: { _id: packageId },
            jwt: userToken
        });
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

        console.log('Server: Function call completed successfully');
        onProgress?.({ message: 'Done', step: 'done', progress: 100 });
        return { success: response.ok, result: JSON.stringify(payload, null, 2) };

    } catch (error: any) {
        console.error('Server: Error in callPackageFunction:', error);
        return { success: false, result: `❌ Error calling package function: ${error.message}` };
    }
}

export const POST = async ({ request }) => {
    const { messages, tools, stream, selectedLanguage, workspaceId } = await request.json();
    let autheader = request.headers.get('authorization');
    let userToken = '';
    
    if (autheader) {
        let token = autheader.split(' ')[1];
        if (token && token.length > 10 && token !== apikey) {
            userToken = token;
            // console.log("access token: " + token.substring(0,4) + '...');
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
                    console.log('Starting stream processing...');

                    for await (const chunk of streamCompletion) {
                        console.log('Received chunk:', JSON.stringify(chunk));
                        const delta = chunk.choices?.[0]?.delta;

                        // Handle text content
                        if (delta?.content) {
                            console.log('Sending content:', delta.content);
                            // Send each chunk of content on a new line
                            controller.enqueue(encoder.encode(delta.content));
                        }

                        // Handle tool calls - accumulate them
                        if (delta?.tool_calls) {
                            console.log('Received tool calls delta:', delta.tool_calls);
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
                                            accumulatedToolCalls[toolCall.index].function.name += toolCall.function.name;
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
                            console.log('Stream finished, reason:', chunk.choices[0].finish_reason);
                            
                            // Execute tools on server if we have any
                            if (accumulatedToolCalls.length > 0) {
                                const validToolCalls = accumulatedToolCalls.filter(tc => tc && tc.function?.name);
                                console.log('Executing tools on server:', validToolCalls);
                                
                                // First, send the tool calls to the client so it can show them in the UI
                                if (validToolCalls.length > 0) {
                                    controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                        tool_calls: validToolCalls
                                    }) + '\n'));
                                }
                                
                                // Execute each tool call
                                for (const toolCall of validToolCalls) {
                                    try {
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

                                        const result = await executeToolCall(
                                            toolCall,
                                            userToken,
                                            selectedLanguage || 'nodejs',
                                            sendProgress,
                                            workspaceId
                                        );
                                        
                                        // Send tool execution result
                                        const toolResult = {
                                            tool_call_id: toolCall.id,
                                            name: toolCall.function.name,
                                            // Do not send final JSON payload in result to avoid cluttering UI
                                            result: '',
                                            success: result.success,
                                            packageId: result.packageId
                                        };
                                        
                                        controller.enqueue(encoder.encode('\n' + JSON.stringify({
                                            tool_result: toolResult
                                        }) + '\n'));
                                        
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
        return new Response(JSON.stringify(completion), {
            headers: {
                'content-type': 'application/json'
            }
        });
    }
};
