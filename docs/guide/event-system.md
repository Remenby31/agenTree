# Event System

## Overview

AgenTree provides a comprehensive event system for monitoring agent execution in real-time. Events are emitted throughout the agent lifecycle, from creation to completion, providing full visibility into the decision-making and execution process.

## Event Categories

### Agent Lifecycle Events
- `agentCreated` - Agent instance created
- `agentStarted` - Agent execution began
- `agentCompleted` - Agent finished successfully
- `agentError` - Agent encountered an error

### Execution Events
- `contextLoaded` - Context files/URLs loaded
- `llmCall` - LLM API call initiated
- `streamChunk` - Streaming response chunk received

### Tool Events
- `toolCalls` - Tool execution batch (legacy)
- `toolCallStarted` - Individual tool execution started
- `toolCallCompleted` - Individual tool execution finished

### Hierarchy Events
- `childCreated` - Child agent created by parent

## Basic Monitoring

### Simple Progress Tracking

```typescript
import { Agent } from 'agentree';

const agent = new Agent({
  name: "data-processor",
  task: "Process and analyze customer data",
  tools: [dataTools]
});

// Track major milestones
agent.on('agentStarted', (data) => {
  console.log(`🚀 Started: ${data.name}`);
});

agent.on('agentCompleted', (data) => {
  console.log(`✅ Completed: ${data.name} in ${data.executionTime}ms`);
  console.log(`   Result: ${data.result.result.substring(0, 100)}...`);
});

agent.on('agentError', (data) => {
  console.error(`❌ Error in ${data.name}: ${data.error}`);
});

await agent.execute();
```

### Tool Usage Monitoring

```typescript
const toolMetrics = new Map();

agent.on('toolCallStarted', (data) => {
  const startTime = Date.now();
  toolMetrics.set(data.toolCallId, { 
    name: data.toolName, 
    startTime,
    input: data.toolInput 
  });
  console.log(`🔧 Starting: ${data.toolName}`);
});

agent.on('toolCallCompleted', (data) => {
  const metric = toolMetrics.get(data.toolCallId);
  if (metric) {
    console.log(`   ✅ ${data.toolName}: ${data.duration}ms`);
    if (data.toolError) {
      console.error(`   ❌ Error: ${data.toolError}`);
    }
  }
});
```

### Child Agent Tracking

```typescript
const agentHierarchy = new Map();

agent.on('childCreated', (data) => {
  agentHierarchy.set(data.childId, {
    name: data.childName,
    task: data.childTask,
    parentId: data.parentId,
    depth: data.depth
  });
  
  const indent = '  '.repeat(data.depth - 1);
  console.log(`${indent}👶 Created: ${data.childName}`);
  console.log(`${indent}   Task: ${data.childTask}`);
});
```

## Advanced Monitoring

### Hierarchical Logging

```typescript
class HierarchicalLogger {
  private agentInfo = new Map();

  constructor(rootAgent: Agent) {
    this.setupLogging(rootAgent);
  }

  private setupLogging(agent: Agent) {
    agent.on('agentCreated', (data) => {
      this.agentInfo.set(data.id, {
        name: data.name,
        depth: data.depth,
        parentId: data.parentId,
        startTime: Date.now()
      });
      
      if (data.depth === 0) {
        console.log(`🌳 Root Agent: ${data.name}`);
      }
    });

    agent.on('agentStarted', (data) => {
      const indent = '  '.repeat(data.depth);
      console.log(`${indent}▶️  ${data.name} started`);
    });

    agent.on('agentCompleted', (data) => {
      const indent = '  '.repeat(data.depth);
      const info = this.agentInfo.get(data.id);
      const totalTime = Date.now() - (info?.startTime || 0);
      
      console.log(`${indent}✅ ${data.name} completed (${data.executionTime}ms total: ${totalTime}ms)`);
    });

    agent.on('toolCallCompleted', (data) => {
      const indent = '  '.repeat(data.depth + 1);
      const status = data.toolError ? '❌' : '✅';
      console.log(`${indent}${status} ${data.toolName} (${data.duration}ms)`);
    });
  }
}

const logger = new HierarchicalLogger(agent);
await agent.execute();
```

### Performance Monitoring

