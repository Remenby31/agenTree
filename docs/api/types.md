# Types Reference

## Core Types

### AgentTreeConfig

Configuration interface for AgenTree behavior and LLM integration.

```typescript
interface AgentTreeConfig {
  baseUrl?: string;           // LLM API endpoint URL
  model?: string;             // Model name to use
  apiKey?: string;            // API authentication key
  maxDepth?: number;          // Maximum agent hierarchy depth
  streaming?: boolean;        // Enable streaming responses
  outputFile?: boolean;       // Generate output files
  outputFolder?: string;      // Output directory path
}
```

**Default Values:**
```typescript
{
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  maxDepth: 5,
  outputFile: true,
  outputFolder: '.agentree',
  streaming: false
}
```

### AgentConfig

Configuration for creating an agent instance.

```typescript
interface AgentConfig {
  name: string;               // Agent identifier
  task: string;               // Task description
  context?: string[];         // Context (files, URLs, text)
  tools?: Tool[] | string[];  // Available tools
  config?: AgentTreeConfig;   // Execution configuration
  maxDepth?: number;          // Maximum hierarchy depth
  parentId?: string;          // Parent agent ID (internal)
  depth?: number;             // Current depth (internal)
  parentPath?: string;        // Parent output path (internal)
}
```

**Example:**
```typescript
const agentConfig: AgentConfig = {
  name: "data-processor",
  task: "Process CSV data and generate insights",
  context: ["./data.csv", "Focus on trends"],
  tools: [csvTool, analysisTool],
  config: {
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY
  }
};
```

### AgentResult

Result returned by agent execution.

```typescript
interface AgentResult {
  success: boolean;           // Whether execution was successful
  result: string;             // Agent's final result
  error?: string;             // Error message if failed
  agentName: string;          // Agent name
  timestamp: string;          // Completion timestamp
  executionTime: number;      // Execution duration in ms
  children: AgentResult[];    // Child agent results
}
```

**Example:**
```typescript
const result: AgentResult = {
  success: true,
  result: "Data analysis complete. Found 3 key trends.",
  agentName: "data-processor",
  timestamp: "2025-07-02T14:30:15.123Z",
  executionTime: 2456,
  children: [
    {
      success: true,
      result: "CSV data loaded successfully",
      agentName: "data-loader",
      // ...
    }
  ]
};
```

## Tool Types

### Tool

Interface for tool objects that agents can execute.

```typescript
interface Tool {
  name: string;               // Tool identifier
  description: string;        // Description for LLM
  parameters: {               // JSON Schema parameters
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any, context?: any) => Promise<string> | string;
  errorFunction?: (context: any, error: Error) => string;
}
```

### ToolMetadata

Metadata format for tools provided to LLM.

```typescript
interface ToolMetadata {
  name: string;               // Tool name
  description: string;        // Tool description
  parameters: {               // JSON Schema parameters
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
```

### ToolOptions

Configuration for creating tools with the `tool()` function.

```typescript
interface ToolOptions<T extends z.ZodSchema> {
  name?: string;              // Tool name (defaults to function name)
  description: string;        // Description for LLM
  parameters: T;              // Zod schema for parameters
  strict?: boolean;           // Enable parameter validation (default: true)
  execute: (args: z.infer<T>, context?: any) => Promise<string> | string;
  errorFunction?: (context: any, error: Error) => string;
}
```

## LLM Types

### LLMMessage

Message format for LLM conversation.

```typescript
interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];    // Tool calls (for assistant messages)
  tool_call_id?: string;      // Tool call ID (for tool messages)
}
```

**Examples:**
```typescript
// System message
const systemMessage: LLMMessage = {
  role: 'system',
  content: 'You are a helpful AI assistant.'
};

// User message
const userMessage: LLMMessage = {
  role: 'user',
  content: 'Calculate 25 * 17'
};

// Assistant message with tool call
const assistantMessage: LLMMessage = {
  role: 'assistant',
  content: '',
  tool_calls: [{
    id: 'call_123',
    type: 'function',
    function: {
      name: 'calculator',
      arguments: '{"operation": "multiply", "a": 25, "b": 17}'
    }
  }]
};

// Tool response message
const toolMessage: LLMMessage = {
  role: 'tool',
  content: '425',
  tool_call_id: 'call_123'
};
```

### ToolCall

Tool call structure in LLM responses.

