# Advanced Usage Examples of AgenTree

This page presents concrete and advanced use cases of AgenTree, illustrated by real code. It is intended for developers wishing to fully exploit the flexibility of the framework to create custom agents, integrate business tools and manage events in a fine-grained manner.

---

## 1. Creating a custom tool

AgenTree makes it easy to define business tools with parameter validation thanks to [Zod](https://zod.dev/).

```typescript
import { tool } from '../src';
import { z } from 'zod';

const calculatorTool = tool({
  name: 'calculator',
  description: 'Performs basic mathematical calculations',
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
      case 'divide':
        if (b === 0) throw new Error('Division by zero is not allowed');
        return `${a} / ${b} = ${a / b}`;
    }
  }
});
```

---

## 2. Instantiating and configuring an agent

The agent is configured with one or more tools, a task, and advanced options (model, depth, streaming, etc.).

```typescript
import { Agent } from '../src';

const agent = new Agent({
  name: "test-agent",
  task: "Use the calculator tool to add 25 and 17, then multiply the result by 3.",
  tools: [calculatorTool],
  config: {
    apiKey: process.env.OPENAI_KEY_API,
    model: "gpt-4o-mini",
    maxDepth: 2,
    outputFile: true,
    streaming: true,
  }
});
```

---

## 3. Advanced event management

AgenTree exposes many events to monitor execution, react to key steps or integrate custom logging.

```typescript
agent.on('agentCompleted', (result) => {
  console.log('Agent completed successfully:', result);
});

agent.on('childCreated', (child) => {
  console.log('Child agent created:', child);
});

// Summary of tool calls
agent.on('toolCalls', (data) => {
  console.log('📋 Tools called:', data.toolCalls.join(', '));
});

// Granular tool tracking
agent.on('toolCallStarted', (data) => {
  console.log(`🚀 Tool started: ${data.toolName}`);
  console.log(`   Input: ${JSON.stringify(data.toolInput)}`);
});

agent.on('toolCallCompleted', (data) => {
  if (data.toolError) {
    console.log(`❌ Failure: ${data.toolName} (${data.duration}ms)`);
    console.log(`   Error: ${data.toolError}`);
  } else {
    console.log(`✅ Completed: ${data.toolName} (${data.duration}ms)`);
    console.log(`   Output: ${data.toolOutput}`);
  }
});

// Streaming output (if enabled)
agent.on('streamChunk', (data) => {
  if (data.chunk.content) {
    process.stdout.write(`💭 ${data.chunk.content}`);
  }
  if (data.chunk.done) {
    console.log('\n🏁 Stream finished');
  }
});
```

---

## 4. Tips for going further

- **Adding business tools**: Take inspiration from the structure of `calculatorTool` to integrate your own tools (API, scripts, etc.).
- **Context management**: Use the context system to provide data or files to the agent (see [`docs/guide/context-loading.md`](context-loading.md)).
- **Task decomposition**: Take advantage of AgenTree's ability to create child agents to orchestrate complex workflows (see [`docs/guide/task-decomposition.md`](task-decomposition.md)).
- **Monitoring & Debug**: Connect to events to trace, monitor or debug execution (see [`docs/guide/debugging.md`](debugging.md)).

---

## 5. Cross-references

- [Agent API](../api/agent.md)
- [Tool system](tools-system.md)
- [Event management](event-system.md)
- [Additional examples](../examples/index.md)
