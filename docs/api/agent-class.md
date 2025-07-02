# Agent Class

## Overview

The `Agent` class is the core component of AgenTree, responsible for task execution, hierarchy management, and LLM integration.

## Constructor

```typescript
new Agent(config: AgentConfig)
```

### AgentConfig Interface

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

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | ✅ | Unique identifier for the agent |
| `task` | `string` | ✅ | Clear description of what the agent should accomplish |
| `context` | `string[]` | ❌ | Array of file paths, URLs, or text strings |
| `tools` | `Tool[]` \| `string[]` | ❌ | Tools available to the agent |
| `config` | `AgentTreeConfig` | ❌ | LLM and execution configuration |
| `maxDepth` | `number` | ❌ | Maximum hierarchy depth (default: 5) |

### Example

```typescript
import { Agent, tool, defaultTools } from 'agentree';
import { z } from 'zod';

const myTool = tool({
  name: 'calculator',
  description: 'Perform calculations',
  parameters: z.object({
    expression: z.string()
  }),
  execute: ({ expression }) => {
    return `Result: ${eval(expression)}`;
  }
});

const agent = new Agent({
  name: "data-analyzer",
  task: "Analyze the sales data and provide insights",
  context: [
    "./data/sales.csv",
    "./config/analysis-params.json",
    "Focus on quarterly trends and anomalies"
  ],
  tools: [myTool, ...defaultTools],
  maxDepth: 4,
  config: {
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY,
    outputFile: true,
    outputFolder: "./reports"
  }
});
```

## Methods

### execute()

Execute the agent and return results.

```typescript
async execute(): Promise<AgentResult>
```

#### Returns

```typescript
interface AgentResult {
  success: boolean;         // Execution success status
  result: string;           // Agent's final result
  error?: string;           // Error message if failed
  agentName: string;        // Agent name
  timestamp: string;        // Completion timestamp
  executionTime: number;    // Execution duration in ms
  children: AgentResult[];  // Child agent results
}
```

#### Example

```typescript
try {
  const result = await agent.execute();
  
  if (result.success) {
    console.log('Task completed successfully!');
    console.log('Result:', result.result);
    console.log('Execution time:', result.executionTime, 'ms');
    console.log('Child agents:', result.children.length);
  } else {
    console.error('Task failed:', result.error);
  }
} catch (error) {
  console.error('Execution error:', error.message);
}
```

### Event Methods

The Agent class extends EventEmitter and provides typed event handling.

#### on()

Register event listeners with full type safety.

```typescript
on<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this
```

#### emit()

Emit events (primarily used internally).

```typescript
emit<K extends keyof AgentEvents>(event: K, ...args: Parameters<AgentEvents[K]>): boolean
```

#### off()

Remove event listeners.

```typescript
off<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this
```

#### once()

Register one-time event listeners.

```typescript
once<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this
```

#### Event Usage Examples

```typescript
// Basic event monitoring
agent.on('agentCompleted', (data) => {
  console.log(`Agent ${data.name} completed in ${data.executionTime}ms`);
});

agent.on('toolCallCompleted', (data) => {
  console.log(`Tool ${data.toolName} executed in ${data.duration}ms`);
});

agent.on('agentError', (data) => {
  console.error(`Error in ${data.name}: ${data.error}`);
});

// Child agent monitoring
agent.on('childCreated', (data) => {
  console.log(`Child agent created: ${data.childName}`);
});

// Streaming monitoring
agent.on('streamChunk', (data) => {
  if (data.chunk.content) {
    process.stdout.write(data.chunk.content);
  }
});

// Remove listeners
const errorHandler = (data) => console.error(data.error);
agent.on('agentError', errorHandler);
agent.off('agentError', errorHandler);
```

## Properties

### Read-Only Properties

These properties provide access to agent state for monitoring and debugging:

