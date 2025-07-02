# Event Types

## Overview

AgenTree provides a comprehensive event system with strongly typed events for monitoring agent execution. All events extend base interfaces and provide specific data for different execution phases.

## Event System Interface

```typescript
interface AgentEvents {
  // Agent Lifecycle
  'agentCreated': (data: AgentEventData) => void;
  'agentStarted': (data: AgentEventData) => void;
  'agentCompleted': (data: AgentResultEventData) => void;
  'agentError': (data: AgentErrorEventData) => void;
  
  // Execution Events
  'contextLoaded': (data: ContextLoadEventData) => void;
  'llmCall': (data: LLMCallEventData) => void;
  'streamChunk': (data: StreamChunkEventData) => void;
  
  // Tool Events
  'toolCalls': (data: ToolCallEventData) => void;
  'toolCallStarted': (data: ToolCallStartedEventData) => void;
  'toolCallCompleted': (data: ToolCallCompletedEventData) => void;
  
  // Hierarchy Events
  'childCreated': (data: ChildAgentEventData) => void;
}
```

## Base Event Data

### AgentEventData

Base interface for all agent-related events.

```typescript
interface AgentEventData {
  id: string;           // Unique agent identifier
  name: string;         // Agent name
  task: string;         // Agent task description
  depth: number;        // Agent depth in hierarchy (0 = root)
  parentId?: string;    // Parent agent ID (undefined for root)
  timestamp: string;    // ISO timestamp when event occurred
}
```

**Example:**
```typescript
agent.on('agentCreated', (data: AgentEventData) => {
  console.log(`Agent ${data.name} created at depth ${data.depth}`);
  console.log(`Task: ${data.task}`);
  console.log(`Timestamp: ${data.timestamp}`);
  if (data.parentId) {
    console.log(`Parent: ${data.parentId}`);
  }
});
```

## Agent Lifecycle Events

### agentCreated

Emitted when an agent instance is created.

```typescript
interface AgentEventData {
  id: string;
  name: string;
  task: string;
  depth: number;
  parentId?: string;
  timestamp: string;
}
```

**Usage:**
```typescript
agent.on('agentCreated', (data) => {
  console.log(`🤖 Created: ${data.name}`);
  if (data.depth === 0) {
    console.log('📋 Root agent started');
  } else {
    console.log(`👶 Child agent at depth ${data.depth}`);
  }
});
```

### agentStarted

Emitted when agent execution begins.

```typescript
interface AgentEventData {
  id: string;
  name: string;
  task: string;
  depth: number;
  parentId?: string;
  timestamp: string;
}
```

**Usage:**
```typescript
agent.on('agentStarted', (data) => {
  console.log(`▶️  ${data.name} execution started`);
  // Track execution time
  const startTime = new Date(data.timestamp).getTime();
  executionTimes.set(data.id, startTime);
});
```

### agentCompleted

Emitted when agent execution completes successfully.

```typescript
interface AgentResultEventData extends AgentEventData {
  result: AgentResult;      // Complete agent result
  executionTime: number;    // Execution duration in milliseconds
  success: boolean;         // Whether execution was successful
}

interface AgentResult {
  success: boolean;
  result: string;
  error?: string;
  agentName: string;
  timestamp: string;
  executionTime: number;
  children: AgentResult[];
}
```

**Usage:**
```typescript
agent.on('agentCompleted', (data) => {
  console.log(`✅ ${data.name} completed in ${data.executionTime}ms`);
  console.log(`Success: ${data.success}`);
  console.log(`Children: ${data.result.children.length}`);
  
  if (data.depth === 0) {
    console.log('🏁 Root agent finished - execution complete');
  }
});
```

### agentError

Emitted when agent execution encounters an error.

```typescript
interface AgentErrorEventData extends AgentEventData {
  error: string;        // Error message
  stack?: string;       // Stack trace (if available)
}
```

**Usage:**
```typescript
agent.on('agentError', (data) => {
  console.error(`❌ Error in ${data.name}:`);
  console.error(`   Message: ${data.error}`);
  console.error(`   Depth: ${data.depth}`);
  
  if (data.stack) {
    console.error(`   Stack: ${data.stack}`);
  }
  
  // Handle error based on depth
  if (data.depth === 0) {
    console.error('💥 Root agent failed - critical error');
  } else {
    console.error('⚠️  Child agent failed - may affect parent');
  }
});
```

## Execution Events

### contextLoaded

Emitted when agent context (files, URLs, text) is loaded.

```typescript
interface ContextLoadEventData extends AgentEventData {
  context: {
    fileCount: number;    // Number of files loaded
    urlCount: number;     // Number of URLs fetched
    textCount: number;    // Number of text items provided
  };
}
```

