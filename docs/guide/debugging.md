# Debugging

## Overview

AgenTree provides multiple debugging tools and techniques to help you understand agent behavior, diagnose issues, and optimize performance. This guide covers both built-in debugging features and external tools.

## Built-in Debugging Tools

### Output File Analysis

The most comprehensive debugging tool is the automatic output generation:

```typescript
const agent = new Agent({
  name: "debug-agent",
  task: "Task with potential issues",
  config: {
    outputFile: true,        // Enable detailed logging
    outputFolder: '.debug',  // Custom debug folder
    streaming: true          // See real-time progress
  }
});

await agent.execute();
```

Generated files provide complete visibility:
- `agent-report.md` - Human-readable execution summary
- `conversation.md` - Complete LLM conversation
- `execution-log.json` - Machine-readable event stream
- `metadata.json` - Agent configuration and status

### Event-Based Debugging

Use events to monitor execution in real-time:

```typescript
const debugAgent = (agent: Agent) => {
  // Track agent lifecycle
  agent.on('agentCreated', (data) => {
    console.log(`🤖 Created: ${data.name} (depth ${data.depth})`);
  });

  agent.on('agentStarted', (data) => {
    console.log(`▶️  Started: ${data.name}`);
  });

  agent.on('agentCompleted', (data) => {
    console.log(`✅ Completed: ${data.name} in ${data.executionTime}ms`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Result length: ${data.result.result?.length || 0} chars`);
  });

  agent.on('agentError', (data) => {
    console.error(`❌ Error in ${data.name}:`);
    console.error(`   Message: ${data.error}`);
    console.error(`   Depth: ${data.depth}`);
    if (data.stack) {
      console.error(`   Stack: ${data.stack}`);
    }
  });

  // Track LLM interactions
  agent.on('llmCall', (data) => {
    console.log(`🧠 LLM Call: ${data.messageCount} messages, ${data.availableTools.length} tools`);
    console.log(`   Tools: ${data.availableTools.join(', ')}`);
  });

  // Track tool usage
  agent.on('toolCallStarted', (data) => {
    console.log(`🔧 Tool Starting: ${data.toolName}`);
    console.log(`   Input: ${JSON.stringify(data.toolInput, null, 2)}`);
  });

  agent.on('toolCallCompleted', (data) => {
    if (data.toolError) {
      console.error(`❌ Tool Failed: ${data.toolName} (${data.duration}ms)`);
      console.error(`   Error: ${data.toolError}`);
    } else {
      console.log(`✅ Tool Success: ${data.toolName} (${data.duration}ms)`);
      console.log(`   Output: ${data.toolOutput?.substring(0, 100)}...`);
    }
  });

  // Track hierarchy
  agent.on('childCreated', (data) => {
    console.log(`👶 Child Created: ${data.childName}`);
    console.log(`   Parent: ${data.parentName}`);
    console.log(`   Task: ${data.childTask}`);
  });
};

debugAgent(agent);
await agent.execute();
```

## Output Analysis Tools

### Built-in Viewer

Use the viewer scripts for post-execution analysis:

```bash
# List all execution runs
npm run view list

# Show detailed information about a specific run
npm run view show debug-agent-2025-07-02

# Show agent hierarchy tree
npm run view tree debug-agent-2025-07-02

# Show conversation logs
npm run view logs debug-agent-2025-07-02

# Show execution statistics
npm run view summary
```

### Viewer Output Examples

```bash
$ npm run view show debug-agent-2025-07-02

🤖 Agent Run Details
debug-agent (debug-agent-2025-07-02-14-30)

📊 Basic Information
  ID: debug-agent-2025-07-02-14-30
  Task: Task with potential issues
  Status: ✅ completed
  Depth: 0

⏱️  Execution Timeline
  Started: 7/2/2025, 2:30:15 PM
  Ended: 7/2/2025, 2:32:45 PM
  Duration: 2.5s

📈 Execution Metrics
  Messages: 18
  LLM Calls: 6
  Tool Calls: 4
  Children Created: 2
  Errors: 0

🔧 Tools Used
  • readFile
  • analyzeData
  • createAgent
  • stopAgent

