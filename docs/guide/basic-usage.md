# Basic Usage

## Your First Agent

Create a simple agent that completes a task:

```typescript
import { Agent } from 'agentree';

const agent = new Agent({
  name: "hello-agent",
  task: "Write a friendly greeting message",
  config: {
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY
  }
});

const result = await agent.execute();
console.log(result.result);
```

## Agent with Tools

Add custom tools to extend agent capabilities:

```typescript
import { Agent, tool } from 'agentree';
import { z } from 'zod';

// Define a calculator tool
const calculatorTool = tool({
  name: 'calculator',
  description: 'Perform basic mathematical calculations',
  parameters: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number()
  }),
  async execute({ operation, a, b }) {
    switch (operation) {
      case 'add': return `${a} + ${b} = ${a + b}`;
      case 'subtract': return `${a} - ${b} = ${a - b}`;
      case 'multiply': return `${a} * ${b} = ${a * b}`;
      case 'divide': return `${a} / ${b} = ${a / b}`;
    }
  }
});

const agent = new Agent({
  name: "math-agent",
  task: "Calculate 25 * 17 and then add 100 to the result",
  tools: [calculatorTool],
  config: {
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY
  }
});

const result = await agent.execute();
```

## Agent with Context

Provide context (files, URLs, text) to your agent:

```typescript
const agent = new Agent({
  name: "file-analyzer",
  task: "Analyze the data in the CSV file and summarize key insights",
  context: [
    "./data/sales-data.csv",
    "Focus on trends and outliers",
    "https://example.com/industry-report"
  ],
  tools: [readFileTool],
  config: {
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY
  }
});
```

## Agent Configuration

Configure behavior and output:

```typescript
const agent = new Agent({
  name: "researcher",
  task: "Research recent AI developments",
  tools: [webSearchTool],
  maxDepth: 3,              // Maximum hierarchy depth
  config: {
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY,
    outputFile: true,       // Generate reports
    outputFolder: './reports',
    streaming: false        // Disable streaming
  }
});
```

## Default Tools

Use built-in tools for common operations:

```typescript
import { defaultTools } from 'agentree';

const agent = new Agent({
  name: "file-processor",
  task: "Read all .txt files, analyze content, and create a summary",
  tools: defaultTools, // readFile, writeFile, searchTool, replaceFile, bash
  config: {
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY
  }
});
```

## Basic Monitoring

Monitor agent execution:

```typescript
agent.on('agentCompleted', (data) => {
  console.log(`✅ Agent completed in ${data.executionTime}ms`);
});

agent.on('toolCallCompleted', (data) => {
  console.log(`🔧 Used tool: ${data.toolName}`);
});

agent.on('agentError', (data) => {
  console.error(`❌ Error: ${data.error}`);
});

const result = await agent.execute();
```

## Error Handling

Handle execution errors:

```typescript
try {
  const result = await agent.execute();
  
  if (result.success) {
    console.log('Task completed:', result.result);
  } else {
    console.error('Task failed:', result.error);
  }
} catch (error) {
  console.error('Execution error:', error.message);
}
```

## Output Files

When `outputFile: true`, agents generate:

```
.agentree/
└── researcher-2025-07-02-14-30/
    ├── agent-report.md      # Human-readable report
    ├── conversation.md      # LLM conversation log
    ├── execution-log.json   # Event stream
    └── metadata.json        # Agent metadata
```

## Next Steps

- [Agent Hierarchy](/guide/agent-hierarchy) - Understand task decomposition
- [Tools System](/guide/tools-system) - Create powerful custom tools
- [Examples](/examples/) - More complex use cases