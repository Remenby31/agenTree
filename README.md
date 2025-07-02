# AgenTree 🌳

> **Hierarchical AI agents that summon other agents recursively, like a Tree**

TypeScript library for creating hierarchical AI agents that recursively decompose tasks by spawning specialized child agents.

AgenTree is a TypeScript library that enables AI agents to recursively break down complex tasks by creating specialized child agents. Each agent can dynamically define the role, context, and tools of its children, forming an intelligent task decomposition tree.

## Concept

[![npm version](https://badge.fury.io/js/agentree.svg)](https://www.npmjs.com/package/agentree)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
An agent receives a complex task, analyzes what subtasks are needed, creates child agents with specific roles and tools, and coordinates their execution. Each child can create its own children up to a configurable depth, forming an execution tree.


```
📋 Task: "Research and write market analysis"
└── 📊 Market Research Agent
    ├── 🔍 Data Collection Agent  
    ├── 📈 Trend Analysis Agent
    └── 💰 Competitor Analysis Agent
└── ✍️ Writing Agent
    └── 📝 Report Generation Agent
```

## Installation

```bash
npm install agentree zod
```

## Basic Usage

```typescript
import { Agent, tool } from 'agentree';
import { z } from 'zod';

// Define tools using Zod schemas
const webSearchTool = tool({
  name: 'web_search',
  description: 'Search the web for information',
  parameters: z.object({
    query: z.string(),
    maxResults: z.number().default(5)
  }),
  async execute({ query, maxResults }) {
    // Your implementation
    return `Search results for: ${query}`;
  }
});

// Create and execute agent
const agent = new Agent({
  name: "researcher",
  task: "Research latest developments in quantum computing",
  tools: [webSearchTool],
  maxDepth: 3,
  config: {
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY,
    outputFile: true
  }
});

const result = await agent.execute();
```

→ [More examples in documentation](https://remenby31.github.io/agenTree/examples/)

## Architecture

### Built-in Tools

Every agent has access to:
- `createAgent`: Spawn child agents for subtasks
- `stopAgent`: Return final results
- Default tools: `readFile`, `writeFile`, `searchTool`, `replaceFile`, `bash`

→ [Built-in tools reference](https://remenby31.github.io/agenTree/api/built-in-tools)

### Tool Creation

```typescript
const dbQueryTool = tool({
  name: 'query_database',
  description: 'Execute SQL queries',
  parameters: z.object({
    query: z.string(),
    params: z.array(z.any()).optional()
  }),
  async execute({ query, params = [] }) {
    return await database.query(query, params);
  }
});
```

→ [Custom tools guide](https://remenby31.github.io/agenTree/guide/custom-tools)

### Event System

Monitor agent execution with typed events:

#### Basic Monitoring

```typescript
// Simple progress tracking
agent.on('agentCompleted', (data) => {
  console.log(`✅ ${data.name} finished in ${data.executionTime}ms`);
});

agent.on('childCreated', (data) => {
  console.log(`👶 Created child: ${data.childName}`);
});

agent.on('agentError', (data) => {
  console.error(`❌ Error in ${data.name}: ${data.error}`);
});
```

#### Tool Performance Tracking

```typescript
const toolMetrics = new Map();

agent.on('toolCallStarted', (data) => {
  toolMetrics.set(data.toolCallId, Date.now());
});

agent.on('toolCallCompleted', (data) => {
  console.log(`🔧 ${data.toolName}: ${data.duration}ms`);
  if (data.toolError) {
    console.error(`   Error: ${data.toolError}`);
  }
});
```

#### Hierarchical Logging

```typescript
agent.on('agentCreated', (data) => {
  const indent = '  '.repeat(data.depth);
  console.log(`${indent}🤖 ${data.name} (depth ${data.depth})`);
});
```

#### Real-time Streaming

```typescript
agent.on('streamChunk', (data) => {
  if (data.chunk.content) {
    process.stdout.write(data.chunk.content);
  }
});
```

#### Complete Event Reference

| Event | Description | Key Data Properties |
|-------|-------------|-------------------|
| `agentCreated` | Agent instance created | `id`, `name`, `task`, `depth`, `parentId?` |
| `agentStarted` | Agent execution started | `id`, `name`, `depth` |
| `agentCompleted` | Agent execution finished | `id`, `name`, `result`, `executionTime`, `success` |
| `agentError` | Error occurred in agent | `id`, `name`, `error`, `stack?` |
| `contextLoaded` | Context files/URLs loaded | `id`, `name`, `context: {fileCount, urlCount, textCount}` |
| `llmCall` | LLM API call initiated | `id`, `name`, `messageCount`, `availableTools[]` |
| `toolCalls` | Tool execution batch (legacy) | `id`, `name`, `toolCalls[]`, `toolDetails?` |
| `toolCallStarted` | Individual tool started | `id`, `name`, `toolName`, `toolInput`, `toolCallId` |
| `toolCallCompleted` | Individual tool finished | `id`, `name`, `toolName`, `toolOutput?`, `toolError?`, `duration` |
| `streamChunk` | Streaming response chunk | `id`, `name`, `chunk: {content?, done}`, `accumulatedContent` |
| `childCreated` | Child agent created | `parentId`, `parentName`, `childId`, `childName`, `childTask` |

**Common properties**: All events include `id`, `name`, `timestamp`, `depth`, `parentId?`

→ [Complete event system guide](https://remenby31.github.io/agenTree/guide/event-system)

## Configuration

```typescript
interface AgentTreeConfig {
  baseUrl?: string;        // LLM endpoint
  model?: string;          // Model name
  apiKey?: string;         // API key
  maxDepth?: number;       // Max hierarchy depth (default: 5)
  outputFile?: boolean;    // Generate markdown reports (default: true)
  outputFolder?: string;   // Output directory (default: .agentree)
  streaming?: boolean;     // Enable streaming (default: false)
}
```

### Environment Variables

```bash
# OpenAI
export OPENAI_API_KEY="your-key"

# Custom endpoint
export LLM_BASE_URL="https://your-llm-endpoint.com"
```

→ [Configuration guide](https://remenby31.github.io/agenTree/guide/configuration)

## Output Structure

Each execution generates structured reports:

```
.agentree/
└── researcher-2025-07-02-14-30/
    ├── agent-report.md          # Main report
    ├── conversation.md          # LLM conversation log
    ├── execution-log.json       # Event stream
    ├── metadata.json           # Agent metadata
    └── data-collector/         # Child agent folder
        ├── agent-report.md
        └── conversation.md
```

→ [Output management guide](https://remenby31.github.io/agenTree/guide/output-management)

## Default Tools

```typescript
import { defaultTools, readFileTool, writeFileTool } from 'agentree';

// Individual import
const agent = new Agent({
  tools: [readFileTool, writeFileTool]
});

// All default tools
const agent = new Agent({
  tools: defaultTools
});
```

Available: `readFile`, `writeFile`, `searchTool`, `replaceFile`, `bash`

→ [Default tools documentation](https://remenby31.github.io/agenTree/api/built-in-tools)

## Monitoring

```typescript
import { AgentMonitor } from 'agentree';

const monitor = new AgentMonitor({
  logLevel: 'detailed',
  colors: true,
  timestamps: true
});

monitor.monitor(agent);
```

→ [Monitoring guide](https://remenby31.github.io/agenTree/guide/monitoring)

## Documentation

Complete documentation: [https://remenby31.github.io/agenTree/](https://remenby31.github.io/agenTree/)

- [Getting Started](https://remenby31.github.io/agenTree/guide/getting-started)
- [API Reference](https://remenby31.github.io/agenTree/api/agent)
- [Examples](https://remenby31.github.io/agenTree/examples/)

## Development

```bash
# Build
npm run build

# Development
npm run dev

# Examples
npm run example
npm run example:complex

# View execution logs
npm run view list
npm run view show <run-id>

# Cleanup
npm run cleanup old --keep 10
```

→ [Development guide](https://remenby31.github.io/agenTree/development/contributing)

### Project Structure

```
src/
├── core/           # Agent, Task, Config
├── llm/            # LLM clients
├── tools/          # Tool system
├── output/         # File generation
├── monitoring/     # Event system
└── types/          # TypeScript definitions
```

## Requirements

- Node.js 18+
- TypeScript 5+
- LLM API key (OpenAI/compatible)

## License

MIT