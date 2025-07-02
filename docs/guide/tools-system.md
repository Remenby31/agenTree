# Tools System

## Overview

Tools are functions that agents can call to interact with the outside world. AgenTree uses Zod schemas for type-safe parameter validation and automatic documentation generation.

## Creating Tools

### Basic Tool

```typescript
import { tool } from 'agentree';
import { z } from 'zod';

const weatherTool = tool({
  name: 'get_weather',
  description: 'Get current weather for a city',
  parameters: z.object({
    city: z.string().describe('Name of the city'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius')
  }),
  async execute({ city, units }) {
    // Your implementation
    const temp = await fetchWeather(city);
    return `Temperature in ${city}: ${temp}°${units === 'celsius' ? 'C' : 'F'}`;
  }
});
```

### Advanced Tool with Error Handling

```typescript
const databaseTool = tool({
  name: 'query_database',
  description: 'Execute SQL queries on the database',
  parameters: z.object({
    query: z.string().describe('SQL query to execute'),
    params: z.array(z.any()).optional().describe('Query parameters')
  }),
  async execute({ query, params = [] }) {
    const result = await database.query(query, params);
    return JSON.stringify(result, null, 2);
  },
  errorFunction: (context, error) => {
    return `Database error: ${error.message}. Please check your SQL syntax.`;
  }
});
```

## Tool Options

### Complete Options Reference

```typescript
interface ToolOptions<T extends z.ZodSchema> {
  name?: string;                // Tool name (defaults to function name)
  description: string;          // Description for LLM
  parameters: T;                // Zod schema for parameters
  strict?: boolean;             // Validate parameters (default: true)
  execute: (args, context?) => Promise<string> | string;
  errorFunction?: (context, error) => string;
}
```

### Parameter Validation

```typescript
const strictTool = tool({
  name: 'validate_email',
  description: 'Validate email addresses',
  parameters: z.object({
    email: z.string().email().describe('Email address to validate'),
    checkDomain: z.boolean().default(false)
  }),
  strict: true, // Default - throws error on invalid params
  execute: ({ email, checkDomain }) => {
    // TypeScript knows the exact types here
    return `Email ${email} is valid`;
  }
});

const flexibleTool = tool({
  strict: false, // Accept any parameters
  // ... other options
});
```

## Parameter Types

### Basic Types

```typescript
const basicTypes = z.object({
  text: z.string().describe('Any text input'),
  number: z.number().describe('Numeric value'),
  flag: z.boolean().describe('True/false flag'),
  choice: z.enum(['option1', 'option2', 'option3']).describe('Select one option')
});
```

### Complex Types

```typescript
const complexTypes = z.object({
  // Arrays
  items: z.array(z.string()).describe('List of items'),
  numbers: z.array(z.number()).min(1).describe('At least one number'),
  
  // Objects
  config: z.object({
    host: z.string(),
    port: z.number().default(3000),
    ssl: z.boolean().default(false)
  }).describe('Configuration object'),
  
  // Optional fields
  metadata: z.string().optional().describe('Optional metadata'),
  
  // Default values
  timeout: z.number().default(30).describe('Timeout in seconds'),
  
  // Validation
  email: z.string().email().describe('Valid email address'),
  url: z.string().url().describe('Valid URL'),
  
  // Custom validation
  password: z.string()
    .min(8, 'Must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .describe('Strong password')
});
```

### Union Types

```typescript
const unionTool = tool({
  name: 'process_input',
  parameters: z.object({
    input: z.union([
      z.string().describe('Text input'),
      z.number().describe('Numeric input'),
      z.object({ type: z.string(), data: z.any() }).describe('Structured input')
    ]).describe('Input can be text, number, or object')
  }),
  execute: ({ input }) => {
    if (typeof input === 'string') {
      return `Text: ${input}`;
    } else if (typeof input === 'number') {
      return `Number: ${input}`;
    } else {
      return `Object: ${input.type}`;
    }
  }
});
```

## Tool Implementation Patterns

### File Operations

```typescript
const fileTool = tool({
  name: 'process_file',
  description: 'Read and process various file types',
  parameters: z.object({
    filePath: z.string().describe('Path to the file'),
    operation: z.enum(['read', 'analyze', 'transform']).describe('Operation to perform')
  }),
  async execute({ filePath, operation }) {
    const content = await fs.readFile(filePath, 'utf8');
    
    switch (operation) {
      case 'read':
        return content;
      case 'analyze':
        return `File contains ${content.length} characters`;
      case 'transform':
        return content.toUpperCase();
    }
  }
});
```

### API Integration

```typescript
const apiTool = tool({
  name: 'call_api',
  description: 'Make HTTP requests to external APIs',
  parameters: z.object({
    url: z.string().url().describe('API endpoint URL'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
    headers: z.record(z.string()).optional().describe('HTTP headers'),
    body: z.any().optional().describe('Request body')
  }),
  async execute({ url, method, headers = {}, body }) {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const data = await response.json();
    return JSON.stringify(data, null, 2);
  }
});
```

### Data Processing