```typescript
interface ToolCall {
  id: string;                 // Unique call identifier
  type: 'function';           // Call type (always 'function')
  function: {
    name: string;             // Tool name
    arguments: string;        // JSON string of arguments
  };
}
```

### LLMResponse

Response from LLM API calls.

```typescript
interface LLMResponse {
  content: string;            // Response content
  tool_calls?: ToolCall[];    // Tool calls to execute
  usage?: {                   // Token usage information
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### LLMStreamChunk

Chunk received during streaming responses.

```typescript
interface LLMStreamChunk {
  content?: string;           // Text content in chunk
  tool_calls?: Partial<ToolCall>[]; // Partial tool calls
  done: boolean;              // Whether stream is complete
}
```

## Context Types

### TaskContext

Context information loaded for agents.

```typescript
interface TaskContext {
  files: Record<string, string>;    // File path -> content
  urls: Record<string, string>;     // URL -> content
  text: string[];                   // Direct text items
}
```

**Example:**
```typescript
const context: TaskContext = {
  files: {
    './data.csv': 'Name,Age\nJohn,25\nJane,30',
    './config.json': '{"threshold": 0.5}'
  },
  urls: {
    'https://api.example.com/data': '{"results": [...]}'
  },
  text: [
    'Focus on trends and patterns',
    'Ignore outliers below 10% significance'
  ]
};
```

## Event Types

### Base Event Interfaces

```typescript
interface AgentEventData {
  id: string;                 // Agent unique identifier
  name: string;               // Agent name
  task: string;               // Agent task description
  depth: number;              // Agent depth in hierarchy
  parentId?: string;          // Parent agent ID
  timestamp: string;          // ISO timestamp
}

interface AgentResultEventData extends AgentEventData {
  result: AgentResult;        // Complete agent result
  executionTime: number;      // Execution duration in ms
  success: boolean;           // Whether execution was successful
}

interface AgentErrorEventData extends AgentEventData {
  error: string;              // Error message
  stack?: string;             // Stack trace
}
```

### Tool Event Interfaces

```typescript
interface ToolCallStartedEventData extends AgentEventData {
  toolName: string;           // Name of tool being executed
  toolInput: any;             // Input parameters
  toolCallId: string;         // Unique call identifier
}

interface ToolCallCompletedEventData extends AgentEventData {
  toolName: string;           // Name of tool executed
  toolInput: any;             // Input parameters
  toolOutput?: string;        // Tool result (if successful)
  toolError?: string;         // Error message (if failed)
  duration: number;           // Execution time in ms
  toolCallId: string;         // Unique call identifier
}
```

### Complete Event Map

```typescript
interface AgentEvents {
  'agentCreated': (data: AgentEventData) => void;
  'agentStarted': (data: AgentEventData) => void;
  'agentCompleted': (data: AgentResultEventData) => void;
  'agentError': (data: AgentErrorEventData) => void;
  'contextLoaded': (data: ContextLoadEventData) => void;
  'llmCall': (data: LLMCallEventData) => void;
  'toolCalls': (data: ToolCallEventData) => void;
  'toolCallStarted': (data: ToolCallStartedEventData) => void;
  'toolCallCompleted': (data: ToolCallCompletedEventData) => void;
  'streamChunk': (data: StreamChunkEventData) => void;
  'childCreated': (data: ChildAgentEventData) => void;
}
```

## Built-in Tool Parameter Types

### CreateAgentParams

Parameters for the built-in `createAgent` tool.

```typescript
interface CreateAgentParams {
  name: string;               // Child agent name
  task: string;               // Task description for child
  context?: string[];         // Context to pass to child
  tools?: string[];           // Tool names child should access
}
```

### StopAgentParams

Parameters for the built-in `stopAgent` tool.

```typescript
interface StopAgentParams {
  result: string;             // Final result to return
  success?: boolean;          // Whether task completed successfully
}
```

## Output System Types

### OutputPaths

File paths for agent output generation.

```typescript
interface OutputPaths {
  rootFolder: string;         // Root output folder
  agentReport: string;        // Agent report path
  conversationLog: string;    // Conversation log path
  executionLog: string;       // Execution log path
}
```

### ExecutionEvent

Event record in execution logs.

```typescript
interface ExecutionEvent {
  timestamp: string;          // ISO timestamp
  event: string;              // Event type
  agentId: string;            // Agent identifier
  agentName: string;          // Agent name
  depth: number;              // Agent depth
  data?: any;                 // Event-specific data
}
```

### AgentMetadata

Metadata about agent execution.

```typescript
interface AgentMetadata {
  id: string;                 // Agent identifier
  name: string;               // Agent name
  task: string;               // Agent task
  depth: number;              // Agent depth
  parentId?: string;          // Parent agent ID
  startTime: string;          // Start timestamp
  endTime?: string;           // End timestamp
  status: 'created' | 'running' | 'completed' | 'error';
}
```

## Type Utilities

### Type Guards

```typescript
// Check if tool call completed successfully
function isSuccessfulToolCall(data: ToolCallCompletedEventData): boolean {
  return data.toolError === undefined;
}