**Usage:**
```typescript
agent.on('contextLoaded', (data) => {
  const { fileCount, urlCount, textCount } = data.context;
  const totalItems = fileCount + urlCount + textCount;
  
  if (totalItems > 0) {
    console.log(`📁 Context loaded for ${data.name}:`);
    console.log(`   Files: ${fileCount}, URLs: ${urlCount}, Text: ${textCount}`);
  }
});
```

### llmCall

Emitted when an LLM API call is initiated.

```typescript
interface LLMCallEventData extends AgentEventData {
  messageCount: number;       // Number of messages in conversation
  availableTools: string[];   // Tool names available to LLM
  model?: string;            // Model name (if available)
}
```

**Usage:**
```typescript
agent.on('llmCall', (data) => {
  console.log(`🧠 LLM call for ${data.name}:`);
  console.log(`   Messages: ${data.messageCount}`);
  console.log(`   Tools: ${data.availableTools.length} available`);
  
  if (data.model) {
    console.log(`   Model: ${data.model}`);
  }
  
  // Monitor conversation growth
  if (data.messageCount > 20) {
    console.warn(`⚠️  Large conversation: ${data.messageCount} messages`);
  }
});
```

### streamChunk

Emitted during streaming when response chunks are received.

```typescript
interface StreamChunkEventData extends AgentEventData {
  chunk: {
    content?: string;         // Text content in chunk
    tool_calls?: any[];       // Tool calls in chunk
    done: boolean;           // Whether stream is complete
  };
  accumulatedContent: string; // All content received so far
}
```

**Usage:**
```typescript
agent.on('streamChunk', (data) => {
  if (data.chunk.content) {
    // Display content as it arrives
    process.stdout.write(data.chunk.content);
  }
  
  if (data.chunk.tool_calls) {
    console.log(`\n🔧 Tool calls detected in stream`);
  }
  
  if (data.chunk.done) {
    console.log(`\n✅ Stream complete: ${data.accumulatedContent.length} chars`);
  }
});
```

## Tool Events

### toolCalls (Legacy)

Emitted when tools are executed in batch. This is a legacy event; use `toolCallStarted` and `toolCallCompleted` for granular monitoring.

```typescript
interface ToolCallEventData extends AgentEventData {
  toolCalls: string[];          // Names of tools executed
  toolDetails?: ToolCallDetail[]; // Detailed execution info
}

interface ToolCallDetail {
  name: string;
  input: any;
  output?: string;
  duration?: number;
  error?: string;
}
```

**Usage:**
```typescript
agent.on('toolCalls', (data) => {
  console.log(`🔧 Tools executed by ${data.name}: ${data.toolCalls.join(', ')}`);
  
  if (data.toolDetails) {
    data.toolDetails.forEach(detail => {
      const status = detail.error ? '❌' : '✅';
      console.log(`   ${status} ${detail.name} (${detail.duration}ms)`);
    });
  }
});
```

### toolCallStarted

Emitted when an individual tool execution starts.

```typescript
interface ToolCallStartedEventData extends AgentEventData {
  toolName: string;     // Name of tool being executed
  toolInput: any;       // Input parameters passed to tool
  toolCallId: string;   // Unique identifier for this tool call
}
```

**Usage:**
```typescript
const toolStartTimes = new Map();

agent.on('toolCallStarted', (data) => {
  console.log(`🚀 Tool starting: ${data.toolName}`);
  console.log(`   Input: ${JSON.stringify(data.toolInput, null, 2)}`);
  
  // Track start time for duration calculation
  toolStartTimes.set(data.toolCallId, Date.now());
  
  // Monitor specific tools
  if (data.toolName === 'createAgent') {
    console.log(`👶 Creating child agent: ${data.toolInput.name}`);
  }
});
```

### toolCallCompleted

Emitted when an individual tool execution completes.

```typescript
interface ToolCallCompletedEventData extends AgentEventData {
  toolName: string;       // Name of tool that was executed
  toolInput: any;         // Input parameters that were passed
  toolOutput?: string;    // Result returned by tool (if successful)
  toolError?: string;     // Error message (if tool failed)
  duration: number;       // Execution time in milliseconds
  toolCallId: string;     // Unique identifier for this tool call
}
```

**Usage:**
```typescript
agent.on('toolCallCompleted', (data) => {
  if (data.toolError) {
    console.error(`❌ Tool failed: ${data.toolName}`);
    console.error(`   Input: ${JSON.stringify(data.toolInput)}`);
    console.error(`   Error: ${data.toolError}`);
    console.error(`   Duration: ${data.duration}ms`);
  } else {
    console.log(`✅ Tool completed: ${data.toolName} (${data.duration}ms)`);
    console.log(`   Output: ${data.toolOutput?.substring(0, 100)}...`);
  }
  
  // Performance monitoring
  if (data.duration > 5000) {
    console.warn(`⏰ Slow tool: ${data.toolName} took ${data.duration}ms`);
  }
});
```

