# Getting Started

## Installation

```bash
npm install agentree zod
```

## Your First Agent

```typescript
import { Agent, tool } from 'agentree';
import { z } from 'zod';

const weatherTool = tool({
  name: 'get_weather',
  description: 'Get weather for a city',
  parameters: z.object({
    city: z.string()
  }),
  execute: async ({ city }) => {
    return `The weather in ${city} is sunny!`;
  }
});

const agent = new Agent({
  name: "weather-assistant",
  task: "Tell me the weather in Paris",
  tools: [weatherTool]
});

const result = await agent.execute();
console.log(result);
```


## What Just Happened?

1. **Agent created** with a specific task
2. **Tool provided** for weather lookup  
3. **Agent executed** and used the tool automatically
4. **Result returned** with the weather information

## Next Steps

- [Core Concepts](/guide/core-concepts) - How agents create children
- [Examples](/guide/examples) - More complex scenarios
- [Custom Tools](/guide/custom-tools) - Build your own tools