```typescript
class PerformanceMonitor {
  private metrics = {
    agents: new Map(),
    tools: new Map(),
    startTime: Date.now()
  };

  constructor(agent: Agent) {
    this.monitor(agent);
  }

  private monitor(agent: Agent) {
    // Track agent performance
    agent.on('agentStarted', (data) => {
      this.metrics.agents.set(data.id, {
        name: data.name,
        depth: data.depth,
        startTime: Date.now(),
        toolCalls: 0,
        llmCalls: 0
      });
    });

    agent.on('agentCompleted', (data) => {
      const agentMetric = this.metrics.agents.get(data.id);
      if (agentMetric) {
        agentMetric.endTime = Date.now();
        agentMetric.duration = data.executionTime;
        agentMetric.success = data.success;
      }
    });

    // Track tool performance
    agent.on('toolCallCompleted', (data) => {
      const agentMetric = this.metrics.agents.get(data.id);
      if (agentMetric) {
        agentMetric.toolCalls++;
      }

      // Aggregate tool stats
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

    // Track LLM calls
    agent.on('llmCall', (data) => {
      const agentMetric = this.metrics.agents.get(data.id);
      if (agentMetric) {
        agentMetric.llmCalls++;
      }
    });
  }

  public getReport() {
    const totalDuration = Date.now() - this.metrics.startTime;
    
    return {
      totalDuration,
      agents: Array.from(this.metrics.agents.values()),
      tools: Array.from(this.metrics.tools.entries()).map(([name, stats]) => ({
        name,
        ...stats
      }))
    };
  }
}

const monitor = new PerformanceMonitor(agent);
await agent.execute();

const report = monitor.getReport();
console.log('\n📊 Performance Report:');
console.log(`Total Duration: ${report.totalDuration}ms`);
console.log(`Agents: ${report.agents.length}`);
console.log('\nTool Performance:');
report.tools.forEach(tool => {
  console.log(`  ${tool.name}: ${tool.calls} calls, avg ${tool.avgDuration.toFixed(1)}ms`);
});
```

### Real-time Streaming Monitor

```typescript
class StreamingMonitor {
  private currentContent = '';
  private chunkCount = 0;

  constructor(agent: Agent) {
    this.monitor(agent);
  }

  private monitor(agent: Agent) {
    agent.on('streamChunk', (data) => {
      this.chunkCount++;
      
      if (data.chunk.content) {
        this.currentContent += data.chunk.content;
        // Display content as it arrives
        process.stdout.write(data.chunk.content);
      }
      
      if (data.chunk.tool_calls) {
        console.log(`\n🔧 Tool calls detected in chunk ${this.chunkCount}`);
      }
      
      if (data.chunk.done) {
        console.log(`\n\n📊 Stream completed: ${this.chunkCount} chunks, ${this.currentContent.length} characters`);
        this.reset();
      }
    });
  }

  private reset() {
    this.currentContent = '';
    this.chunkCount = 0;
  }
}

const agent = new Agent({
  config: { 
    streaming: true,  // Enable streaming
    // ...
  }
});

const streamMonitor = new StreamingMonitor(agent);
await agent.execute();
```

## Event Filtering

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

// Monitor specific depth level
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

// Monitor specific tools
agent.on('toolCallCompleted', (data) => {
  const criticalTools = ['database_query', 'api_call', 'file_write'];
  if (criticalTools.includes(data.toolName)) {
    console.log(`⚠️ Critical tool executed: ${data.toolName} (${data.duration}ms)`);
  }
});
```

### Filter by Execution Time

```typescript
// Monitor slow operations
agent.on('toolCallCompleted', (data) => {
  if (data.duration > 5000) { // > 5 seconds
    console.log(`🐌 Slow tool: ${data.toolName} took ${data.duration}ms`);
  }
});

agent.on('agentCompleted', (data) => {
  if (data.executionTime > 30000) { // > 30 seconds
    console.log(`⏰ Long-running agent: ${data.name} took ${data.executionTime}ms`);
  }
});
```

## Error Monitoring

### Comprehensive Error Tracking

```typescript
class ErrorTracker {
  private errors = [];

  constructor(agent: Agent) {
    this.setupErrorTracking(agent);
  }

  private setupErrorTracking(agent: Agent) {
    // Agent-level errors
    agent.on('agentError', (data) => {
      this.errors.push({
        type: 'agent_error',
        agentId: data.id,
        agentName: data.name,
        depth: data.depth,
        error: data.error,
        stack: data.stack,
        timestamp: data.timestamp
      });
      
      console.error(`💥 Agent Error: ${data.name}`);
      console.error(`   Error: ${data.error}`);
      if (data.depth > 0) {
        console.error(`   Depth: ${data.depth} (child agent failure)`);
      }
    });

    // Tool-level errors
    agent.on('toolCallCompleted', (data) => {
      if (data.toolError) {
        this.errors.push({
          type: 'tool_error',
          agentId: data.id,
          agentName: data.name,
          toolName: data.toolName,
          toolInput: data.toolInput,
          error: data.toolError,
          duration: data.duration,
          timestamp: data.timestamp
        });
        
        console.error(`🔧💥 Tool Error: ${data.toolName} in ${data.name}`);
        console.error(`   Input: ${JSON.stringify(data.toolInput)}`);
        console.error(`   Error: ${data.toolError}`);
      }
    });
  }

  public getErrorSummary() {
    const agentErrors = this.errors.filter(e => e.type === 'agent_error');
    const toolErrors = this.errors.filter(e => e.type === 'tool_error');
    
    return {
      totalErrors: this.errors.length,
      agentErrors: agentErrors.length,
      toolErrors: toolErrors.length,
      errors: this.errors
    };
  }
}

const errorTracker = new ErrorTracker(agent);
await agent.execute();

const errorSummary = errorTracker.getErrorSummary();
if (errorSummary.totalErrors > 0) {
  console.log(`\n💥 Error Summary: ${errorSummary.totalErrors} total errors`);
  console.log(`   Agent errors: ${errorSummary.agentErrors}`);
  console.log(`   Tool errors: ${errorSummary.toolErrors}`);
}
```

## Custom Event Handlers

### Event Aggregation

```typescript
class EventAggregator {
  private events = [];
  private startTime = Date.now();