👥 Child Agents (2)
  1. data-processor - ✅ completed (1.2s)
  2. report-generator - ✅ completed (0.8s)
```

### Conversation Analysis

```bash
$ npm run view logs debug-agent-2025-07-02

💬 Conversation Log
debug-agent - Showing 20 of 24 messages

[2:30:15 PM] system: You are an AI agent named "debug-agent"...
[2:30:16 PM] user: Please complete the following task: Task with potential issues
[2:30:32 PM] assistant: I'll analyze this task systematically...
[2:30:33 PM] tool_call: readFile({"path": "./data.csv"})
[2:30:34 PM] tool: "Date,Value\n2025-01-01,100\n..."
[2:30:35 PM] assistant: I can see the data structure. Let me create specialized agents...
```

## Common Debugging Scenarios

### 1. Agent Not Creating Children

**Symptoms:**
- Agent completes immediately without decomposition
- No child agents created
- Task seems too complex for single agent

**Debug Steps:**

```typescript
// Check maxDepth configuration
console.log('Max depth:', agent.config.maxDepth);

// Monitor agent decision process
agent.on('llmCall', (data) => {
  console.log(`🧠 Thinking with tools: ${data.availableTools}`);
  if (!data.availableTools.includes('createAgent')) {
    console.warn('⚠️  createAgent not available - check maxDepth');
  }
});

// Check task complexity
agent.on('agentCompleted', (data) => {
  if (data.depth === 0 && data.result.children.length === 0) {
    console.warn('⚠️  No children created - task may be too simple or poorly described');
  }
});
```

**Solutions:**
- Increase `maxDepth` if at limit
- Make task description more complex/specific
- Provide more context to guide decomposition

### 2. Tool Execution Failures

**Symptoms:**
- Tools return errors frequently
- Agent gets stuck on tool failures
- Inconsistent tool behavior

**Debug Steps:**

```typescript
// Detailed tool monitoring
agent.on('toolCallStarted', (data) => {
  console.log(`🔧 Tool: ${data.toolName}`);
  console.log(`   Input:`, JSON.stringify(data.toolInput, null, 2));
});

agent.on('toolCallCompleted', (data) => {
  if (data.toolError) {
    console.error(`❌ Tool ${data.toolName} failed:`);
    console.error(`   Input:`, data.toolInput);
    console.error(`   Error:`, data.toolError);
    console.error(`   Duration:`, data.duration);
  }
});

// Test tools individually
const testTool = async (tool, input) => {
  try {
    console.log(`Testing ${tool.name} with:`, input);
    const result = await tool.execute(input);
    console.log(`✅ Success:`, result);
  } catch (error) {
    console.error(`❌ Failed:`, error.message);
  }
};

await testTool(myTool, { test: "input" });
```

### 3. LLM Response Issues

**Symptoms:**
- Agent makes poor decisions
- Inconsistent behavior
- Unexpected tool usage

**Debug Steps:**

```typescript
// Monitor LLM interactions
agent.on('llmCall', (data) => {
  console.log(`🧠 LLM Call ${data.messageCount} messages:`);
  console.log(`   Available tools: ${data.availableTools.join(', ')}`);
  console.log(`   Model: ${data.model || 'default'}`);
});

// Examine full conversation
// Check conversation.md file for complete LLM interactions

// Try different models
const testModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
for (const model of testModels) {
  console.log(`Testing with model: ${model}`);
  const testAgent = new Agent({
    config: { ...baseConfig, model }
    // ... same task and tools
  });
  // Compare results
}
```

### 4. Performance Issues

**Symptoms:**
- Long execution times
- High API costs
- Memory usage issues

**Debug Steps:**

```typescript
class PerformanceDebugger {
  private startTime = Date.now();
  private llmCalls = 0;
  private toolCalls = 0;
  private totalTokens = 0;

