# Custom Tools

Create custom tools to extend your agents' capabilities.

## Quick Start

1. Define your tool schema with Zod
2. Use the `tool()` helper function
3. Register it (optional) or pass it directly to agents

## Basic Example

```typescript
import { z } from 'zod';
import { tool } from '../tools/ToolHelper';

// Weather Tool Example
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

```

## Using Tools

### Direct usage (recommended)
```typescript
import { Agent } from 'agentree';
import { weatherTool } from './my-tools';

const agent = new Agent({
  name: 'Weather Bot',
  task: 'Help with weather',
  tools: [weatherTool], // Pass tool objects directly
  config: { model: 'gpt-4', apiKey: 'your-key' }
});
```

## More Examples

### Calculator Tool
```typescript
const calculatorTool = tool({
  name: 'calculator',
  description: 'Perform math calculations',
  parameters: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number()
  }),
  execute: async ({ operation, a, b }) => {
    switch (operation) {
      case 'add': return `${a} + ${b} = ${a + b}`;
      case 'subtract': return `${a} - ${b} = ${a - b}`;
      case 'multiply': return `${a} × ${b} = ${a * b}`;
      case 'divide': 
        if (b === 0) throw new Error('Cannot divide by zero');
        return `${a} ÷ ${b} = ${a / b}`;
    }
  }
});
```

### HTTP API Tool
```typescript
const apiTool = tool({
  name: 'httpRequest',
  description: 'Make HTTP requests',
  parameters: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST']).default('GET'),
    body: z.any().optional()
  }),
  execute: async ({ url, method, body }) => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    
    return await response.text();
  }
});
```

## Schema Validation

Use Zod's full power for validation:

```typescript
const userSchema = z.object({
  email: z.string().email().describe("User's email"),
  age: z.number().min(0).max(120).describe("User's age"),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    notifications: z.boolean().default(true)
  }).optional()
});
```

## Testing Tools

Test your tools directly:

```typescript
// Test the tool
const result = await weatherTool.execute({ 
  city: 'Paris', 
  units: 'celsius' 
});
console.log(result); // "Weather in Paris: 25°C"
```

That's it! Your custom tools will work with AgentTree's event system, streaming, and monitoring.