## Hierarchy Events

### childCreated

Emitted when a parent agent creates a child agent.

```typescript
interface ChildAgentEventData extends AgentEventData {
  parentId: string;       // ID of parent agent
  parentName: string;     // Name of parent agent
  childId: string;        // ID of created child agent
  childName: string;      // Name of created child agent
  childTask: string;      // Task assigned to child agent
}
```

**Usage:**
```typescript
agent.on('childCreated', (data) => {
  console.log(`👶 Child created: ${data.childName}`);
  console.log(`   Parent: ${data.parentName}`);
  console.log(`   Task: ${data.childTask}`);
  console.log(`   Depth: ${data.depth}`);
  
  // Track hierarchy structure
  const indent = '  '.repeat(data.depth - 1);
  console.log(`${indent}└─ ${data.childName}`);
});
```

## Event Filtering and Patterns

### Filter by Agent Depth

```typescript
// Monitor only root agents (depth 0)
agent.on('agentCompleted', (data) => {
  if (data.depth === 0) {
    console.log(`🏁 Root agent completed: ${data.name}`);
  }
});

// Monitor only child agents (depth > 0)
agent.on('agentCreated', (data) => {
  if (data.depth > 0) {
    console.log(`👶 Child agent created: ${data.name} at depth ${data.depth}`);
  }
});

// Monitor specific depth
const TARGET_DEPTH = 2;
agent.on('toolCallCompleted', (data) => {
  if (data.depth === TARGET_DEPTH) {
    console.log(`🔧 Level ${TARGET_DEPTH} tool: ${data.toolName}`);
  }
});
```

### Filter by Agent Name/Type

```typescript
// Monitor specific agent types
agent.on('agentCompleted', (data) => {
  if (data.name.includes('analyzer')) {
    console.log(`📊 Analysis completed: ${data.name}`);
  } else if (data.name.includes('writer')) {
    console.log(`✍️ Writing completed: ${data.name}`);
  }
});

// Monitor critical tools
const criticalTools = ['database_query', 'api_call', 'file_write'];
agent.on('toolCallCompleted', (data) => {
  if (criticalTools.includes(data.toolName)) {
    console.log(`⚠️ Critical tool: ${data.toolName} (${data.duration}ms)`);
  }
});
```

### Filter by Performance

```typescript
// Monitor slow operations
agent.on('toolCallCompleted', (data) => {
  if (data.duration > 5000) {
    console.log(`🐌 Slow tool: ${data.toolName} took ${data.duration}ms`);
  }
});

agent.on('agentCompleted', (data) => {
  if (data.executionTime > 30000) {
    console.log(`⏰ Long-running: ${data.name} took ${data.executionTime}ms`);
  }
});

// Monitor errors
agent.on('toolCallCompleted', (data) => {
  if (data.toolError) {
    console.error(`💥 Tool error: ${data.toolName} - ${data.toolError}`);
  }
});
```

## Event Aggregation Patterns

### Hierarchical Event Collector

```typescript
class HierarchicalEventCollector {
  private events = new Map<string, any[]>();
  
  constructor(agent: Agent) {
    // Collect all events by agent ID
    const eventTypes = [
      'agentCreated', 'agentStarted', 'agentCompleted', 'agentError',
      'toolCallStarted', 'toolCallCompleted', 'childCreated'
    ];
    
    eventTypes.forEach(eventType => {
      agent.on(eventType as any, (data: any) => {
        if (!this.events.has(data.id)) {
          this.events.set(data.id, []);
        }
        this.events.get(data.id)!.push({
          eventType,
          timestamp: data.timestamp,
          data
        });
      });
    });
  }
  
  getAgentEvents(agentId: string) {
    return this.events.get(agentId) || [];
  }
  
  getHierarchyEvents() {
    const hierarchy = new Map();
    
    this.events.forEach((events, agentId) => {
      const agentData = events.find(e => e.eventType === 'agentCreated')?.data;
      if (agentData) {
        hierarchy.set(agentId, {
          name: agentData.name,
          depth: agentData.depth,
          parentId: agentData.parentId,
          events: events.length
        });
      }
    });
    
    return hierarchy;
  }
}
```

### Performance Monitor

