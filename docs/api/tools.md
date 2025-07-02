# AgenTree Tools API

This page documents the architecture, interface, and extension of the AgenTree tool system, intended for developers.

---

## General Architecture

The AgenTree tool system is based on:
- A standardized interface for each tool (`Tool`)
- A centralized registry (`ToolRegistry`) for registration and discovery
- A tool creation utility (`tool`) facilitating parameter validation and integration

### Main Interfaces

#### [`ToolOptions<T>`](../../src/tools/ToolHelper.ts)
Describes the options required to create a tool:
- `name?`: tool name (optional, otherwise deduced)
- `description`: textual description
- `parameters`: Zod schema of expected parameters
- `strict?`: strict validation (default: true)
- `execute`: asynchronous function executing the tool
- `errorFunction?`: custom error handler

#### [`Tool`](../../src/tools/ToolHelper.ts)
Represents a registered tool:
- `name`: unique name
- `description`: description
- `parameters`: JSON Schema derived from the Zod schema
- `execute(args, context?)`: tool execution
- `errorFunction?`: error handler

#### [`ToolRegistry`](../../src/tools/ToolRegistry.ts)
Static registry centralizing all tools:
- `register(tool)`: registers a tool
- `get(name)`: retrieves a tool by its name
- `list()`: lists the names of registered tools
- `clear()`: clears the registry
- `has(name)`: checks for the presence of a tool
- `getAll()`: returns all tools

---

## Creating a Tool

Use the [`tool`](../../src/tools/ToolHelper.ts) function to transform a configuration into a compliant `Tool` object:

```typescript
import { z } from 'zod';
import { tool } from 'src/tools/ToolHelper';

const myToolSchema = z.object({
  input: z.string().describe("Input to process"),
});

const myTool = tool({
  name: 'myTool',
  description: 'An example tool',
  parameters: myToolSchema,
  execute: async (args) => {
    // Processing
    return `Input: ${args.input}`;
  }
});
```

Parameter validation is automatic (via Zod) if `strict` is set to `true`.

---

## Registration and Usage

To make a tool available in AgenTree, it must be registered:

```typescript
import { ToolRegistry } from 'src/tools/ToolRegistry';

ToolRegistry.register(myTool);
```

The tool can then be retrieved and used dynamically:

```typescript
const tool = ToolRegistry.get('myTool');
if (tool) {
  const result = await tool.execute({ input: 'test' });
  // ...
}
```

---

## Extension: Creating a Custom Tool

Example: file reading tool ([`readFileTool`](../../src/tools/defaults/readFile.ts)):

```typescript
import { z } from 'zod';
import { tool } from 'src/tools/ToolHelper';
import * as fs from 'fs-extra';

const readFileSchema = z.object({
  path: z.string().describe("Path to the file to read"),
});

export const readFileTool = tool({
  name: 'readFile',
  description: "Reads the content of a file",
  parameters: readFileSchema,
  execute: async (args) => {
    const { path } = args;
    if (!await fs.pathExists(path)) {
      throw new Error(`The file ${path} does not exist`);
    }
    const content = await fs.readFile(path, 'utf-8');
    return content;
  }
});
```

---

## Parameter Schema Management

Parameter schemas are defined with [Zod](https://zod.dev/) and automatically converted to JSON Schema for the API.
Supported types include: strings, numbers, booleans, objects, arrays, enumerations, optional fields, and default values.

---

## Best Practices

- Use explicit descriptions for each parameter
- Handle errors via `errorFunction` if needed
- Prioritize strict validation for robustness
- Register your tools when the application starts

---

## See Also

- [Basic types and interfaces](./types.md)
- [Built-in tools](./built-in-tools.md)
- [Tool extension guide](../guide/custom-tools.md)