```typescript
const csvTool = tool({
  name: 'process_csv',
  description: 'Process CSV data with various operations',
  parameters: z.object({
    data: z.string().describe('CSV data as string'),
    operation: z.enum(['parse', 'filter', 'aggregate', 'transform']),
    options: z.object({
      filterColumn: z.string().optional(),
      filterValue: z.string().optional(),
      groupBy: z.string().optional(),
      aggregateColumn: z.string().optional()
    }).optional()
  }),
  async execute({ data, operation, options = {} }) {
    const rows = data.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    switch (operation) {
      case 'parse':
        return `Parsed ${dataRows.length} rows with columns: ${headers.join(', ')}`;
      
      case 'filter':
        const colIndex = headers.indexOf(options.filterColumn!);
        const filtered = dataRows.filter(row => row[colIndex] === options.filterValue);
        return `Filtered to ${filtered.length} rows`;
      
      case 'aggregate':
        // Implementation for aggregation
        return 'Aggregation completed';
      
      default:
        return 'Operation completed';
    }
  }
});
```

## Tool Registration

### Automatic Registration

Tools are automatically registered when passed to agents:

```typescript
const myTool = tool({ /* ... */ });

const agent = new Agent({
  tools: [myTool], // Automatically registered in ToolRegistry
  // ...
});
```

### Manual Registration

```typescript
import { ToolRegistry } from 'agentree';

ToolRegistry.register(myTool);

// Child agents can now access by name
const parentAgent = new Agent({
  task: "Create a child that uses myTool",
  // When parent creates child with tools: ["myTool"], it's found in registry
});
```

### Tool Names

Use clear, descriptive names:

```typescript
// Good
const tool1 = tool({ name: 'calculate_mortgage_payment', /* ... */ });
const tool2 = tool({ name: 'validate_credit_score', /* ... */ });
const tool3 = tool({ name: 'generate_loan_report', /* ... */ });

// Poor
const tool1 = tool({ name: 'calc', /* ... */ });
const tool2 = tool({ name: 'validate', /* ... */ });
const tool3 = tool({ name: 'report', /* ... */ });
```

## Built-in Tools

### Core Tools (Always Available)

- `createAgent`: Create child agents
- `stopAgent`: Return final results

### Default Tools (Import to Use)

```typescript
import { defaultTools, readFileTool, writeFileTool } from 'agentree';

// Individual tools
const agent = new Agent({
  tools: [readFileTool, writeFileTool]
});

// All default tools
const agent = new Agent({
  tools: defaultTools
});
```

Available default tools:
- `readFile`: Read file contents
- `writeFile`: Create/overwrite files
- `searchTool`: Search text in files
- `replaceFile`: Find/replace in files
- `bash`: Execute shell commands

## Error Handling

### Tool-Level Error Handling

```typescript
const robustTool = tool({
  name: 'robust_operation',
  parameters: z.object({
    input: z.string()
  }),
  async execute({ input }) {
    try {
      const result = await riskyOperation(input);
      return `Success: ${result}`;
    } catch (error) {
      // Handle internally
      return `Operation failed, falling back to default: ${getDefaultResult()}`;
    }
  }
});
```

### Custom Error Functions

```typescript
const toolWithCustomErrors = tool({
  name: 'api_call',
  parameters: z.object({
    endpoint: z.string().url()
  }),
  async execute({ endpoint }) {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  },
  errorFunction: (context, error) => {
    if (error.message.includes('HTTP 404')) {
      return 'Endpoint not found. Please check the URL and try again.';
    }
    if (error.message.includes('HTTP 403')) {
      return 'Access denied. Please check your authentication credentials.';
    }
    return `API call failed: ${error.message}`;
  }
});
```

## Best Practices

### 1. Single Responsibility

Each tool should do one thing well:

```typescript
// Good - specific purpose
const validateEmailTool = tool({ /* validate emails */ });
const sendEmailTool = tool({ /* send emails */ });

// Poor - multiple responsibilities
const emailTool = tool({ /* validate AND send emails */ });
```

### 2. Descriptive Parameters

Use clear descriptions and constraints:

```typescript
const goodTool = tool({
  parameters: z.object({
    startDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe('Start date in YYYY-MM-DD format'),
    endDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe('End date in YYYY-MM-DD format (must be after startDate)'),
    includeWeekends: z.boolean()
      .default(false)
      .describe('Whether to include weekends in the calculation')
  }),
  // ...
});
```

### 3. Meaningful Return Values

Return structured, informative results:

```typescript
const analyticsTool = tool({
  name: 'analyze_data',
  parameters: z.object({ data: z.array(z.number()) }),
  execute: ({ data }) => {
    const mean = data.reduce((a, b) => a + b) / data.length;
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    return JSON.stringify({
      summary: `Analyzed ${data.length} data points`,
      statistics: { mean, min, max },
      insights: mean > 100 ? 'Above average performance' : 'Below average performance'
    }, null, 2);
  }
});
```

### 4. Proper Error Messages

Provide actionable error messages:

```typescript
const fileTool = tool({
  name: 'read_config',
  parameters: z.object({
    configPath: z.string()
  }),
  async execute({ configPath }) {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found at ${configPath}. Please create the file or check the path.`);
    }
    // ...
  }
});
```