  constructor(agent: Agent) {
    agent.on('llmCall', (data) => {
      this.llmCalls++;
      console.log(`🧠 LLM Call #${this.llmCalls} at +${Date.now() - this.startTime}ms`);
    });

    agent.on('toolCallCompleted', (data) => {
      this.toolCalls++;
      console.log(`🔧 Tool #${this.toolCalls}: ${data.toolName} (${data.duration}ms)`);
    });

    agent.on('agentCompleted', (data) => {
      const totalTime = Date.now() - this.startTime;
      console.log(`\n📊 Performance Summary:`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   LLM calls: ${this.llmCalls}`);
      console.log(`   Tool calls: ${this.toolCalls}`);
      console.log(`   Avg LLM time: ${totalTime / this.llmCalls}ms`);
    });
  }
}

new PerformanceDebugger(agent);
```

## Advanced Debugging Techniques

### 1. Conversation Injection

Add debugging information to conversations:

```typescript
const debugTool = tool({
  name: 'debug_log',
  description: 'Log debug information during execution',
  parameters: z.object({
    message: z.string(),
    data: z.any().optional()
  }),
  execute: ({ message, data }) => {
    console.log(`🐛 DEBUG: ${message}`);
    if (data) {
      console.log(`   Data:`, JSON.stringify(data, null, 2));
    }
    return `Debug logged: ${message}`;
  }
});

const agent = new Agent({
  tools: [debugTool, ...otherTools],
  // ...
});
```

### 2. Conditional Debugging

Enable debugging based on conditions:

```typescript
const createDebugAgent = (name: string, task: string, debug = false) => {
  const agent = new Agent({
    name,
    task,
    config: {
      outputFile: debug,
      outputFolder: debug ? '.debug' : '.agentree'
    }
  });

  if (debug) {
    // Add comprehensive debugging
    debugAgent(agent);
  }

  return agent;
};

// Enable debugging for specific agents
const debugMode = process.env.DEBUG_AGENT === name;
const agent = createDebugAgent("problematic-agent", "Complex task", debugMode);
```

### 3. State Inspection

Track agent state during execution:

```typescript
class StateInspector {
  private agentStates = new Map();

  constructor(agent: Agent) {
    agent.on('agentStarted', (data) => {
      this.agentStates.set(data.id, {
        name: data.name,
        startTime: Date.now(),
        phase: 'started',
        tools: [],
        children: []
      });
    });

    agent.on('toolCallStarted', (data) => {
      const state = this.agentStates.get(data.id);
      if (state) {
        state.tools.push({
          name: data.toolName,
          input: data.toolInput,
          startTime: Date.now()
        });
        state.phase = `executing ${data.toolName}`;
      }
    });

    agent.on('childCreated', (data) => {
      const state = this.agentStates.get(data.parentId);
      if (state) {
        state.children.push(data.childName);
        state.phase = `created child ${data.childName}`;
      }
    });

    agent.on('agentCompleted', (data) => {
      const state = this.agentStates.get(data.id);
      if (state) {
        state.phase = 'completed';
        state.endTime = Date.now();
        state.duration = state.endTime - state.startTime;
        
        console.log(`📊 Agent ${data.name} state:`, state);
      }
    });
  }

  getState(agentId: string) {
    return this.agentStates.get(agentId);
  }

  getAllStates() {
    return Array.from(this.agentStates.values());
  }
}

const inspector = new StateInspector(agent);
```

## Debugging Tools Integration

### 1. VS Code Integration

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug AgenTree",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/debug-agent.ts",
      "env": {
        "NODE_ENV": "development",
        "DEBUG_AGENT": "true",
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
      },
      "console": "integratedTerminal",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "sourceMaps": true
    }
  ]
}
```

### 2. Logging Libraries

Integrate with structured logging:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'agentree-debug.log' }),
    new winston.transports.Console()
  ]
});

const debugWithLogger = (agent: Agent) => {
  agent.on('agentStarted', (data) => {
    logger.info('Agent started', {
      agentId: data.id,
      agentName: data.name,
      depth: data.depth
    });
  });

  agent.on('toolCallCompleted', (data) => {
    logger.debug('Tool completed', {
      agentId: data.id,
      toolName: data.toolName,
      duration: data.duration,
      success: !data.toolError
    });
  });

  agent.on('agentError', (data) => {
    logger.error('Agent error', {
      agentId: data.id,
      agentName: data.name,
      error: data.error,
      stack: data.stack
    });
  });
};
```

### 3. Custom Debug Dashboard

Create a simple web dashboard:

```typescript
import express from 'express';
import { EventEmitter } from 'events';

const debugServer = new EventEmitter();
const app = express();

app.get('/debug/:agentId', (req, res) => {
  const agentId = req.params.agentId;
  const debugData = getDebugData(agentId);
  res.json(debugData);
});

const setupDebugServer = (agent: Agent) => {
  agent.on('agentStarted', (data) => {
    debugServer.emit('agent-event', {
      type: 'started',
      timestamp: Date.now(),
      data
    });
  });

  // ... other events

  app.listen(3001, () => {
    console.log('Debug server running on http://localhost:3001');
  });
};
```

## Troubleshooting Common Issues

### Error: "Agent completed without setting result"

**Cause:** Agent didn't call `stopAgent` tool

**Debug:**
```typescript
// Check if agent has stopAgent available
agent.on('llmCall', (data) => {
  if (!data.availableTools.includes('stopAgent')) {
    console.error('❌ stopAgent tool not available');
  }
});

// Check conversation for missing stopAgent call
// Look at conversation.md - should end with stopAgent call
```

### Error: "Tool X not found"

**Cause:** Tool not registered or incorrect name

**Debug:**
```typescript
import { ToolRegistry } from 'agentree';

// Check registered tools
console.log('Registered tools:', ToolRegistry.list());

// Verify tool registration
const myTool = tool({ name: 'my_tool', /* ... */ });
console.log('Tool name:', myTool.name); // Should match usage

// Check agent tools
agent.on('agentCreated', (data) => {
  console.log(`Agent ${data.name} tools:`, agent.tools.map(t => t.name));
});
```

### Performance Issues

**High API Costs:**
```typescript
// Monitor token usage
agent.on('llmCall', (data) => {
  console.log(`💰 LLM call with ${data.messageCount} messages`);
  // Consider conversation pruning for large conversations
});

// Track conversation size
agent.on('agentCompleted', (data) => {
  if (data.depth === 0) {
    // Check conversation.md file size
    console.log('Check conversation size in output folder');
  }
});
```

**Slow Execution:**
```typescript
// Identify bottlenecks
const startTime = Date.now();
agent.on('toolCallStarted', (data) => {
  console.log(`⏱️  Tool ${data.toolName} started at +${Date.now() - startTime}ms`);
});

agent.on('toolCallCompleted', (data) => {
  if (data.duration > 5000) {
    console.warn(`🐌 Slow tool: ${data.toolName} took ${data.duration}ms`);
  }
});
```

## Best Practices for Debugging

### 1. Incremental Debugging

Start simple and add complexity:

```typescript
// Start with simple agent
const simpleAgent = new Agent({
  name: "simple-test",
  task: "Simple task to test basic functionality",
  maxDepth: 1,
  config: { outputFile: true }
});

// Add tools one by one
const withToolsAgent = new Agent({
  name: "with-tools-test",
  task: "Test with specific tools",
  tools: [onlyOneTool],
  maxDepth: 2
});

// Add complexity gradually
const complexAgent = new Agent({
  name: "complex-test",
  task: "Full complex task",
  tools: allTools,
  maxDepth: 5
});
```

### 2. Environment Separation

Use different debug levels for environments:

```typescript
const getDebugConfig = () => {
  const env = process.env.NODE_ENV;
  
  return {
    development: {
      outputFile: true,
      verbose: true,
      streaming: true
    },
    test: {
      outputFile: false,
      verbose: false
    },
    production: {
      outputFile: true,
      verbose: false,
      streaming: false
    }
  }[env] || { outputFile: true, verbose: false };
};
```

### 3. Systematic Issue Investigation

1. **Check Configuration** - Verify API keys, models, settings
2. **Review Output Files** - Start with agent-report.md
3. **Examine Conversation** - Look at conversation.md for LLM decisions
4. **Analyze Events** - Use execution-log.json for detailed timeline
5. **Test Tools Individually** - Isolate tool issues
6. **Verify Context** - Ensure context loads correctly

## Next Steps

- [Configuration](/guide/configuration) - Debug configuration issues
- [Event System](/guide/event-system) - Use events for debugging
- [Development](/development/contributing) - Contribute debugging improvements