  constructor(agent: Agent) {
    this.setupAggregation(agent);
  }

  private setupAggregation(agent: Agent) {
    const eventTypes = [
      'agentCreated', 'agentStarted', 'agentCompleted', 'agentError',
      'contextLoaded', 'llmCall', 'toolCallStarted', 'toolCallCompleted',
      'streamChunk', 'childCreated'
    ];

    eventTypes.forEach(eventType => {
      agent.on(eventType as any, (data: any) => {
        this.events.push({
          eventType,
          timestamp: data.timestamp || new Date().toISOString(),
          agentId: data.id,
          agentName: data.name,
          depth: data.depth,
          data: data
        });
      });
    });
  }

  public getEventTimeline() {
    return this.events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  public getEventStats() {
    const stats = {};
    this.events.forEach(event => {
      stats[event.eventType] = (stats[event.eventType] || 0) + 1;
    });
    return stats;
  }
}

const aggregator = new EventAggregator(agent);
await agent.execute();

console.log('\n📊 Event Statistics:');
console.log(aggregator.getEventStats());
```

### WebSocket Integration

```typescript
import WebSocket from 'ws';

class WebSocketMonitor {
  private ws: WebSocket;

  constructor(agent: Agent, wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
    this.setupMonitoring(agent);
  }

  private setupMonitoring(agent: Agent) {
    const events = [
      'agentCreated', 'agentStarted', 'agentCompleted', 
      'toolCallCompleted', 'childCreated'
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

  public close() {
    this.ws.close();
  }
}

// Usage with WebSocket server
const wsMonitor = new WebSocketMonitor(agent, 'ws://localhost:8080');
await agent.execute();
wsMonitor.close();
```

## Event Data Reference

### Common Properties

All events include these base properties:

```typescript
interface BaseEventData {
  id: string;           // Agent unique identifier
  name: string;         // Agent name
  timestamp: string;    // ISO timestamp
  depth: number;        // Agent depth in hierarchy
  parentId?: string;    // Parent agent ID (if child)
}
```

### Event-Specific Properties

#### AgentResultEventData
```typescript
interface AgentResultEventData extends BaseEventData {
  result: AgentResult;
  executionTime: number;
  success: boolean;
}
```

#### ToolCallCompletedEventData
```typescript
interface ToolCallCompletedEventData extends BaseEventData {
  toolName: string;
  toolInput: any;
  toolOutput?: string;
  toolError?: string;
  duration: number;
  toolCallId: string;
}
```

#### ChildAgentEventData
```typescript
interface ChildAgentEventData extends BaseEventData {
  parentId: string;
  parentName: string;
  childId: string;
  childName: string;
  childTask: string;
}
```

## Best Practices

### 1. Selective Monitoring

Don't monitor every event in production:

```typescript
// Development: Monitor everything
if (process.env.NODE_ENV === 'development') {
  agent.on('streamChunk', (data) => {
    process.stdout.write(data.chunk.content || '');
  });
}

// Production: Monitor only important events
agent.on('agentError', (data) => {
  logger.error(`Agent error: ${data.name} - ${data.error}`);
});

agent.on('agentCompleted', (data) => {
  if (data.depth === 0) {
    logger.info(`Task completed: ${data.name} in ${data.executionTime}ms`);
  }
});
```

### 2. Performance Considerations

Avoid expensive operations in event handlers:

```typescript
// Good: Lightweight logging
agent.on('toolCallCompleted', (data) => {
  console.log(`Tool: ${data.toolName} (${data.duration}ms)`);
});

// Poor: Heavy processing in event handler
agent.on('toolCallCompleted', (data) => {
  // Don't do this - blocks execution
  await analyzeToolPerformance(data);
  await updateDatabase(data);
  await sendNotification(data);
});

// Better: Queue for async processing
const eventQueue = [];
agent.on('toolCallCompleted', (data) => {
  eventQueue.push(data);
});

// Process queue separately
setInterval(() => {
  const events = eventQueue.splice(0);
  processEventsAsync(events);
}, 1000);
```

### 3. Memory Management

Clean up event listeners for long-running applications:

```typescript
class ManagedMonitor {
  private cleanup: () => void;

  constructor(agent: Agent) {
    const handlers = {
      agentCompleted: (data) => console.log(`Completed: ${data.name}`),
      agentError: (data) => console.error(`Error: ${data.error}`)
    };

    // Set up handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      agent.on(event as any, handler);
    });

    // Store cleanup function
    this.cleanup = () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        agent.off(event as any, handler);
      });
    };
  }

  public dispose() {
    this.cleanup();
  }
}

const monitor = new ManagedMonitor(agent);
await agent.execute();
monitor.dispose(); // Clean up event listeners
```

## Next Steps

- [Configuration](/guide/configuration) - Configure event behavior
- [Debugging](/guide/debugging) - Use events for debugging
- [API Reference - Events](/api/event-types) - Complete event type definitions