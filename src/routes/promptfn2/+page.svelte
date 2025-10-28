<script lang="ts">
  import { base } from "$app/paths";
  import { auth } from "$lib/stores/auth.svelte";
  import { usersettings } from "$lib/stores/usersettings.svelte";
  import type { ChatCompletionTool } from "openai/resources/index.mjs";
  import { toast } from "svelte-sonner";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomInput } from "$lib/custominput";
  import { CustomSelect } from "$lib/customselect";
  import { Avatar, AvatarFallback } from "$lib/components/ui/avatar";
  import { Separator } from "$lib/components/ui/separator";
  import { ArrowUp, Bot, Plus, User } from "lucide-svelte";
  import { tick } from "svelte";
  import { AnsiUp } from "ansi_up";

  type LanguageKey = "nodejs" | "python" | "php";
  
  interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, any>;
    result?: any;
    status: "pending" | "running" | "completed" | "failed";
    endpoint?: string;
  }

  interface Message {
    name?: string;
    id: string;
    tool_call_id?: string;
    content: string | null;
    role: MessageType;
    timestamp: Date;
    toolCalls?: ToolCall[];
  }

  type MessageType =
    | "developer"
    | "user"
    | "assistant"
    | "role"
    | "tool"
    | "tool-request"
    | "tool-response";

  function generateId() {
    return Math.random().toString(36).substring(2, 11);
  }

  let { data } = $props();
  let userInput = $state("");
  let isProcessing = $state(false);
  let messages: Message[] = $state([]);
  let abort: AbortController | null = null;
  let selectedLanguage: LanguageKey = $state("nodejs");
  let currentPackageId = $state("");
  const ansi = new AnsiUp();


  // Language options for CustomSelect
  const languageOptions = [
    { value: "nodejs", label: "Node.js" },
    { value: "python", label: "Python" },
    { value: "php", label: "PHP" }
  ];

  // Starter suggestions for each language
  const starter_suggestions_all: Record<LanguageKey, string[]> = {
    nodejs: [
      "Create a hello world function",
      "Create a simple calculator function that adds two numbers",
      "Create a function that generates a random number between 1 and 100",
      "Create a function that calls https://api.chucknorris.io/ and returns a random joke",
    ],
    python: [
      "Create a hello world function",
      "Create a simple calculator function that adds two numbers",
      "Create a function that generates a random number between 1 and 100",
      "Create a function that calls https://api.chucknorris.io/ and returns a random joke",
    ],
    php: [
      "Create a hello world function",
      "Create a simple calculator function that adds two numbers",
      "Create a function that generates a random number between 1 and 100",
      "Create a function that calls https://api.chucknorris.io/ and returns a random joke",
    ],
  };

  let starter_suggestions = $state(starter_suggestions_all.nodejs);

  // Helper functions
  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "running":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  }

  async function focusInput() {
    await tick();
    let ref = document.getElementById("userinput") as HTMLInputElement;
    if (ref) {
      ref.focus();
    }
  }

  // Initialize messages with system message
  $effect(() => {
    if (messages.length === 0) {
      messages = [systemmessages[selectedLanguage]];
    }
  });

  // Update starter suggestions when language changes
  $effect(() => {
    starter_suggestions = starter_suggestions_all[selectedLanguage];
  });

  // When language changes, reset systemmessage 
  $effect(() => {
    if (selectedLanguage) {
      if (messages.length === 0) {
        messages = [systemmessages[selectedLanguage]];
      } else if (
        messages[0].role === "developer" &&
        messages[0].content !== systemmessages[selectedLanguage].content
      ) {
        messages[0] = { ...systemmessages[selectedLanguage] };
      }
    }
  });

  // Auto-scroll effect
  $effect(() => {
    messages;
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const chatContainer = document.getElementById("chatcontainer");
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    }
  });

  // Function to open URL from tool result
  function openurl(toolCall: any) {
    // Prefer server-provided endpoint from tool_result
    let url = toolCall?.endpoint || "";
    if (!url) {
      // Fallback: construct from packageId, but this may not match local schema
      if (currentPackageId) {
        url = `https://faas.openiap.io/${currentPackageId}/`;
      }
    }
    // Append URL parameters if provided
    if (url && toolCall?.arguments && toolCall.arguments.urlParameters) {
      const qp = toolCall.arguments.urlParameters.toString();
      url = url.endsWith('/') ? url.slice(0, -1) : url;
      url = qp.startsWith('?') ? `${url}/${qp}` : `${url}/?${qp}`;
    }
    if (url) window.open(url, "_blank");
  }

  
  // System messages for different languages
  const systemmessages: Record<LanguageKey, Message> = {
    nodejs: {
      id: generateId(),
      timestamp: new Date(),
      toolCalls: [],
      role: "developer",
      content: `# FaaS Package Creation - Node.js

You are an expert assistant for OpenIAP's FaaS platform.

## What you MUST do

- **ALWAYS use the deploypackage tool to deploy files.**
- **ALWAYS include ALL files needed to build and run the function as a webserver on port 3000 in a SINGLE deploypackage tool call.**
- **NEVER split files into multiple tool calls.**
- You MUST include:
  - Dockerfile (with correct FROM, COPY, ENTRYPOINT)
  - The actual code file (main.js) with a webserver on port 3000
  - package.json (optional when using built-in http)

## ABSOLUTE RULES

- **You MUST call the deploypackage tool ONCE and include ALL files in the "files" array.**
- **NEVER call deploypackage more than once.**
- **NEVER call deploypackage with only one file at a time.**
- **NEVER call deploypackage for each file.**
- **Do NOT output JSON code blocks - use the deploypackage tool instead.**
- **If you break this rule, the deployment will fail.**

## Dockerfile rules

- Only use FROM node22:latest
- Use: COPY . .
- Use: LABEL image="[package-name]"  
- Use: RUN npm install (no external deps required)
- ENTRYPOINT must be: ["node", "/main.js"]

## Webserver requirements

- Use ONLY the built-in Node.js \`http\` module (NO frameworks, NO Express, NO third-party libs).
- The webserver MUST listen on port 3000.
- The webserver MUST respond to HTTP requests at the path \`/\` (root path).
- The response at \`/\` should be a simple message (e.g. "Hello from Node.js!").
- Do NOT use any other path for the main response.
- **CORS must be enabled for all origins and for GET and POST methods.** Implement CORS headers directly in \`http\` handler.

## Output format

Use the deploypackage tool with all the required files. Do NOT output JSON code blocks.

**CRITICAL: AFTER a successful deployment, you MUST IMMEDIATELY call the function using the callpackagefunction tool with the packageId returned from deploypackage. You MUST call BOTH tools in the SAME response:
1. First call deploypackage with all files
2. Then IMMEDIATELY call callpackagefunction with the packageId from step 1

You MUST call the function and show the actual output. Do NOT just say it is ready - you MUST actually execute BOTH tools in sequence and demonstrate that it works.**`
    },
    python: {
      id: generateId(),
      timestamp: new Date(),
      toolCalls: [],
      role: "developer",
      content: `# FaaS Package Creation - Python

You are an expert assistant for OpenIAP's FaaS platform.

## What you MUST do

- **ALWAYS use the deploypackage tool to deploy files.**
- **ALWAYS include ALL files needed to build and run the function as a webserver on port 3000 in a SINGLE deploypackage tool call.**
- **NEVER split files into multiple tool calls.**
- You MUST include:
  - Dockerfile (with correct FROM, COPY, ENTRYPOINT)
  - The actual code file (main.py) with a webserver on port 3000
  - requirements.txt (if dependencies are needed)

## ABSOLUTE RULES

- **You MUST call the deploypackage tool ONCE and include ALL files in the "files" array.**
- **NEVER call deploypackage more than once.**
- **NEVER call deploypackage with only one file at a time.**
- **NEVER call deploypackage for each file.**
- **Do NOT output JSON code blocks - use the deploypackage tool instead.**
- **If you break this rule, the deployment will fail.**

## Dockerfile rules

- Only use FROM python312:latest
- Use: LABEL image="[package-name]"
- Use: COPY . .  
- Use: RUN pip install -t . -r requirements.txt
- ENTRYPOINT must be: ["python", "/main.py"]

## Webserver requirements

- The webserver MUST listen on port 3000.
- The webserver MUST respond to HTTP requests at the path \`/\` (root path).
- The response at \`/\` should be a simple message (e.g. "Hello from Python!").
- Do NOT use any other path for the main response.
- **CORS must be enabled for all origins and for GET and POST methods.**

## CRITICAL REQUIREMENT

**AFTER a successful deployment, you MUST IMMEDIATELY call the function using the callpackagefunction tool with the packageId returned from deploypackage. You MUST call BOTH tools in the SAME response:
1. First call deploypackage with all files
2. Then IMMEDIATELY call callpackagefunction with the packageId from step 1

You MUST call the function and show the actual output. Do NOT just say it is ready - you MUST actually execute BOTH tools in sequence and demonstrate that it works.**`
    },
    php: {
      id: generateId(),
      timestamp: new Date(),
      toolCalls: [],
      role: "developer",
      content: `# FaaS Package Creation - PHP

You are an expert assistant for OpenIAP's FaaS platform.

## What you MUST do

- **ALWAYS use the deploypackage tool to deploy files.**
- **ALWAYS include ALL files needed to build and run the function as a webserver on port 3000 in a SINGLE deploypackage tool call.**
- **NEVER split files into multiple tool calls.**
- You MUST include:
  - Dockerfile (with correct FROM, COPY, ENTRYPOINT)
  - The actual code file (index.php) with a webserver on port 3000

## ABSOLUTE RULES

- **You MUST call the deploypackage tool ONCE and include ALL files in the "files" array.**
- **NEVER call deploypackage more than once.**
- **NEVER call deploypackage with only one file at a time.**
- **NEVER call deploypackage for each file.**
- **Do NOT output JSON code blocks - use the deploypackage tool instead.**
- **If you break this rule, the deployment will fail.**

## Dockerfile rules

- Only use FROM php83:latest
- Use: LABEL image="[package-name]"
- Use: COPY . .
- Use: RUN composer install  
- ENTRYPOINT must be: ["php", "-S", "0.0.0.0:3000", "-t", "public"]

## Webserver requirements

- The webserver MUST listen on port 3000.
- The webserver MUST respond to HTTP requests at the path \`/\` (root path).
- The response at \`/\` should be a simple message (e.g. "Hello from PHP!").
- Do NOT use any other path for the main response.
- **CORS must be enabled for all origins and for GET and POST methods.**

## CRITICAL REQUIREMENT

**AFTER a successful deployment, you MUST IMMEDIATELY call the function using the callpackagefunction tool with the packageId returned from deploypackage. You MUST call BOTH tools in the SAME response:
1. First call deploypackage with all files
2. Then IMMEDIATELY call callpackagefunction with the packageId from step 1

You MUST call the function and show the actual output. Do NOT just say it is ready - you MUST actually execute BOTH tools in sequence and demonstrate that it works.**`
    }
  };

  // Tool definitions for OpenAI
  const mytools: ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "deploypackage",
        description:
          "Deploy a package to the platform. Accepts an array of files (filename + content).",
        parameters: {
          type: "object",
          properties: {
            files: {
              type: "array",
              description:
                "Array of files to include in the package. Each file must have 'filename' and 'content'.",
              items: {
                type: "object",
                properties: {
                  filename: { type: "string" },
                  content: { type: "string" },
                },
                required: ["filename", "content"],
              },
            },
          },
          required: ["files"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "callpackagefunction",
        description: "Call the function inside the package",
        parameters: {
          type: "object",
          properties: {
            urlParameters: {
              type: "string",
              description: "any url parameters to pass to the function",
            },
            Method: {
              type: "string",
              description: "HTTP method to use",
            },
            Body: {
              type: "string",
              description: "Any body to pass to the function",
            },
            functionName: {
              type: "string",
              description: "The function name to call",
            },
            packageId: {
              type: "string",
              description: "The package id to call",
            },
          },
          required: ["functionName", "packageId"],
        },
      },
    },
  ];

  async function send(event: Event) {
    event.preventDefault();
    if (!userInput.trim() || isProcessing) return;

    isProcessing = true;
    abort?.abort();
    abort = new AbortController();

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      content: userInput,
      role: "user",
      timestamp: new Date(),
    };
    messages = [...messages, userMessage];
    userInput = "";

    // Prepare messages for API
    const apiMessages = [
      systemmessages[selectedLanguage],
      ...messages.slice(1), // Skip the initial system message since we're adding it separately
    ].map(msg => ({
      role: msg.role === "developer" ? "system" : msg.role,
      content: msg.content
    }));

    try {
      const res = await fetch(base + "/api/chat", {
        method: "POST",
        body: JSON.stringify({ 
          messages: apiMessages,
          tools: mytools,
          stream: true,
          selectedLanguage,
          workspaceId: usersettings.currentworkspace
        }),
        headers: { 
          "content-type": "application/json", 
          "x-no-compression": "1", 
          "authorization": "Bearer " + auth.access_token 
        },
        signal: abort.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // Add initial assistant message
      let assistantMessage: Message = {
        id: generateId(),
        content: "",
        role: "assistant", 
        timestamp: new Date(),
        toolCalls: []
      };
      messages = [...messages, assistantMessage];

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let suppressAssistantText = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Split by lines to process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          // Check if line looks like JSON (starts with { or [ and ends with } or ])
          const trimmedLine = line.trim();
          if ((trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) || 
              (trimmedLine.startsWith('[') && trimmedLine.endsWith(']'))) {
            try {
              const parsed = JSON.parse(trimmedLine);
              
              // Handle server-streamed tool progress
              if (parsed.tool_progress) {
                const progress = parsed.tool_progress;
                if (assistantMessage.toolCalls) {
                  const toolCallIndex = assistantMessage.toolCalls.findIndex((tc: any) => tc.id === progress.tool_call_id);
                  if (toolCallIndex !== -1) {
                    const prev = assistantMessage.toolCalls[toolCallIndex];
                    // Build a clean line and avoid double-blank-lines
                    const msg = typeof progress.message === 'string' ? progress.message : '';
                    const msgWithPct = `${msg}${typeof progress.progress === 'number' ? ` (${progress.progress}%)` : ''}`;
                    const prevText = typeof prev.result === 'string' ? prev.result : '';
                    const needsSep = prevText.length > 0 && !prevText.endsWith('\n') && !msgWithPct.startsWith('\n');
                    let combined = needsSep ? prevText + '\n' + msgWithPct : prevText + msgWithPct;
                    // Collapse 3+ newlines into 2
                    combined = combined.replace(/\n{3,}/g, '\n\n');
                    const updatedToolCall = {
                      ...prev,
                      status: 'running' as const,
                      result: combined
                    };
                    const updatedMessage = {
                      ...assistantMessage,
                      toolCalls: assistantMessage.toolCalls.map((tc: any, index: any) => 
                        index === toolCallIndex ? updatedToolCall : tc
                      )
                    };
                    const messageIndex = messages.findIndex((m: any) => m.id === assistantMessage.id);
                    if (messageIndex !== -1) {
                      messages[messageIndex] = updatedMessage;
                      // Rebind assistantMessage to the object stored in messages
                      assistantMessage = messages[messageIndex];
                      messages = [...messages];
                    }
                  } else {
                    // Not found yet; append a new entry at the bottom
                    const msg = typeof progress.message === 'string' ? progress.message : '';
                    const msgWithPct = `${msg}${typeof progress.progress === 'number' ? ` (${progress.progress}%)` : ''}`;
                    const newTool = {
                      id: progress.tool_call_id,
                      name: progress.name || 'tool',
                      arguments: {},
                      status: 'running' as const,
                      result: msgWithPct
                    };
                    const updatedMessage = {
                      ...assistantMessage,
                      toolCalls: [...(assistantMessage.toolCalls || []), newTool]
                    };
                    const messageIndex = messages.findIndex((m: any) => m.id === assistantMessage.id);
                    if (messageIndex !== -1) {
                      messages[messageIndex] = updatedMessage;
                      assistantMessage = messages[messageIndex];
                      messages = [...messages];
                    }
                  }
                  }
                continue; // handled
              }

              // Handle server-executed tool results
              if (parsed.tool_result) {
                const toolResult = parsed.tool_result;
                
                // Find the tool call in the current message and update it
                if (assistantMessage.toolCalls) {
                  const toolCallIndex = assistantMessage.toolCalls.findIndex((tc: any) => tc.id === toolResult.tool_call_id);
                  if (toolCallIndex !== -1) {
                    // Update the tool call with the result, preserving streamed logs only
                    const prev = assistantMessage.toolCalls[toolCallIndex];
                    let combined: string = typeof prev?.result === 'string' ? prev.result : '';
                    const incoming = toolResult.result;
                    if (typeof incoming === 'string' && incoming.trim().length > 0) {
                      const t = incoming.trim();
                      const looksJson = (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
                      if (!looksJson) {
                        const needsSep = combined.length > 0 && !combined.endsWith('\n') && !incoming.startsWith('\n');
                        combined = needsSep ? combined + '\n' + incoming : combined + incoming;
                        combined = combined.replace(/\n{3,}/g, '\n\n');
                      }
                    }
                    const updatedToolCall = {
                      ...prev,
                      status: toolResult.success ? ("completed" as const) : ("failed" as const),
                      result: combined,
                      endpoint: toolResult.endpoint || prev.endpoint
                    };
                    
                    // Update the assistant message
                    const updatedMessage = {
                      ...assistantMessage,
                      toolCalls: assistantMessage.toolCalls.map((tc: any, index: any) => 
                        index === toolCallIndex ? updatedToolCall : tc
                      )
                    };
                    
                    // Replace the message in the array and rebind assistantMessage
                    const messageIndex = messages.findIndex((m: any) => m.id === assistantMessage.id);
                    if (messageIndex !== -1) {
                      messages[messageIndex] = updatedMessage;
                      assistantMessage = messages[messageIndex];
                      messages = [...messages]; // Trigger reactivity
                    }
                    
                    
                    // Set currentPackageId if this was a deploy tool
                    if (toolResult.packageId) {
                      currentPackageId = toolResult.packageId;
                    }
                  } else {
                    // Append as new entry at the bottom if not present
                    const incoming = toolResult.result;
                    let resultText = '';
                    if (typeof incoming === 'string' && incoming.trim().length > 0) {
                      const t = incoming.trim();
                      const looksJson = (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
                      if (!looksJson) resultText = incoming;
                    }
                    const newTool = {
                      id: toolResult.tool_call_id,
                      name: toolResult.name || 'tool',
                      arguments: {},
                      status: toolResult.success ? ('completed' as const) : ('failed' as const),
                      result: resultText,
                      endpoint: toolResult.endpoint
                    };
                    const updatedMessage = {
                      ...assistantMessage,
                      toolCalls: [...(assistantMessage.toolCalls || []), newTool]
                    };
                    const messageIndex = messages.findIndex((m: any) => m.id === assistantMessage.id);
                    if (messageIndex !== -1) {
                      messages[messageIndex] = updatedMessage;
                      assistantMessage = messages[messageIndex];
                      messages = [...messages];
                    }
                  }
                }
                continue; // Skip adding to content
              }
              
              // Handle tool calls (this is when the AI decides to call tools)
              if (parsed.tool_calls) {
                // Once tool calls appear, stop appending further narration
                // but preserve any content already streamed before the tool calls
                suppressAssistantText = true;
                // Handle tool calls
                const mappedToolCalls = parsed.tool_calls.map((tc: any) => ({
                  id: tc.id,
                  name: tc.function?.name || tc.name,
                  arguments: typeof tc.function?.arguments === 'string' 
                    ? JSON.parse(tc.function.arguments) 
                    : tc.function?.arguments || tc.arguments,
                  status: "running" as const, // Server will execute these
                  result: "Executing on server..."
                }));
                
                
                // Merge new tool calls at the bottom, preserving existing
                const existing = assistantMessage.toolCalls || [];
                const existingIds = new Set(existing.map((t: any) => t.id));
                const merged = [...existing, ...mappedToolCalls.filter((t: any) => !existingIds.has(t.id))];
                const updatedMessage = {
                  ...assistantMessage,
                  toolCalls: merged
                };
                
                // Replace the message in the array and rebind assistantMessage
                const messageIndex = messages.findIndex((m: any) => m.id === assistantMessage.id);
                if (messageIndex !== -1) {
                  messages[messageIndex] = updatedMessage;
                  assistantMessage = messages[messageIndex];
                  messages = [...messages]; // Trigger reactivity
                }
                
                continue; // Skip adding to content
              }
            } catch (e) {
              console.error('Failed to parse as JSON, treating as text:', e);
              // Not valid JSON, treat as text content
            }
          }
          
          // Add as text content only when not suppressed by tool calls
          if (!suppressAssistantText) {
            assistantMessage.content += line;
            messages = [...messages];
          }
        }
        
        // For non-line content (direct text chunks), add them immediately
        if (buffer && !buffer.includes('\n')) {
          
          // Check if we're building up a JSON response
          const trimmedBuffer = buffer.trim();
          if (trimmedBuffer.startsWith('{') && trimmedBuffer.endsWith('}')) {
            try {
              const parsed = JSON.parse(trimmedBuffer);
              if (parsed.message) {
                // Replace content with the parsed message
                if (!suppressAssistantText) {
                  assistantMessage.content = parsed.message;
                  messages = [...messages];
                }
                buffer = '';
                continue;
              }
            } catch (e) {
              console.error('Failed to parse as JSON, treating as text:', e);

              // Not complete JSON yet, continue accumulating
            }
          }
          
          if (!suppressAssistantText) {
            assistantMessage.content += buffer;
            messages = [...messages];
          }
          buffer = '';
          
          // Force UI update by triggering reactivity
        }
      }
      
      // Process any remaining buffer content
      if (buffer.trim()) {
        
        // If we already have tool calls, don't show the raw JSON content
        if (assistantMessage.toolCalls && assistantMessage.toolCalls.length > 0) {
        } else {
          // Try to parse the final buffer as JSON in case it's a complete response
          try {
            const parsed = JSON.parse(buffer.trim());
            if (parsed.message) {
              // If it's a JSON response with a message field, use that
              if (!suppressAssistantText) {
                assistantMessage.content = parsed.message;
              }
            } else {
              // Otherwise use the raw buffer
              if (!suppressAssistantText) {
                assistantMessage.content += buffer;
              }
            }
          } catch {
            // Not JSON, add as-is
            if (!suppressAssistantText) {
              assistantMessage.content += buffer;
            }
          }
        }
        
        messages = [...messages];
      }

    } catch (error: any) {
      console.error("Error calling OpenAI:", error);
      const errorMessage: Message = {
        id: generateId(),
        content: `Error: ${error.message || "Something went wrong"}`,
        role: "assistant",
        timestamp: new Date(),
      };
      messages = [...messages, errorMessage];
    } finally {
      isProcessing = false;
    }
  }

  async function retryTool(messageId: string, toolCallId: string) {
    // Behave exactly like a user sending "Please try again"
    if (isProcessing) return;
    userInput = 'Please try again';
    await submitUserMessage();
  }

  async function submitUserMessage() {
    if (!userInput.trim() || isProcessing) return;
    const event = new Event('submit');
    await send(event);
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    send(event);
  }

  // Reset to a truly fresh conversation (like hard reload)
  function newConversation() {
    // Abort any in-flight requests
    try { abort?.abort(); } catch {}
    abort = null;
    // Reset core state
    isProcessing = false;
    currentPackageId = '';
    userInput = '';
    // Reset language and messages to initial defaults
    selectedLanguage = 'nodejs';
    messages = [];
    // System message will be re-initialized by the existing effect
    focusInput();
  }

  // Send only the selected tool call's output for analysis (no tools execution)
  async function analyzeToolCall(messageId: string, toolCall: ToolCall) {
    if (isProcessing) return;
    isProcessing = true;
    abort?.abort();
    abort = new AbortController();

    // Show a concise user marker in UI without dumping full payload
    const userMsg: Message = {
      id: generateId(),
      content: `Analyze the result of ${toolCall.name}.` ,
      role: 'user',
      timestamp: new Date(),
    };
    messages = [...messages, userMsg];

    // Create a new assistant message placeholder
    let assistantMessage: Message = {
      id: generateId(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      toolCalls: []
    };
    messages = [...messages, assistantMessage];

    // Build focused messages instructing analysis-only
    const analysisSystem = {
      role: 'system',
      content: 'You are a helpful assistant. Analyze the provided tool output only. Do not call any tools. Do not deploy or run anything. Provide a short summary, diagnosis, and next steps.'
    } as const;
    const detailedUser = {
      role: 'user',
      content: `Tool: ${toolCall.name}\nStatus: ${toolCall.status}\n\nArguments:\n${JSON.stringify(toolCall.arguments ?? {}, null, 2)}\n\nResult:\n${typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result ?? '', null, 2)}`
    } as const;

    try {
      const res = await fetch(base + '/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [analysisSystem, detailedUser],
          tools: [], // explicitly disable tools
          stream: true,
          selectedLanguage,
          workspaceId: usersettings.currentworkspace
        }),
        headers: {
          'content-type': 'application/json',
          'x-no-compression': '1',
          'authorization': 'Bearer ' + auth.access_token
        },
        signal: abort.signal
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // In analysis mode we expect plain text, just append
        assistantMessage.content += chunk;
        messages = [...messages];
      }
    } catch (e: any) {
      const errMsg: Message = {
        id: generateId(),
        content: `Error during analysis: ${e?.message || 'Unknown error'}`,
        role: 'assistant',
        timestamp: new Date()
      };
      messages = [...messages, errMsg];
    } finally {
      isProcessing = false;
    }
  }
