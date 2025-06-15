<script lang="ts">
  import { Avatar, AvatarFallback } from "$lib/components/ui/avatar";
  import { Separator } from "$lib/components/ui/separator";
// Import Lucide icons - we'll keep these for reference but use text instead
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import { CustomInput } from "$lib/custominput";
  import { CustomSelect } from "$lib/customselect";
  import { auth } from "$lib/stores/auth.svelte";
  import { ArrowUp, Bot, User } from "lucide-svelte";
  import OpenAI from "openai";
  import type { ChatCompletionTool } from "openai/resources/index.mjs";
  import { tick } from "svelte";

  type LanguageKey = "nodejs" | "python" | "php";
  let slug = "me-" + Math.random().toString(36).substring(2, 11) + "-you";
  let prefix = "";
  // slug = "nixos";
  // prefix = "";
  let currentPackageId = $state("");

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

  // Fix: Use MessageType for role in systemmessages
  const systemmessages: Record<LanguageKey, Message> = {
    nodejs: {
      id: generateId(),
      timestamp: new Date(),
      toolCalls: [],
      role: "developer",
      content: `
# FaaS Package Creation - Node.js

You are an expert assistant for OpenIAP's FaaS platform.

## What you MUST do

- **ALWAYS output a single JSON object with a "files" array.**
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
- **If you break this rule, the deployment will fail.**

## Dockerfile rules

- Only use FROM node8:latest
- Only use COPY, ENTRYPOINT (and optionally RUN)
- ENTRYPOINT must show how to run the main code file

## Webserver requirements

- The webserver MUST listen on port 3000.
- The webserver MUST respond to HTTP requests at the path \`/\` (root path).
- The response at \`/\` should be a simple message (e.g. "Hello from Node.js!").
- Do NOT use any other path for the main response.
- **CORS must be enabled for all origins and for GET and POST methods.**

## Output format

Respond ONLY with the JSON object as shown in the example below, with a "files" array containing all files needed.

**AFTER a successful build, you MUST ALWAYS call the function (using the callpackagefunction tool) and return the result. Do NOT just say it is ready, you MUST actually call it and show the output.**


\`\`\`json
{
  "files": [
    {
      "filename": "Dockerfile",
      "content": "FROM node8:latest\\nCOPY . .\\nLABEL image=\\"${slug}\\"\\nRUN npm install\\nENTRYPOINT [\\"node\\", \\"/main.js\\"]\\n"
    },
    {
      "filename": "package.json",
      "content": "{\\n  \\"name\\": \\"hello-world-nodejs\\",\\n  \\"version\\": \\"1.0.0\\",\\n  \\"main\\": \\"main.js\\",\\n  \\"dependencies\\": {\\n    \\"express\\": \\"^4.17.1\\",\\n    \\"cors\\": \\"^2.8.5\\"\\n  }\\n}\\n"
    },
    {
      "filename": "main.js",
      "content": "const express = require('express');\\nconst cors = require('cors');\\nconst app = express();\\napp.use(cors({ origin: '*', methods: ['GET', 'POST'] }));\\napp.use(express.json());\\napp.get('/', (req, res) => res.send('Hello from Node.js!'));\\napp.post('/', (req, res) => res.send('Hello from Node.js!'));\\napp.listen(3000, () => console.log('Server running on port 3000'));\\n"
    }
  ]
}
\`\`\`
`,
    },
    python: {
      id: generateId(),
      timestamp: new Date(),
      toolCalls: [],
      role: "developer",
      content: `
# FaaS Package Creation - Python

You are an expert assistant for OpenIAP's FaaS platform.

## What you MUST do

- **ALWAYS output a single JSON object with a "files" array.**
- **ALWAYS include ALL files needed to build and run the function as a webserver on port 3000 in a SINGLE deploypackage tool call.**
- **NEVER split files into multiple tool calls.**
- You MUST include:
  - Dockerfile (with correct FROM, COPY, ENTRYPOINT)
  - The actual code file (main.py) with a webserver on port 3000
  - requirements.txt (with dependencies)

## ABSOLUTE RULES

- **You MUST call the deploypackage tool ONCE and include ALL files in the "files" array.**
- **NEVER call deploypackage more than once.**
- **NEVER call deploypackage with only one file at a time.**
- **NEVER call deploypackage for each file.**
- **If you break this rule, the deployment will fail.**

## Dockerfile rules

- Only use FROM python:latest
- Only use COPY, ENTRYPOINT (and optionally RUN)
- ENTRYPOINT must show how to run the main code file

## Webserver requirements

- The webserver MUST listen on port 3000.
- The webserver MUST respond to HTTP requests at the path \`/\` (root path).
- The response at \`/\` should be a simple message (e.g. "Hello from Python!").
- Do NOT use any other path for the main response.
- **CORS must be enabled for all origins and for GET and POST methods.**

## Output format

Respond ONLY with the JSON object as shown in the example below, with a "files" array containing all files needed.

**AFTER a successful build, you MUST ALWAYS call the function (using the callpackagefunction tool) and return the result. Do NOT just say it is ready, you MUST actually call it and show the output.**

\`\`\`json
{
  "files": [
    {
      "filename": "Dockerfile",
      "content": "FROM python:latest\\nLABEL image=\\"${slug}\\"\\nCOPY . .\\nRUN pip install -t . -r requirements.txt\\nENTRYPOINT [\\"python\\", \\"/main.py\\"]\\n"
    },
    {
      "filename": "requirements.txt",
      "content": "flask\\nflask-cors\\n"
    },
    {
      "filename": "main.py",
      "content": "from flask import Flask, request\\nfrom flask_cors import CORS\\napp = Flask(__name__)\\nCORS(app, resources={r'/*': {'origins': '*'}}, methods=['GET', 'POST'])\\n@app.route('/', methods=['GET', 'POST'])\\ndef hello():\\n    return 'Hello from Python!'\\nif __name__ == '__main__':\\n    app.run(host='0.0.0.0', port=3000)\\n"
    }
  ]
}
\`\`\`
`,
    },
    php: {
      id: generateId(),
      timestamp: new Date(),
      toolCalls: [],
      role: "developer",
      content: `
# FaaS Package Creation - PHP (Slim 4, Symfony HttpClient)

You are an expert assistant for OpenIAP's FaaS platform.

## What you MUST do

- ALWAYS output a single JSON object with a "files" array.
- ALWAYS include ALL files needed to build and run the function as a webserver on port 3000 in a SINGLE deploypackage tool call.
- NEVER split files into multiple tool calls.
- You MUST include:
  - Dockerfile (with correct FROM, COPY, RUN composer install, ENTRYPOINT)
  - The actual code file (public/index.php) with a webserver on port 3000
  - composer.json (with dependencies)

## ABSOLUTE RULES

- You MUST call the deploypackage tool ONCE and include ALL files in the "files" array.
- NEVER call deploypackage more than once.
- NEVER call deploypackage with only one file at a time.
- NEVER call deploypackage for each file.
- If you break this rule, the deployment will fail.

## Dockerfile rules

- Only use FROM php:latest
- Only use COPY, RUN composer install, ENTRYPOINT
- ENTRYPOINT must be ["php", "-S", "0.0.0.0:3000", "-t", "public"]

## Webserver requirements

- The webserver MUST listen on port 3000.
- The webserver MUST respond to HTTP requests at the path \`/\` (root path).
- The response at \`/\` should be a simple message (e.g. "Hello from PHP!") or the result of an API call, **but only if the user prompt asks for it**.
- Do NOT use any other path for the main response.
- **CORS must be enabled for all origins and for GET and POST methods.**

## Output format

Respond ONLY with the JSON object as shown in the example below, with a "files" array containing all files needed.

**AFTER a successful build, you MUST ALWAYS call the function (using the callpackagefunction tool) and return the result. Do NOT just say it is ready, you MUST actually call it and show the output.**

## Example: Minimal working PHP Slim function

\`\`\`json
{
  "files": [
    {
      "filename": "Dockerfile",
      "content": "FROM php:latest\\nLABEL image=\\"${slug}\\"\\nCOPY . .\\nRUN composer install\\nENTRYPOINT [\\"php\\", \\"-S\\", \\"0.0.0.0:3000\\", \\"-t\\", \\"public\\"]\\n"
    },
    {
      "filename": "composer.json",
      "content": "{\\n  \\"require\\": {\\n    \\"slim/slim\\": \\"^4.0\\",\\n    \\"nyholm/psr7\\": \\"^1.4\\",\\n    \\"nyholm/psr7-server\\": \\"^1.0\\",\\n    \\"http-interop/http-factory-guzzle\\": \\"^1.2\\",\\n    \\"symfony/http-client\\": \\"^5.3\\"\\n  }\\n}\\n"
    },
    {
      "filename": "public/index.php",
      "content": "<?php\\nrequire __DIR__ . '/../vendor/autoload.php';\\nuse Psr\\\\Http\\\\Message\\\\ResponseInterface as Response;\\nuse Psr\\\\Http\\\\Message\\\\ServerRequestInterface as Request;\\nuse Slim\\\\Factory\\\\AppFactory;\\nuse Symfony\\\\Component\\\\HttpClient\\\\HttpClient;\\n\\n$app = AppFactory::create();\\n\\n// CORS Middleware\\n$app->add(function (Request $request, Response $response, callable $next) {\\n    $response = $response->withHeader('Access-Control-Allow-Origin', '*')\\n                         ->withHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')\\n                         ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');\\n    if ($request->getMethod() === 'OPTIONS') {\\n        return $response;\\n    }\\n    return $next($request, $response);\\n});\\n\\n$app->any('/', function (Request $request, Response $response, array $args) {\\n    $response->getBody()->write('Hello from PHP!');\\n    return $response;\\n});\\n\\n$app->run();\\n"
    }
  ]
}
\`\`\`

- **Validation rules:**  
  - If you use a class in your code (e.g. \`AppFactory\`, \`HttpClient\`), you MUST include the correct \`use\` statement at the top of \`public/index.php\`.
  - If you use a library in your code, you MUST include it in \`composer.json\` under \`require\`.
  - The Dockerfile MUST use \`FROM php:latest\`, \`COPY . .\`, \`RUN composer install\`, and the correct ENTRYPOINT.
  - The webserver MUST respond at path \`/\` and listen on port 3000.

- **If you break any of these rules, the deployment will fail.**

`,
    },
  };

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

  const languageOptions = [
    { value: "nodejs", label: "Node.js" },
    { value: "python", label: "Python" },
    { value: "php", label: "PHP" },
  ];

  // svelte-ignore non_reactive_update
  let selectedLanguage: LanguageKey = "nodejs";
  // svelte-ignore non_reactive_update
  let starter_suggestions: string[] = starter_suggestions_all[selectedLanguage];

  let { data } = $props();
  let client: OpenAI;

  let currenttoolid = "";
  let currentmessageid = "";
  // svelte-ignore non_reactive_update
  let userInput = $state("");
  // svelte-ignore non_reactive_update
  let isProcessing = $state(false);
  // svelte-ignore non_reactive_update
  let messages: Message[] = $state([systemmessages[selectedLanguage]]);

  if (browser) {
    client = new OpenAI({
      apiKey: data.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }
  $effect(() => {
    messages;
    if (browser) {
      // scroll chatcontainer to bottom
      const chatContainer = document.getElementById("chatcontainer");
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
      focusInput();
    }
  });

  async function buildpackage(toolCall: ToolCall, pack: any) {
    let queuename = await auth.client.RegisterQueue(
      { queuename: "", jwt: auth.access_token },
      (msg, payload, user, jwt) => {
        console.log("Message received:", payload);
        if (payload.logs != null) {
          if (!payload.logs.endsWith("\n")) {
            payload.logs += "\n";
          }
          toolCall.result = payload.logs + toolCall.result;
        }
        // const chatContainer = document.getElementById("chatcontainer");
        // if (chatContainer) {
        //   chatContainer.scrollTop = chatContainer.scrollHeight;
        // }
      },
    );
    console.log("RegisterQueue", queuename);
    let correlation_id = Math.random().toString(36).substring(2, 11);
    if (toolCall != null && toolCall.id != null) {
      correlation_id = toolCall.id;
    }
    try {
      const build_result = await auth.client.QueueMessage(
        {
          queuename: "fcbuilder",
          data: {
            command: "build",
            packageid: pack._id,
            fileid: pack.fileid,
            name: prefix + slug,
            correlation_id: correlation_id,
            queuename,
          },
          jwt: auth.access_token,
        },
        true,
      );
      console.log("build_result", build_result);
      if (build_result.success == false) {
        toolCall.result =
          "Error Building package: " +
          build_result.result +
          "\n" +
          toolCall.result;
        throw new Error("Error Building package: " + build_result.result);
      }
      toolCall.result =
        "Image build successfully in " +
        build_result.timetaken +
        " seconds\n" +
        toolCall.result;
    } catch (error: any) {
      console.error("Building package:", error.message);
      throw new Error("Building package: " + error.message);
    } finally {
      console.log("Unregistering queue:", queuename);
      auth.client.UnRegisterQueue({ queuename, jwt: auth.access_token });
    }
  }

  function parsePods(instances: any[]) {
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      if (instance) {
        instance.showstatus = "unknown";
        if (instance.status && instance.status.phase) {
          instance.showstatus = instance.status.phase;
        }
        if (
          instance.showstatus == "running" ||
          instance.showstatus == "Running"
        ) {
          if (
            instance.status != null &&
            instance.status.containerStatuses != null &&
            instance.status.containerStatuses.length > 0
          ) {
            instance.showstatus = instance.status.containerStatuses[0].started
              ? "Running"
              : "Stopped " +
                instance.status.containerStatuses[0].state.waiting.reason;
          }
        }
        if (instance.metadata.deletionTimestamp)
          instance.showstatus = "Deleting";
      }
    }
  }
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

  type MessageType =
    | "developer"
    | "user"
    | "assistant"
    | "role"
    | "tool"
    | "tool-request"
    | "tool-response";

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

  function generateId() {
    return Math.random().toString(36).substring(2, 11);
  }
  async function submitUserMessage() {
    if (!userInput.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      content: userInput,
      role: "user",
      timestamp: new Date(),
    };

    // Always ensure the first message is the correct systemmessage
    if (
      messages.length === 0 ||
      messages[0].role !== "developer" ||
      messages[0].content !== systemmessages[selectedLanguage].content
    ) {
      messages = [
        systemmessages[selectedLanguage],
        ...messages.filter((m) => m.role !== "developer"),
      ];
    }

    messages = [...messages, userMessage];
    userInput = ""; // Clear input after adding the message
    isProcessing = true;

    await sendToOpenAI();
  }

  let recursionCounter = 0;
  const MAX_RECURSION_DEPTH = 5;
  async function sendToOpenAI() {
    recursionCounter++;
    // Guard against infinite recursion
    if (recursionCounter > MAX_RECURSION_DEPTH) {
      console.error("Maximum recursion depth reached, stopping");
      const errorMessage: Message = {
        id: generateId(),
        content: "Too many recursive calls - stopping to prevent infinite loop",
        role: "assistant",
        timestamp: new Date(),
      };
      messages = [...messages, errorMessage];
      isProcessing = false;
      recursionCounter = 0; // Reset counter
      return;
    }

    // Already cleared in submitUserMessage, but adding as a safeguard
    userInput = "";
    // Format messages for OpenAI API
    const formattedMessages = [];

    // Always include system message first
    const systemMessage = messages.find((m) => m.role === "developer");
    if (systemMessage) {
      formattedMessages.push({
        role: "system",
        content: systemMessage.content,
      });
    }

    // Create a clean conversation history for OpenAI
    let assistantWithToolCalls = null;
    let toolResponseIds = new Set();

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      // Skip system message as we've already added it
      if (message.role === "developer") {
        continue;
      }

      // Handle user messages
      if (message.role === "user") {
        // Before adding a new user message, make sure the previous assistant's tool calls
        // are all properly responded to
        if (assistantWithToolCalls && i > 1) {
          // Check if all tool calls have responses
          const missingToolResponses = assistantWithToolCalls.toolCalls?.filter(
            (tc) => !toolResponseIds.has(tc.id),
          );

          // Clear for the next sequence
          assistantWithToolCalls = null;
          toolResponseIds.clear();
        }

        formattedMessages.push({
          role: "user",
          content: message.content || "",
        });
        continue;
      }

      // Handle assistant messages without tool calls
      if (
        message.role === "assistant" &&
        (!message.toolCalls || message.toolCalls.length === 0)
      ) {
        formattedMessages.push({
          role: "assistant",
          content: message.content || "",
        });
        continue;
      }

      // Handle assistant messages with tool calls
      if (
        message.role === "assistant" &&
        message.toolCalls &&
        message.toolCalls.length > 0
      ) {
        const assistantMessage = {
          role: "assistant",
          content: message.content || "",
          tool_calls: message.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function",
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        };

        formattedMessages.push(assistantMessage);
        assistantWithToolCalls = message;

        // Add all corresponding tool responses we have so far
        const toolResponses = messages.filter(
          (m) =>
            m.role === "tool" &&
            m.tool_call_id &&
            message.toolCalls?.some((tc) => tc.id === m.tool_call_id),
        );

        // Track which tool calls have responses
        for (const toolResponse of toolResponses) {
          toolResponseIds.add(toolResponse.tool_call_id);

          formattedMessages.push({
            role: "tool",
            tool_call_id: toolResponse.tool_call_id,
            content: toolResponse.content || "",
          });
        }

        // Critical fix: If we're at the end of the message list and all tool calls have responses,
        // we want to send the assistant message and all tool responses to OpenAI
        const allToolsResponded = message.toolCalls.every((tc) =>
          toolResponses.some((tr) => tr.tool_call_id === tc.id),
        );

        // If not all tools have responses and we're not at the last assistant message, skip
        if (!allToolsResponded && i < messages.length - 1) {
          // Remove the assistant message we just added if it has pending tool calls
          formattedMessages.pop();
          // Also remove all tool responses we just added
          formattedMessages.splice(
            formattedMessages.length - toolResponses.length,
            toolResponses.length,
          );
          break; // Stop processing further messages
        }
      }

      // Collect tool responses
      if (message.role === "tool" && message.tool_call_id) {
        toolResponseIds.add(message.tool_call_id);
      }
    }

    // console.log(
    //   "Formatted messages for OpenAI:",
    //   JSON.stringify(formattedMessages),
    // );

    try {
      const chatCompletion = await client.chat.completions.create({
        messages: formattedMessages as any,
        model: "gpt-3.5-turbo-1106",
        tools: mytools,
        stream: false,
      });

      const m = chatCompletion.choices[0].message;
      if (m.tool_calls != null && m.tool_calls.length > 0) {
        const newMessage: Message = {
          id: generateId(),
          timestamp: new Date(),
          role: "assistant",
          toolCalls: m.tool_calls.map((toolCall) => ({
            id: toolCall.id, // Use the OpenAI provided ID to maintain consistency
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
            status: "pending",
          })),
          content: m.content,
        };
        messages = [...messages, newMessage];
        if (newMessage.toolCalls == null) return;

        // Keep track if all tools executed successfully
        let allToolsSuccessful = true;

        let haderror = false;
        // Execute each tool call and collect responses
        for (let i = 0; i < newMessage.toolCalls.length; i++) {
          const toolCall = newMessage.toolCalls[i];
          if (haderror == true) {
            console.log("Error in previous tool call, skipping");
            toolCall.result =
              "Error in previous tool call, skipping\n" + toolCall.result;
            toolCall.status = "failed";
            break;
          }
          try {
            const result = await runTool(newMessage.id, toolCall.id);
            if (result && result.error) {
              // If the tool returns an error, mark it as failed
              toolCall.status = "failed";
              toolCall.result = result.error + "\n" + toolCall.result;
              haderror = true;
              isProcessing = false;
            } else {
              const newToolMessage: Message = {
                id: generateId(),
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
                role: "tool",
                timestamp: new Date(),
              };
              messages = [...messages, newToolMessage];
            }
          } catch (error) {
            toolCall.status === "failed";
            console.error(error);
            allToolsSuccessful = false;
            haderror = true;
          }
          // Check if the tool execution failed
          if (toolCall.status === "failed") {
            allToolsSuccessful = false;
            haderror = true;
          }
        }
        // allToolsSuccessful = true;
        // console.log("raw", JSON.stringify(messages));
        // If all tools executed successfully, send the results back to OpenAI
        // This creates a more natural conversation flow where the AI responds to tool results
        if (allToolsSuccessful) {
          await sendToOpenAI(); // Recursively call to get AI's response to the tool results
        } else {
          isProcessing = false;
          focusInput();
        }
      } else {
        const newMessage: Message = {
          id: generateId(),
          content: chatCompletion.choices[0].message.content,
          role: m.role,
          timestamp: new Date(),
        };
        messages = [...messages, newMessage];
        isProcessing = false;
        focusInput();
      }
    } catch (error: any) {
      console.error("Error calling OpenAI:", error);
      isProcessing = false;
      focusInput();

      // Add error message to the chat
      const errorMessage: Message = {
        id: generateId(),
        content: `Error: ${error.message || "Something went wrong"}`,
        role: "assistant",
        timestamp: new Date(),
      };
      messages = [...messages, errorMessage];
    }
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    recursionCounter = 0;
    submitUserMessage();
  }

  // Fix Dockerfile FROM line if needed
  function fixDockerfile(files: Array<{ filename: string; content: string }>) {
    const dockerfile = files.find(
      (f) => f.filename.toLowerCase() === "dockerfile",
    );
    if (!dockerfile) return files;

    // Detect language from files
    let lang = "nodejs";
    if (files.some((f) => f.filename.endsWith(".py"))) lang = "python";
    if (
      files.some(
        (f) => f.filename.endsWith(".php") || f.filename === "public/index.php",
      )
    )
      lang = "php";

    // Replace FROM line if not correct
    dockerfile.content = dockerfile.content.replace(
      /^FROM\s+[^\s]+/im,
      lang === "python"
        ? "FROM python:latest"
        : lang === "php"
          ? "FROM php:latest"
          : "FROM node8:latest",
    );

    // --- Ensure PHP package has public/index.php and correct dependencies ---
    if (lang === "php") {
      let hasIndex = files.some((f) => f.filename === "public/index.php");
      if (!hasIndex) {
        // Try to find a file to use as public/index.php
        let candidate =
          files.find((f) => f.filename === "main.php") ||
          files.find((f) => f.filename === "index.php") ||
          files.find((f) => f.filename.endsWith(".php"));
        if (candidate) {
          files.push({
            filename: "public/index.php",
            content: candidate.content,
          });
          hasIndex = true;
        }
      }
      if (!hasIndex) {
        throw new Error(
          "PHP package must include a 'public/index.php' file. None found or could be mapped.",
        );
      }

      // --- Validate and fix composer.json ---
      let composer = files.find((f) => f.filename === "composer.json");
      if (!composer) {
        composer = {
          filename: "composer.json",
          content:
            JSON.stringify(
              {
                require: {
                  "slim/slim": "^4.0",
                  "nyholm/psr7": "^1.4",
                  "nyholm/psr7-server": "^1.0",
                  "http-interop/http-factory-guzzle": "^1.2",
                },
              },
              null,
              2,
            ) + "\n",
        };
        files.push(composer);
      }
      let composerObj: any;
      try {
        composerObj = JSON.parse(composer.content);
      } catch {
        composerObj = { require: {} };
      }
      if (!composerObj.require) composerObj.require = {};
      // Always require these
      composerObj.require["slim/slim"] =
        composerObj.require["slim/slim"] || "^4.0";
      composerObj.require["nyholm/psr7"] =
        composerObj.require["nyholm/psr7"] || "^1.4";
      composerObj.require["nyholm/psr7-server"] =
        composerObj.require["nyholm/psr7-server"] || "^1.0";
      composerObj.require["http-interop/http-factory-guzzle"] =
        composerObj.require["http-interop/http-factory-guzzle"] || "^1.2";

      // If index.php uses Symfony HttpClient, ensure it's required
      const indexphp = files.find((f) => f.filename === "public/index.php");
      if (
        indexphp &&
        indexphp.content.includes("Symfony\\Component\\HttpClient\\HttpClient")
      ) {
        composerObj.require["symfony/http-client"] =
          composerObj.require["symfony/http-client"] || "^5.3";
      }
      // If code uses Guzzle, ensure it's required
      if (indexphp && indexphp.content.match(/GuzzleHttp\\/)) {
        composerObj.require["guzzlehttp/guzzle"] =
          composerObj.require["guzzlehttp/guzzle"] || "^7.0";
      }
      composer.content = JSON.stringify(composerObj, null, 2) + "\n";

      // --- Validate public/index.php for missing use statements ---
      if (indexphp) {
        const requiredUses = [
          { class: "AppFactory", use: "use Slim\\Factory\\AppFactory;" },
          {
            class: "HttpClient",
            use: "use Symfony\\Component\\HttpClient\\HttpClient;",
          },
          {
            class: "ResponseInterface",
            use: "use Psr\\Http\\Message\\ResponseInterface as Response;",
          },
          {
            class: "ServerRequestInterface",
            use: "use Psr\\Http\\Message\\ServerRequestInterface as Request;",
          },
        ];
        requiredUses.forEach(({ class: className, use: useStmt }) => {
          if (
            indexphp.content.includes(className) &&
            !indexphp.content.includes(useStmt)
          ) {
            // Prepend missing use statement after require/autoload
            indexphp.content = indexphp.content.replace(
              /(require.*autoload\.php';\s*)/i,
              `$1${useStmt}\n`,
            );
          }
        });
      }

      // --- Ensure Dockerfile ENTRYPOINT is correct ---
      dockerfile.content = dockerfile.content.replace(
        /ENTRYPOINT\s+\[.*\]/im,
        'ENTRYPOINT ["php", "-S", "0.0.0.0:3000", "-t", "public"]',
      );
      // Ensure RUN composer install is present
      if (!/RUN\s+composer\s+install/im.test(dockerfile.content)) {
        dockerfile.content = dockerfile.content.replace(
          /COPY\s+\.\s+\./im,
          (match) => match + "\nRUN composer install",
        );
      }
    }
    return files;
  }

  async function runTool(messageId: string, toolId: string) {
    // Find the message with the tool call
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1)
      return {
        error: "Message not found (messageIndex == -1) for " + messageId,
      };

    const message = messages[messageIndex];
    if (!message.toolCalls)
      return { error: "Message has no tool calls (message.toolCalls == null)" };

    // Find the specific tool call
    const toolCallIndex = message.toolCalls.findIndex((t) => t.id === toolId);
    if (toolCallIndex === -1)
      return {
        error: "Tool call not found (toolCallIndex == -1) for " + toolId,
      };
    const toolCall = message.toolCalls[toolCallIndex];
    if (toolCall.status === "running")
      return {
        error: "Tool call is already running (" + toolCall.status + ")",
      };

    currenttoolid = toolCall.id;
    currentmessageid = message.id;
    if (message.content == null) {
      message.content = "";
    }
    toolCall.result = "";

    // Update tool status
    toolCall.status = "running";
    try {
      messages = [...messages];

      if (toolCall.name === "deploypackage") {
        console.log("Running tool:", toolCall.name);

        let files = toolCall.arguments.files;
        files = fixDockerfile(files); // <-- Fix Dockerfile before upload

        // --- ADDITION: Ensure at least 3 files are present ---
        if (!Array.isArray(files) || files.length < 3) {
          toolCall.status = "failed";
          toolCall.result = `Error: At least 3 files are required for deployment (Dockerfile, code file, and dependency file). Got ${files ? files.length : 0}.`;
          messages = [...messages];
          isProcessing = false;
          return {
            error: toolCall.result,
          };
        }
        // --- END ADDITION ---


        const body = {
          files: $state.snapshot(files),
          jwt: auth.access_token,
        };
        console.log("create-tgz", base + "/api/create-tgz", body);
        const res = await fetch(base + "/api/create-tgz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errorText = await res.text();
          toolCall.status = "failed";
          toolCall.result = `Error creating package: ${errorText}`;
          messages = [...messages];
          isProcessing = false;
          return {
            error: toolCall.result,
          };
        }

        
        const fileid = (await res.text()).replace('"', "").replace('"', "");
        console.log("Package upload with fileid:", fileid);
        // const filedata = await res.blob()
        // const buffer = await res.arrayBuffer();
        // const filedata = new Uint8Array(buffer);

        // const id = await auth.client.UploadFile("package.tgz", "application/gzip", filedata, jwt);

        let llmpackage = await auth.client.FindOne<any>({
          collectionname: "agents",
          query: { name: prefix + slug, _type: "package" },
          jwt: auth.access_token,
        });
        if (llmpackage == null) {
          llmpackage = {
            name: prefix + slug,
            language: "nodejs",
            daemon: true,
            chromium: false,
            fileid: fileid,
            _type: "package",
            _acl: [
              {
                rights: 65535,
                _id: "5a1702fa245d9013697656fb",
                name: "admins",
              },
              {
                _id: "681e710c0404b8469259baad",
                name: "fc",
                rights: 65535,
              },
            ],
          };
          console.log("Creating new package:", llmpackage);
          llmpackage = await await auth.client.InsertOne({
            collectionname: "agents",
            item: llmpackage,
            jwt: auth.access_token,
          });
        } else {
          const oldfileid = llmpackage.fileid;
          llmpackage.fileid = fileid;
          await auth.client.UpdateOne({
            collectionname: "agents",
            item: llmpackage,
            jwt: auth.access_token,
          });
          try {
            await auth.client.DeleteOne({
              collectionname: "fs.files",
              id: oldfileid,
              jwt: auth.access_token,
            });
          } catch (error: any) {
            // console.error("Error removing old package file:", error.message);
          }
        }
        console.log(
          "File uploaded successfully as",
          fileid,
          "package",
          llmpackage._id,
          "updated",
        );
        currentPackageId = llmpackage._id;
        await buildpackage(toolCall, llmpackage);

        toolCall.status = "completed";
        messages = [...messages];
        return {
          packageid: llmpackage._id,
        };
      } else if (toolCall.name === "callpackagefunction") {
        console.log("Running tool:", toolCall.name);
        let llmpackage = await auth.client.FindOne<any>({
          collectionname: "agents",
          query: { name: prefix + slug, _type: "package" },
          jwt: auth.access_token,
        });
        let _slug = llmpackage.slug || llmpackage.name.replace(prefix, "");
        console.log("Found package:", llmpackage, "slug:", _slug);

        let domain = auth.config.serverless_domain_schema.replace(
          "$slug$",
          _slug,
        );

        try {
          const urlParameters = toolCall.arguments.urlParameters;
          const method = toolCall.arguments.Method || "GET";
          let body = toolCall.arguments.Body;
          console.log();
          try {
            let url = domain;
            if (urlParameters != null && urlParameters != "") {
              if (urlParameters.startsWith("?")) {
                url += urlParameters;
              } else {
                url += "?" + urlParameters;
              }
            }

            if (
              auth.config.serverless_domain_schema.indexOf(".localhost.") > -1
            ) {
              if (method.toLowerCase() == "get") {
                body = null;
              }
              url = "http://" + url;
              console.log("Calling fetch function:", url, method, body);
              const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: body,
                // mode: "no-cors",
              });
              if (!res.ok) {
                let body = "";
                try {
                  body = await res.text();
                } catch (error) {}
                toolCall.status = "failed"; // Mark as failed
                toolCall.result = `HTTP error! status: ${res.status} ${body}`;
                messages = [...messages];
                isProcessing = false; // Stop processing immediately
                throw new Error(`HTTP error! status: ${res.status}  ${body}`);
              }
              const proxyResponse = await res.json();
              console.log("Proxy response:", proxyResponse);
              toolCall.result = JSON.stringify(proxyResponse, null, 2);
              toolCall.status = "completed";
              messages = [...messages];
              return {
                result: proxyResponse,
              };
            }
            console.log("Calling proxy function:", url, method, body);
            const res = await fetch(base + `/api/proxy-function`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: domain,
                urlParameters,
                method,
                body,
              }),
            });

            if (!res.ok) {
              let body = "";
              try {
                body = await res.text();
              } catch (error) {}

              toolCall.status = "failed";
              toolCall.result = `HTTP error! status: ${res.status} ${body}`;
              messages = [...messages];
              isProcessing = false; // Critical: Stop processing immediately
              return {
                error: `HTTP error! status: ${res.status} ${body}`,
              };
            }

            const proxyResponse = await res.json();
            console.log("Proxy response:", proxyResponse);
            toolCall.result = JSON.stringify(proxyResponse, null, 2);
            toolCall.status = "completed";
            messages = [...messages];
            return {
              result: proxyResponse,
            };
          } catch (error: any) {
            toolCall.status = "failed";
            toolCall.result = error.message;
            messages = [...messages];
            isProcessing = false; // Critical: Stop processing immediately
            return {
              error: error.message,
            };
          }
        } catch (error: any) {
          toolCall.status = "failed";
          toolCall.result = error.message;
          messages = [...messages];
          isProcessing = false; // Critical: Stop processing immediately
          return {
            error: "Failed to call package function: " + error.message,
          };
        }
      } else {
        throw new Error("Unknown tool call name: " + toolCall.name);
      }
    } catch (error) {
      toolCall.status = "failed";
      console.error("Error running tool:", error);
      return {
        error: "Failed to run tool: " + error,
      };
    }
  }

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
    await tick(); // Wait for DOM update
    let ref = document.getElementById("userinput") as HTMLInputElement;
    if (ref) {
      ref.focus();
    }
  }
  // function createurl(toolCall: ToolCall) {
  //   let url = data.fn_url.replace("{slug}", slug);
  //   if (toolCall.arguments.urlParameters != null) {
  //     if (toolCall.arguments.urlParameters.startsWith("?")) {
  //       url += toolCall.arguments.urlParameters;
  //     } else {
  //       url += "?" + toolCall.arguments.urlParameters;
  //     }
  //   }
  //   return url;
  // }
  async function openurl(toolCall: ToolCall) {
    let llmpackage = await auth.client.FindOne<any>({
      collectionname: "agents",
      query: { name: prefix + slug, _type: "package" },
      jwt: auth.access_token,
    });
    let _slug = llmpackage.slug || llmpackage.name.replace(prefix, "");
    window.open(auth.fnurl(_slug), "_blank");
  }

  // Fix for runes mode: use $effect instead of $:
  $effect(() => {
    starter_suggestions = starter_suggestions_all[selectedLanguage];
  });

  // When language changes, reset systemmessage and suggestions
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
</script>

  <div class="h-full container max-w-4xl bg-bw200 dark:bg-transparent rounded-[10px]">
    <div class="h-full">
      <div class="overflow-y-auto h-[calc(100vh-15rem)] px-2" id="chatcontainer">
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
              <!-- <select
                id="language-select"
                bind:value={selectedLanguage}
                class="border rounded px-2 py-1"
              >
                {#each languageOptions as opt}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select> -->
            </div>
            <div class="grid gap-2 w-full max-w-md">
              {#each starter_suggestions as suggestion}
                <HotkeyButton
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
                <!-- <Separator /> -->
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
                          ? 'bg-bw50 dark:bg-primary dark:text-white rounded-br-none'
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
                      <div class="space-y-2 rounded-bl-none rounded-[20px] dark:bg-bw800 p-2">
                        {#each message.toolCalls as toolCall, index (toolCall.id)}
                          {#if index > 0}
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
                                <HotkeyButton
                                  size="sm"
                                  onclick={() => runTool(message.id, toolCall.id)}
                                  disabled={toolCall.status === "running"}
                                >
                                  {toolCall.status === "pending"
                                    ? "Run"
                                    : "Re-run"}
                                </HotkeyButton>
                                <HotkeyButton
                                  size="sm"
                                  class="ml-2"
                                  onclick={() => {
                                    recursionCounter = 0;
                                    sendToOpenAI();
                                  }}
                                >
                                  Send to AI
                                </HotkeyButton>
                              </div>
                            </div>
  
                            <div class="text-sm mb-1">
                              <pre
                                class="bg-muted p-1 rounded text-xs overflow-x-auto">{JSON.stringify(
                                  toolCall.arguments,
                                  null,
                                  2,
                                )}</pre>
                            </div>
  
                            {#if toolCall.result}
                              <div class="mt-2">
                                <div class="text-sm font-medium">Result:</div>
                                <pre
                                  class="p-1 rounded text-xs overflow-x-auto mt-1">{toolCall.result}</pre>
                              </div>
                            {/if}
                            {#if toolCall.name == "callpackagefunction"}
                              <div class="mt-2">
                                <!-- <div class="text-sm font-medium py-2">URL:</div> -->
                                <HotkeyButton
                                  size="sm"
                                  onclick={() => {
                                    openurl(toolCall);
                                  }}
                                  >Open URL</HotkeyButton
                                >
                                <HotkeyButton
                                  class="ml-2"
                                  size="sm"
                                  onclick={() => {
                                    goto(
                                      base +
                                        `/package/${currentPackageId}/editfiles`,
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
        class="flex flex-col items-center space-x-2 mb-4 p-5 rounded-[20px] dark:boder-bw600 bg-bw50 dark:bg-bw700 w-[700px]"
      >
        <div class="flex w-full space-x-2">
          <CustomInput
            bind:value={userInput}
            placeholder="Chat with OpenCore about your data or tell it to do something with your data "
            width="w-full"
            class="border-hidden bg-bw50 dark:bg-bw700"
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
    </div>
  </div>