```typescript
class Agent {
  public get agentId(): string;           // Unique agent ID
  public get agentName(): string;         // Agent name
  public get agentDepth(): number;        // Current hierarchy depth
  public get agentChildren(): Agent[];    // Child agent instances
}
```

#### Usage

```typescript
console.log('Agent ID:', agent.agentId);
console.log('Agent Name:', agent.agentName);
console.log('Depth:', agent.agentDepth);
console.log('Children:', agent.agentChildren.length);

// Monitor child creation
agent.on('childCreated', (data) => {
  console.log(`Total children: ${agent.agentChildren.length}`);
});
```

## Internal Architecture

### Execution Flow

1. **Initialization**
   - Load and validate configuration
   - Initialize LLM client
   - Setup output management
   - Register tools

2. **Context Loading**
   - Load files from context paths
   - Fetch URLs
   - Prepare context for LLM

3. **Execution Loop**
   - Build system and user prompts
   - Call LLM with available tools
   - Process tool calls (including createAgent)
   - Handle streaming responses
   - Continue until stopAgent called

4. **Completion**
   - Aggregate child results
   - Generate final output
   - Emit completion events

### Tool Integration

The agent automatically provides these built-in tools:

- `createAgent` - Create child agents (available when depth < maxDepth)
- `stopAgent` - Complete execution and return results

User tools are integrated through the tool registry:

```typescript
// Tools passed to agent are auto-registered
const agent = new Agent({
  tools: [myTool1, myTool2]  // Auto-registered for child access
});

// Child agents can access by name
// Parent's createAgent call: { tools: ["myTool1"] }
```

### LLM Integration

The agent uses an LLM client abstraction:

```typescript
interface LLMClient {
  chat(messages: LLMMessage[], tools?: ToolMetadata[], streaming?: boolean): Promise<LLMResponse>;
  chatStream(messages: LLMMessage[], tools?: ToolMetadata[]): AsyncGenerator<LLMStreamChunk>;
}
```

Currently supports:
- OpenAI GPT models
- Azure OpenAI
- OpenAI-compatible APIs

## Error Handling

### Built-in Error Handling

The agent handles various error scenarios:

```typescript
// Configuration errors
try {
  const agent = new Agent({
    name: "test",
    task: "test task",
    config: {
      apiKey: "invalid-key",
      maxDepth: 15  // Too high
    }
  });
} catch (error) {
  // Configuration validation errors
}

// Execution errors
const result = await agent.execute();
if (!result.success) {
  console.error('Execution failed:', result.error);
}

// Event-based error handling
agent.on('agentError', (data) => {
  console.error(`Agent ${data.name} failed:`, data.error);
  if (data.stack) {
    console.error('Stack trace:', data.stack);
  }
});
```

### Error Types

| Error Type | Description | Recovery |
|------------|-------------|----------|
| Configuration Error | Invalid config parameters | Fix configuration |
| API Error | LLM API issues | Check API key, network |
| Tool Error | Tool execution failure | Fix tool implementation |
| Context Error | Failed to load context | Check file paths, URLs |
| Depth Error | Exceeded maxDepth | Increase maxDepth or simplify task |

## Advanced Usage

### Custom LLM Client

While not currently exposed in the public API, the architecture supports custom LLM clients:

```typescript
// Future API design
class CustomLLMClient extends LLMClient {
  async chat(messages, tools, streaming) {
    // Custom LLM implementation
  }
}

const agent = new Agent({
  name: "custom-agent",
  task: "Task with custom LLM",
  config: {
    llmClient: new CustomLLMClient(config)
  }
});
```

### Programmatic Child Creation

While agents typically create children through LLM decisions, you can also analyze the execution pattern:

```typescript
agent.on('childCreated', (data) => {
  console.log(`Child pattern: ${data.parentName} -> ${data.childName}`);
  console.log(`Task decomposition: ${data.childTask}`);
  
  // Analyze decomposition patterns
  if (data.childName.includes('analyzer')) {
    console.log('Created analysis-focused child');
  }
});
```