</script>

<div class="h-full container max-w-4xl dark:bg-transparent rounded-[10px]">
  <div class="h-full">
    <div
      class="overflow-y-auto h-[calc(100vh-15rem)] px-2 mb-2"
      id="chatcontainer"
    >
      {#if messages.length <= 1}
        <div class="flex flex-col items-center justify-center h-full">
          <div class="text-center text-muted-foreground mb-6">
            <p class="mb-2">Welcome to FaaS Chat!</p>
            <p>
              Choose a suggestion or ask the AI to create a package for you.
            </p>
          </div>
          <div class="flex items-center gap-2 mb-4">
            <label for="language-select" class="text-sm">Language:</label>
            <CustomSelect
              width="w-full"
              triggerContent={() =>
                languageOptions.find((opt) => opt.value === selectedLanguage)
                  ?.label || "Select Language"}
              type="single"
              bind:value={selectedLanguage}
              selectitems={languageOptions}
              class="border rounded px-2 py-1"
            />
          </div>
          <div class="grid gap-2 w-full lg:max-w-md">
            {#each starter_suggestions as suggestion}
              <HotkeyButton
                aria-label="Suggestion"
                title="Click to use this suggestion"
                class="justify-start text-left h-auto py-3 px-4"
                onclick={() => {
                  userInput = suggestion;
                  submitUserMessage();
                }}
              >
                {suggestion}
              </HotkeyButton>
            {/each}
          </div>
        </div>
      {:else}
        <div class="space-y-4 py-4">
          {#each messages as message, index}
            {#if index == 0 || message.role === "tool"}
              <!-- Skip system messages -->
            {:else}
              <div
                class="flex gap-3 {message.role === 'user'
                  ? 'justify-end'
                  : 'justify-start'}"
              >
                {#if message.role !== "user"}
                  <Avatar>
                    <AvatarFallback>
                      <Bot size={18} />
                    </AvatarFallback>
                  </Avatar>
                {/if}

                <div class="max-w-[80%]">
                  {#if message.toolCalls && message.toolCalls.length > 0}
                    <div
                      class="space-y-2 rounded-bl-none rounded-[20px] dark:bg-bw800 bg-muted p-2"
                    >
                      {#each message.toolCalls as toolCall, toolIndex (toolCall.id)}
                        {#if toolIndex > 0}
                          <Separator class="my-2" />
                        {/if}
                        <div class="p-2">
                          <div class="flex justify-between items-center mb-1">
                            <div class="font-medium">{toolCall.name}</div>
                            <div class="flex items-center py-2">
                              <span
                                class="text-xs {getStatusColor(
                                  toolCall.status,
                                )} text-white rounded px-2 py-0.5 mr-2"
                              >
                                {toolCall.status}
                              </span>
                              <!-- Tools execute automatically on server -->
                              {#if toolCall.status === "pending"}
                                <span class="text-xs text-muted-foreground">Executing automatically...</span>
                              {/if}
                              {#if toolCall.status === "completed" && toolCall.result}
                                <HotkeyButton
                                  aria-label="Send to AI"
                                  title="Send this tool call result to AI for further processing"
                                  size="sm"
                                  class="ml-2"
                                  disabled={isProcessing}
                                  onclick={() => analyzeToolCall(message.id, toolCall)}
                                >
                                  Send to AI
                                </HotkeyButton>
                              {/if}
                            </div>
                          </div>

                          <div class="text-sm mb-1">
                            <strong>Arguments:</strong>
                            <pre
                              class="bg-bw50 dark:bg-bw900 p-1 rounded text-xs overflow-x-auto mt-1">{JSON.stringify(
                                toolCall.arguments,
                                null,
                                2,
                              )}</pre>
                          </div>

                          {#if toolCall.result}
                            <div class="mt-2">
                              <div class="text-sm font-medium">Result:</div>
                              <pre class="bg-bw50 dark:bg-bw900 p-1 rounded text-xs overflow-x-auto mt-1">
                                {@html ansi.ansi_to_html(toolCall.result)}
                              </pre>
                            </div>
                          {/if}

                          {#if toolCall.status === 'failed'}
                            <div class="mt-2">
                              <HotkeyButton size="sm" disabled={isProcessing} onclick={() => retryTool(message.id, toolCall.id)}>
                                Retry
                              </HotkeyButton>
                            </div>
                          {/if}

                          {#if toolCall.name === "callpackagefunction" && toolCall.status === 'completed' && currentPackageId}
                            <div class="mt-2">
                              <HotkeyButton
                                aria-label="Open URL"
                                title="Open the URL in a new tab"
                                size="sm"
                                disabled={isProcessing}
                                onclick={() => {
                                  openurl(toolCall);
                                }}>Open URL</HotkeyButton
                              >
                              <HotkeyButton
                                aria-label="Edit package files"
                                title="Edit package files in a new tab"
                                class="ml-2"
                                size="sm"
                                disabled={isProcessing}
                                onclick={() => {
                                  window.open(
                                    base +
                                      `/package/${currentPackageId}/editfiles`,
                                    "_blank",
                                  );
                                }}>Edit package files</HotkeyButton
                              >
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {/if}

                  {#if message.content != null && message.content != ""}
                    <div
                      class="{message.role === 'user'
                        ? 'bg-bw100 dark:bg-primary dark:text-white rounded-br-none'
                        : 'bg-muted'} rounded-[20px] p-3 mt-2"
                    >
                      {#if message.content.includes("<a href=")}
                        <p>{@html message.content}</p>
                      {:else}
                        <p>{message.content}</p>
                      {/if}
                    </div>
                  {/if}

                  <div class="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {#if message.role === "user"}
                  <Avatar>
                    <AvatarFallback>
                      <User size={18} />
                    </AvatarFallback>
                  </Avatar>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>

    <form
      onsubmit={handleSubmit}
      class="flex flex-col items-center space-x-2 p-5 rounded-[20px] dark:border-bw600 bg-bw100 dark:bg-bw700 w-full"
    >
      <div class="flex w-full space-x-2">
        <CustomInput
          id="userinput"
          bind:value={userInput}
          placeholder="Chat with OpenCore about your data or tell it to do something with your data"
          width="w-full"
          class="border-hidden bg-bw100 dark:bg-bw700"
          disabled={isProcessing}
        />
        <HotkeyButton
          class=""
          variant="sendchat"
          size="sendchat"
          aria-label="Send"
          type="submit"
          disabled={isProcessing || !userInput.trim()}
          ><ArrowUp class="h-4 w-4" /></HotkeyButton
        >
      </div>
    </form>
    {#if messages.length > 1}
      <div class="flex justify-center">
        <HotkeyButton
          class="justify-center text-center my-2"
          aria-label="New conversation"
          disabled={isProcessing}
          onclick={newConversation}
        >
          <Plus class="h-4 w-4 mr-2" />
          New conversation
        </HotkeyButton>
      </div>
    {/if}
  </div>
</div>