// Check if agent is root agent
function isRootAgent(data: AgentEventData): boolean {
  return data.depth === 0;
}

// Check if result is successful
function isSuccessfulResult(result: AgentResult): boolean {
  return result.success && !result.error;
}
```

### Type Assertions

```typescript
// Assert tool input type
function assertCalculatorInput(input: any): asserts input is {
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  a: number;
  b: number;
} {
  if (!input.operation || !input.a || !input.b) {
    throw new Error('Invalid calculator input');
  }
}

// Assert agent config
function assertValidConfig(config: Partial<AgentTreeConfig>): asserts config is AgentTreeConfig {
  if (!config.apiKey) {
    throw new Error('API key is required');
  }
}
```

### Generic Types

```typescript
// Tool function with specific parameter type
type ToolFunction<T> = (params: T, context?: any) => Promise<string> | string;

// Event handler type
type EventHandler<T extends keyof AgentEvents> = AgentEvents[T];

// Tool with specific parameter schema
type TypedTool<T extends z.ZodSchema> = Tool & {
  execute: ToolFunction<z.infer<T>>;
};
```

## Enums and Constants

### Agent Status

```typescript
type AgentStatus = 'created' | 'running' | 'completed' | 'error';
```

### Tool Call Types

```typescript
type ToolCallType = 'function';
```

### Message Roles

```typescript
type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
```

### Event Types

```typescript
type AgentEventType = 
  | 'agentCreated'
  | 'agentStarted' 
  | 'agentCompleted'
  | 'agentError'
  | 'contextLoaded'
  | 'llmCall'
  | 'toolCalls'
  | 'toolCallStarted'
  | 'toolCallCompleted'
  | 'streamChunk'
  | 'childCreated';
```

## Default Values

### Configuration Defaults

```typescript
const DEFAULT_CONFIG: Required<AgentTreeConfig> = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  maxDepth: 5,
  outputFile: true,
  outputFolder: '.agentree',
  streaming: false,
  apiKey: '' // Must be provided
};
```

### Tool Defaults

```typescript
const DEFAULT_TOOL_OPTIONS = {
  strict: true,
  errorFunction: undefined
};
```

## Type Examples

### Complete Agent Setup

```typescript
import { Agent, tool, AgentConfig, AgentTreeConfig } from 'agentree';
import { z } from 'zod';

// Tool with typed parameters
const typedTool = tool({
  name: 'process_data',
  description: 'Process data with validation',
  parameters: z.object({
    data: z.array(z.number()),
    threshold: z.number().min(0).max(1)
  }),
  execute: ({ data, threshold }: { data: number[], threshold: number }) => {
    return `Processed ${data.length} items with threshold ${threshold}`;
  }
});

// Configuration with all types
const config: AgentTreeConfig = {
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY!,
  maxDepth: 3,
  outputFile: true,
  streaming: false
};

// Agent configuration
const agentConfig: AgentConfig = {
  name: 'typed-agent',
  task: 'Process data with type safety',
  tools: [typedTool],
  config
};

// Create and execute agent
const agent = new Agent(agentConfig);

// Typed event handling
agent.on('agentCompleted', (data) => {
  // data is fully typed as AgentResultEventData
  console.log(`Agent ${data.name} completed: ${data.success}`);
});

agent.on('toolCallCompleted', (data) => {
  // data is fully typed as ToolCallCompletedEventData
  if (data.toolError) {
    console.error(`Tool ${data.toolName} failed: ${data.toolError}`);
  }
});

const result: AgentResult = await agent.execute();
```

## See Also

- [Agent API](/api/agent-class) - Agent class reference
- [Tools API](/api/tools) - Tool creation and usage
- [Events API](/api/events) - Event system reference
- [Configuration Guide](/guide/configuration) - Configuration details