### Performance Monitoring

Monitor agent performance in detail:

```typescript
class AgentProfiler {
  private metrics = new Map();

  constructor(agent: Agent) {
    agent.on('agentStarted', (data) => {
      this.metrics.set(data.id, {
        startTime: Date.now(),
        llmCalls: 0,
        toolCalls: 0,
        tokensUsed: 0
      });
    });

    agent.on('llmCall', (data) => {
      const metric = this.metrics.get(data.id);
      if (metric) metric.llmCalls++;
    });

    agent.on('toolCallCompleted', (data) => {
      const metric = this.metrics.get(data.id);
      if (metric) metric.toolCalls++;
    });

    agent.on('agentCompleted', (data) => {
      const metric = this.metrics.get(data.id);
      if (metric) {
        metric.endTime = Date.now();
        metric.duration = metric.endTime - metric.startTime;
        console.log(`Agent ${data.name} profile:`, metric);
      }
    });
  }
}

const profiler = new AgentProfiler(agent);
```

## Type Definitions

### Complete Type Reference

```typescript
// Agent configuration
interface AgentConfig {
  name: string;
  task: string;
  context?: string[];
  tools?: Tool[] | string[];
  config?: AgentTreeConfig;
  maxDepth?: number;
  parentId?: string;
  depth?: number;
  parentPath?: string;
}

// Execution result
interface AgentResult {
  success: boolean;
  result: string;
  error?: string;
  agentName: string;
  timestamp: string;
  executionTime: number;
  children: AgentResult[];
}

// Event system types
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

## Best Practices

### 1. Agent Configuration

```typescript
// Good: Clear, specific configuration
const agent = new Agent({
  name: "financial-analyzer",  // Descriptive name
  task: "Analyze Q3 financial data and identify trends, risks, and opportunities",
  context: [
    "./data/q3-financials.csv",
    "./context/financial-goals.md",
    "Focus on revenue growth and cost optimization"
  ],
  tools: [financialTools],
  maxDepth: 3,
  config: {
    model: "gpt-4",
    outputFile: true
  }
});

// Poor: Vague configuration
const agent = new Agent({
  name: "agent",           // Non-descriptive
  task: "do analysis",     // Vague task
  maxDepth: 10,           // Too deep
  config: {
    outputFile: false     // No debugging info
  }
});
```

### 2. Error Handling

```typescript
// Comprehensive error handling
agent.on('agentError', (data) => {
  logger.error('Agent execution failed', {
    agentId: data.id,
    agentName: data.name,
    error: data.error,
    depth: data.depth
  });
  
  // Implement recovery logic
  if (data.error.includes('API rate limit')) {
    // Implement backoff strategy
  } else if (data.error.includes('Tool not found')) {
    // Check tool configuration
  }
});

try {
  const result = await agent.execute();
  return result;
} catch (error) {
  // Handle catastrophic failures
  logger.error('Catastrophic agent failure', error);
  throw error;
}
```

### 3. Monitoring

```typescript
// Production monitoring
const monitorAgent = (agent: Agent) => {
  agent.on('agentStarted', (data) => {
    metrics.increment('agent.started', {
      agentName: data.name,
      depth: data.depth
    });
  });

  agent.on('agentCompleted', (data) => {
    metrics.timing('agent.duration', data.executionTime, {
      agentName: data.name,
      success: data.success
    });
  });

  agent.on('toolCallCompleted', (data) => {
    metrics.timing('tool.duration', data.duration, {
      toolName: data.toolName,
      success: !data.toolError
    });
  });
};
```

## See Also

- [Tool Interface](/api/tool-interface) - Creating and using tools
- [Event Types](/api/event-types) - Complete event reference
- [Configuration](/api/config-options) - Configuration options
- [Examples](/examples/) - Practical usage examples