```typescript
class PerformanceMonitor {
  private metrics = {
    agents: new Map(),
    tools: new Map()
  };
  
  constructor(agent: Agent) {
    agent.on('agentStarted', (data) => {
      this.metrics.agents.set(data.id, {
        name: data.name,
        startTime: Date.now(),
        toolCalls: 0,
        llmCalls: 0
      });
    });
    
    agent.on('agentCompleted', (data) => {
      const metric = this.metrics.agents.get(data.id);
      if (metric) {
        metric.endTime = Date.now();
        metric.totalTime = metric.endTime - metric.startTime;
        metric.reportedTime = data.executionTime;
      }
    });
    
    agent.on('llmCall', (data) => {
      const metric = this.metrics.agents.get(data.id);
      if (metric) metric.llmCalls++;
    });
    
    agent.on('toolCallCompleted', (data) => {
      // Update agent metrics
      const agentMetric = this.metrics.agents.get(data.id);
      if (agentMetric) agentMetric.toolCalls++;
      
      // Update tool metrics
      if (!this.metrics.tools.has(data.toolName)) {
        this.metrics.tools.set(data.toolName, {
          calls: 0,
          totalDuration: 0,
          errors: 0,
          avgDuration: 0
        });
      }
      
      const toolMetric = this.metrics.tools.get(data.toolName)!;
      toolMetric.calls++;
      toolMetric.totalDuration += data.duration;
      toolMetric.avgDuration = toolMetric.totalDuration / toolMetric.calls;
      
      if (data.toolError) {
        toolMetric.errors++;
      }
    });
  }
  
  getReport() {
    return {
      agents: Array.from(this.metrics.agents.values()),
      tools: Array.from(this.metrics.tools.entries()).map(([name, metrics]) => ({
        name,
        ...metrics,
        errorRate: metrics.errors / metrics.calls
      }))
    };
  }
}
```

## Custom Event Handlers

### Real-time Dashboard

```typescript
class RealtimeDashboard {
  private ws: WebSocket;
  
  constructor(agent: Agent, websocketUrl: string) {
    this.ws = new WebSocket(websocketUrl);
    this.setupEventForwarding(agent);
  }
  
  private setupEventForwarding(agent: Agent) {
    const events = [
      'agentCreated', 'agentStarted', 'agentCompleted', 'agentError',
      'toolCallStarted', 'toolCallCompleted', 'childCreated'
    ];
    
    events.forEach(eventType => {
      agent.on(eventType as any, (data: any) => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            eventType,
            timestamp: new Date().toISOString(),
            data
          }));
        }
      });
    });
  }
}
```

### Event Logger

```typescript
class EventLogger {
  private logFile: string;
  
  constructor(agent: Agent, logFile: string) {
    this.logFile = logFile;
    this.setupLogging(agent);
  }
  
  private setupLogging(agent: Agent) {
    const eventTypes = [
      'agentCreated', 'agentStarted', 'agentCompleted', 'agentError',
      'contextLoaded', 'llmCall', 'toolCallStarted', 'toolCallCompleted',
      'streamChunk', 'childCreated'
    ];
    
    eventTypes.forEach(eventType => {
      agent.on(eventType as any, (data: any) => {
        const logEntry = {
          timestamp: new Date().toISOString(),
          eventType,
          agentId: data.id,
          agentName: data.name,
          depth: data.depth,
          data
        };
        
        // Append to log file
        fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
      });
    });
  }
}
```

## Type Safety Best Practices

### Strongly Typed Event Handling

```typescript
// Type-safe event listener registration
const handleAgentCompleted = (data: AgentResultEventData) => {
  // TypeScript knows the exact structure of data
  console.log(`Agent ${data.name} completed with ${data.result.children.length} children`);
};

agent.on('agentCompleted', handleAgentCompleted);

// Type-safe event data access
agent.on('toolCallCompleted', (data: ToolCallCompletedEventData) => {
  // All properties are properly typed
  const success = !data.toolError;
  const duration = data.duration; // number
  const output = data.toolOutput; // string | undefined
});
```

### Event Type Guards

```typescript
const isRootAgent = (data: AgentEventData): boolean => {
  return data.depth === 0;
};

const isToolError = (data: ToolCallCompletedEventData): boolean => {
  return data.toolError !== undefined;
};

const isSlowOperation = (data: ToolCallCompletedEventData | AgentResultEventData): boolean => {
  if ('duration' in data) {
    return data.duration > 5000;
  }
  if ('executionTime' in data) {
    return data.executionTime > 30000;
  }
  return false;
};

// Usage with type safety
agent.on('agentCompleted', (data) => {
  if (isRootAgent(data) && isSlowOperation(data)) {
    console.log('Root agent was slow to complete');
  }
});
```

## See Also

- [Event System Guide](/guide/event-system) - Comprehensive event usage guide
- [Agent Class](/api/agent-class) - Agent event methods
- [Debugging](/guide/debugging) - Using events for debugging
- [Examples - Monitoring](/examples/monitoring) - Practical event usage examples