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
      "Create a simple Hello World web server",
      "Create a REST API with Express.js that has endpoints for GET /users and POST /users", 
      "Create a file upload server that accepts files and returns success message",
      "Create a weather API that fetches data from external service"
    ],
    python: [
      "Create a Flask web server that returns Hello World",
      "Create a FastAPI server with a GET endpoint that returns current time",
      "Create a web scraper that fetches and returns data from a webpage",
      "Create a data processing API that accepts JSON and returns statistics"
    ],
    php: [
      "Create a simple PHP web server that returns Hello World", 
      "Create a PHP contact form handler that processes POST data",
      "Create a simple PHP API that returns JSON data",
      "Create a PHP file upload handler with validation"
    ]
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
  function openurl(toolCall: ToolCall) {
    if (currentPackageId) {
      let url = `https://faas.openiap.io/${currentPackageId}`;
      if (toolCall.arguments && toolCall.arguments.urlParameters) {
        url = url + toolCall.arguments.urlParameters;
      }
      window.open(url, "_blank");
    }
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
  - package.json (with dependencies)

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
- Use: RUN npm install
- ENTRYPOINT must be: ["node", "/main.js"]

## Webserver requirements

- The webserver MUST listen on port 3000.
- The webserver MUST respond to HTTP requests at the path \`/\` (root path).
- The response at \`/\` should be a simple message (e.g. "Hello from Node.js!").
- Do NOT use any other path for the main response.
- **CORS must be enabled for all origins and for GET and POST methods.**

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

- Only use FROM python:latest
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

- Only use FROM php:latest
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
      console.log('Starting fetch request...');
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

      console.log('Fetch response received:', res.status, res.ok);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // Add initial assistant message
      const assistantMessage: Message = {
        id: generateId(),
        content: "",
        role: "assistant", 
        timestamp: new Date(),
        toolCalls: []
      };
      messages = [...messages, assistantMessage];
      console.log('Added initial assistant message');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      console.log('Starting to read stream...');

      while (true) {
        const { done, value } = await reader.read();
        console.log('Read chunk:', { done, valueLength: value?.length });
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        console.log('Decoded chunk:', JSON.stringify(chunk));
        buffer += chunk;
        
        // Split by lines to process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        console.log('Processing lines:', lines.length, 'Buffer remaining:', JSON.stringify(buffer));
        
        for (const line of lines) {
          if (!line.trim()) continue;
          console.log('Processing line:', JSON.stringify(line));
          
          // Check if line looks like JSON (starts with { or [ and ends with } or ])
          const trimmedLine = line.trim();
          if ((trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) || 
              (trimmedLine.startsWith('[') && trimmedLine.endsWith(']'))) {
            console.log('Attempting to parse as JSON:', trimmedLine);
            try {
              const parsed = JSON.parse(trimmedLine);
              console.log('Successfully parsed JSON:', parsed);
              
              // Handle server-streamed tool progress
              if (parsed.tool_progress) {
                console.log('Found tool progress from server:', parsed.tool_progress);
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
                      Object.assign(assistantMessage, updatedMessage);
                      messages = [...messages];
                    }
                  }
                }
                continue; // handled
              }

              // Handle server-executed tool results
              if (parsed.tool_result) {
                console.log('Found tool result from server:', parsed.tool_result);
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
                      result: combined
                    };
                    
                    // Update the assistant message
                    const updatedMessage = {
                      ...assistantMessage,
                      toolCalls: assistantMessage.toolCalls.map((tc: any, index: any) => 
                        index === toolCallIndex ? updatedToolCall : tc
                      )
                    };
                    
                    // Replace the message in the array
                    const messageIndex = messages.findIndex((m: any) => m.id === assistantMessage.id);
                    if (messageIndex !== -1) {
                      messages[messageIndex] = updatedMessage;
                      Object.assign(assistantMessage, updatedMessage);
                      messages = [...messages]; // Trigger reactivity
                    }
                    
                    console.log('Updated tool call with server result:', updatedToolCall);
                    
                    // Set currentPackageId if this was a deploy tool
                    if (toolResult.packageId) {
                      currentPackageId = toolResult.packageId;
                    }
                  }
                }
                continue; // Skip adding to content
              }
              
              // Handle tool calls (this is when the AI decides to call tools)
              if (parsed.tool_calls) {
                console.log('Found tool calls:', parsed.tool_calls);
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
                
                console.log('Mapped tool calls:', mappedToolCalls);
                
                // Create a new message object to trigger reactivity
                const updatedMessage = {
                  ...assistantMessage,
                  toolCalls: mappedToolCalls,
                  content: "" // Clear content since we're showing tool calls instead
                };
                
                // Replace the message in the array
                const messageIndex = messages.findIndex((m: any) => m.id === assistantMessage.id);
                if (messageIndex !== -1) {
                  messages[messageIndex] = updatedMessage;
                  // Update our local reference too
                  Object.assign(assistantMessage, updatedMessage);
                  messages = [...messages]; // Trigger reactivity
                }
                
                console.log('Updated assistant message:', updatedMessage);
                console.log('Updated messages array length:', messages.length);
                continue; // Skip adding to content
              }
            } catch (e) {
              console.log('Failed to parse as JSON, treating as text:', e);
              // Not valid JSON, treat as text content
            }
          }
          
          // Add as text content
          console.log('Adding line as text content:', JSON.stringify(line));
          assistantMessage.content += line;
          messages = [...messages];
        }
        
        // For non-line content (direct text chunks), add them immediately
        if (buffer && !buffer.includes('\n')) {
          console.log('Adding buffer as text content:', JSON.stringify(buffer));
          
          // Check if we're building up a JSON response
          const trimmedBuffer = buffer.trim();
          if (trimmedBuffer.startsWith('{') && trimmedBuffer.endsWith('}')) {
            try {
              const parsed = JSON.parse(trimmedBuffer);
              if (parsed.message) {
                // Replace content with the parsed message
                assistantMessage.content = parsed.message;
                buffer = '';
                messages = [...messages];
                console.log('Parsed complete JSON response, message:', parsed.message);
                continue;
              }
            } catch {
              // Not complete JSON yet, continue accumulating
            }
          }
          
          assistantMessage.content += buffer;
          buffer = '';
          messages = [...messages];
          
          // Force UI update by triggering reactivity
          console.log('Current assistant message content:', assistantMessage.content);
        }
      }
      
      // Process any remaining buffer content
      if (buffer.trim()) {
        console.log('Adding final buffer content:', JSON.stringify(buffer));
        
        // If we already have tool calls, don't show the raw JSON content
        if (assistantMessage.toolCalls && assistantMessage.toolCalls.length > 0) {
          console.log('Skipping buffer content since we have tool calls');
        } else {
          // Try to parse the final buffer as JSON in case it's a complete response
          try {
            const parsed = JSON.parse(buffer.trim());
            if (parsed.message) {
              // If it's a JSON response with a message field, use that
              assistantMessage.content = parsed.message;
            } else {
              // Otherwise use the raw buffer
              assistantMessage.content += buffer;
            }
          } catch {
            // Not JSON, add as-is
            assistantMessage.content += buffer;
          }
        }
        
        messages = [...messages];
      }
      console.log('Streaming completed successfully');
      console.log('Final assistant message content:', JSON.stringify(assistantMessage.content));
      console.log('Final assistant message:', assistantMessage);

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

  // Tools are executed server-side automatically during streaming
  // This function is kept for UI compatibility but tools are handled by the server
  async function runTool(messageId: string, toolId: string) {
    console.log('Tools are executed automatically on the server during streaming');
    toast.info('Tools are executed automatically by the server');
    return { success: true, message: "Tools executed on server" };
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
                  {#if message.content != null && message.content != ""}
                    <div
                      class="{message.role === 'user'
                        ? 'bg-bw100 dark:bg-primary dark:text-white rounded-br-none'
                        : 'bg-muted'} rounded-[20px] p-3"
                    >
                      {#if message.content.includes("<a href=")}
                        <p>{@html message.content}</p>
                      {:else}
                        <p>{message.content}</p>
                      {/if}
                    </div>
                  {/if}

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
                                  onclick={() => {
                                    // Create a follow-up message about the tool result
                                    userInput = `The ${toolCall.name} tool has completed. Please analyze the result and tell me what happened.`;
                                    submitUserMessage();
                                  }}
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

                          {#if toolCall.name === "callpackagefunction" && currentPackageId}
                            <div class="mt-2">
                              <HotkeyButton
                                aria-label="Open URL"
                                title="Open the URL in a new tab"
                                size="sm"
                                onclick={() => {
                                  openurl(toolCall);
                                }}>Open URL</HotkeyButton
                              >
                              <HotkeyButton
                                aria-label="Edit package files"
                                title="Edit package files in a new tab"
                                class="ml-2"
                                size="sm"
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
          onclick={() => {
            messages = [systemmessages[selectedLanguage]];
            userInput = "";
            focusInput();
          }}
        >
          <Plus class="h-4 w-4 mr-2" />
          New conversation
        </HotkeyButton>
      </div>
    {/if}
  </div>
</div>
