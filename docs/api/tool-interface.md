# Tool Interface

## Overview

Tools are functions that agents can call to interact with the outside world. AgenTree provides a type-safe tool creation system using Zod schemas for parameter validation.

## Tool Creation Function

### tool()

The main function for creating tools with automatic schema generation and validation.

```typescript
function tool<T extends z.ZodSchema>(options: ToolOptions<T>): Tool
```

### ToolOptions Interface

```typescript
interface ToolOptions<T extends z.ZodSchema> {
  name?: string;                              // Tool name (defaults to function name)
  description: string;                        // Description for LLM
  parameters: T;                              // Zod schema for parameters
  strict?: boolean;                           // Enable parameter validation (default: true)
  execute: (args: z.infer<T>, context?: any) => Promise<string> | string;
  errorFunction?: (context: any, error: Error) => string;
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `string` | ❌ | Function name | Tool identifier used by LLM |
| `description` | `string` | ✅ | - | Clear description of tool's purpose |
| `parameters` | `ZodSchema` | ✅ | - | Zod schema defining input parameters |
| `strict` | `boolean` | ❌ | `true` | Validate parameters before execution |
| `execute` | `Function` | ✅ | - | Tool implementation function |
| `errorFunction` | `Function` | ❌ | - | Custom error handler |

## Basic Tool Creation

### Simple Tool

```typescript
import { tool } from 'agentree';
import { z } from 'zod';

const greetingTool = tool({
  name: 'greet_user',
  description: 'Generate a personalized greeting',
  parameters: z.object({
    name: z.string().describe('Name of the person to greet'),
    language: z.enum(['en', 'es', 'fr']).default('en').describe('Language for greeting')
  }),
  execute: ({ name, language }) => {
    const greetings = {
      en: `Hello, ${name}!`,
      es: `¡Hola, ${name}!`,
      fr: `Bonjour, ${name}!`
    };
    return greetings[language];
  }
});
```

### Tool with Validation

```typescript
const emailTool = tool({
  name: 'send_email',
  description: 'Send an email to a recipient',
  parameters: z.object({
    to: z.string().email().describe('Recipient email address'),
    subject: z.string().min(1).describe('Email subject'),
    body: z.string().min(1).describe('Email content'),
    priority: z.enum(['low', 'normal', 'high']).default('normal')
  }),
  strict: true,  // Strict validation (default)
  execute: async ({ to, subject, body, priority }) => {
    // Type safety: parameters are validated and typed
    const result = await sendEmail({ to, subject, body, priority });
    return `Email sent to ${to} with subject "${subject}"`;
  }
});
```

## Parameter Schemas

### Basic Types

```typescript
const basicTypesTool = tool({
  name: 'process_data',
  description: 'Process various data types',
  parameters: z.object({
    // Strings
    text: z.string().describe('Text input'),
    requiredText: z.string().min(1).describe('Required non-empty text'),
    limitedText: z.string().max(100).describe('Text with max 100 characters'),
    regexText: z.string().regex(/^\d{3}-\d{2}-\d{4}$/).describe('SSN format'),
    
    // Numbers
    number: z.number().describe('Any number'),
    positiveNumber: z.number().positive().describe('Positive number only'),
    integerNumber: z.number().int().describe('Integer only'),
    rangeNumber: z.number().min(1).max(100).describe('Number between 1-100'),
    
    // Booleans
    flag: z.boolean().describe('True/false flag'),
    optionalFlag: z.boolean().optional().describe('Optional boolean'),
    
    // Enums
    choice: z.enum(['option1', 'option2', 'option3']).describe('Select one option'),
    status: z.enum(['pending', 'approved', 'rejected']).default('pending')
  }),
  execute: (params) => {
    // All parameters are properly typed
    return `Processed with ${params.choice} status: ${params.status}`;
  }
});
```

### Complex Types

```typescript
const complexTypesTool = tool({
  name: 'advanced_processor',
  description: 'Process complex data structures',
  parameters: z.object({
    // Arrays
    tags: z.array(z.string()).describe('Array of string tags'),
    numbers: z.array(z.number()).min(1).describe('At least one number'),
    limitedArray: z.array(z.string()).max(10).describe('Max 10 items'),
    
    // Objects
    user: z.object({
      name: z.string(),
      age: z.number().int().min(0),
      email: z.string().email().optional()
    }).describe('User information object'),
    
    // Nested objects
    config: z.object({
      database: z.object({
        host: z.string(),
        port: z.number().default(5432),
        ssl: z.boolean().default(true)
      }),
      cache: z.object({
        ttl: z.number().default(3600),
        maxSize: z.number().default(1000)
      }).optional()
    }).describe('Configuration object'),
    
    // Optional fields
    metadata: z.record(z.any()).optional().describe('Optional key-value metadata'),
    
    // Default values
    timeout: z.number().default(30).describe('Timeout in seconds'),
    retries: z.number().int().min(0).default(3).describe('Number of retries'),
    
    // Union types
    input: z.union([
      z.string().describe('Text input'),
      z.number().describe('Numeric input'),
      z.object({ type: z.string(), data: z.any() }).describe('Structured input')
    ]).describe('Flexible input type')
  }),
  execute: ({ user, config, input, timeout }) => {
    // All parameters are properly typed with TypeScript inference
    return `Processed user ${user.name} with timeout ${timeout}s`;
  }
});
```

### Advanced Schemas

```typescript
const advancedTool = tool({
  name: 'file_processor',
  description: 'Advanced file processing with validation',
  parameters: z.object({
    // File validation
    filePath: z.string()
      .regex(/\.(txt|csv|json|xml)$/, 'Must be txt, csv, json, or xml file')
      .describe('Path to file to process'),
    
    // Conditional validation
    operation: z.enum(['read', 'write', 'append']),
    content: z.string().optional(),
    
    // Custom validation
    dateRange: z.object({
      start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    }).refine(
      (data) => new Date(data.start) <= new Date(data.end),
      { message: "Start date must be before end date" }
    ),
    
    // Transform data
    csvOptions: z.object({
      delimiter: z.string().default(','),
      hasHeader: z.boolean().default(true),
      encoding: z.string().default('utf8')
    }).optional()
  }).refine(
    (data) => {
      // Cross-field validation
      if (data.operation === 'write' && !data.content) {
        return false;
      }
      return true;
    },
    { message: "Content required for write operations" }
  ),
  execute: async ({ filePath, operation, content, dateRange, csvOptions }) => {
    // Implementation with fully typed parameters
    switch (operation) {
      case 'read':
        return await fs.readFile(filePath, 'utf8');
      case 'write':
        await fs.writeFile(filePath, content!, 'utf8');
        return `Written to ${filePath}`;
      case 'append':
        await fs.appendFile(filePath, content || '', 'utf8');
        return `Appended to ${filePath}`;
    }
  }
});
```

## Tool Implementation Patterns

### Async Operations

```typescript
const apiTool = tool({
  name: 'fetch_data',
  description: 'Fetch data from external API',
  parameters: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
    headers: z.record(z.string()).optional(),
    body: z.any().optional(),
    timeout: z.number().default(10000)
  }),
  execute: async ({ url, method, headers, body, timeout }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return JSON.stringify(data, null, 2);
    } finally {
      clearTimeout(timeoutId);
    }
  }
});
```

### File Operations

```typescript
const fileSystemTool = tool({
  name: 'file_manager',
  description: 'Manage files and directories',
  parameters: z.object({
    operation: z.enum(['list', 'create', 'delete', 'move', 'copy']),
    path: z.string().describe('File or directory path'),
    destination: z.string().optional().describe('Destination path for move/copy'),
    content: z.string().optional().describe('Content for new files'),
    recursive: z.boolean().default(false).describe('Recursive operation for directories')
  }),
  execute: async ({ operation, path, destination, content, recursive }) => {
    switch (operation) {
      case 'list':
        const entries = await fs.readdir(path, { withFileTypes: true });
        return entries.map(entry => 
          `${entry.isDirectory() ? 'DIR' : 'FILE'}: ${entry.name}`
        ).join('\n');
        
      case 'create':
        if (content !== undefined) {
          await fs.writeFile(path, content, 'utf8');
          return `File created: ${path}`;
        } else {
          await fs.mkdir(path, { recursive });
          return `Directory created: ${path}`;
        }
        
      case 'delete':
        const stats = await fs.stat(path);
        if (stats.isDirectory()) {
          await fs.rmdir(path, { recursive });
        } else {
          await fs.unlink(path);
        }
        return `Deleted: ${path}`;
        
      case 'move':
        if (!destination) throw new Error('Destination required for move');
        await fs.rename(path, destination);
        return `Moved ${path} to ${destination}`;
        
      case 'copy':
        if (!destination) throw new Error('Destination required for copy');
        await fs.copyFile(path, destination);
        return `Copied ${path} to ${destination}`;
    }
  }
});
```

### Database Operations

```typescript
const databaseTool = tool({
  name: 'database_query',
  description: 'Execute database queries with connection pooling',
  parameters: z.object({
    query: z.string().describe('SQL query to execute'),
    params: z.array(z.any()).optional().describe('Query parameters'),
    database: z.string().default('default').describe('Database connection name'),
    timeout: z.number().default(30000).describe('Query timeout in ms')
  }),
  execute: async ({ query, params = [], database, timeout }) => {
    const connection = await getConnection(database);
    
    try {
      // Set query timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), timeout);
      });
      
      const queryPromise = connection.query(query, params);
      const result = await Promise.race([queryPromise, timeoutPromise]);
      
      return JSON.stringify({
        rowCount: result.rowCount,
        rows: result.rows,
        executionTime: result.executionTime
      }, null, 2);
    } finally {
      connection.release();
    }
  }
});
```

## Error Handling

### Built-in Error Handling

```typescript
const robustTool = tool({
  name: 'robust_operation',
  description: 'Tool with comprehensive error handling',
  parameters: z.object({
    input: z.string(),
    retries: z.number().int().min(0).default(3)
  }),
  execute: async ({ input, retries }) => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await riskyOperation(input);
        return `Success on attempt ${attempt + 1}: ${result}`;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }
    
    throw new Error(`Failed after ${retries + 1} attempts: ${lastError?.message}`);
  }
});
```

### Custom Error Functions

```typescript
const apiToolWithErrorHandling = tool({
  name: 'resilient_api_call',
  description: 'API call with intelligent error handling',
  parameters: z.object({
    endpoint: z.string().url(),
    apiKey: z.string().optional()
  }),
  execute: async ({ endpoint, apiKey }) => {
    const response = await fetch(endpoint, {
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
    });
    
    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }
    
    return await response.text();
  },
  errorFunction: (context, error) => {
    const message = error.message;
    
    if (message.includes('HTTP_401')) {
      return 'Authentication failed. Please check your API key and ensure it has the necessary permissions.';
    } else if (message.includes('HTTP_403')) {
      return 'Access forbidden. Your API key may not have permission to access this endpoint.';
    } else if (message.includes('HTTP_404')) {
      return 'Endpoint not found. Please verify the URL is correct.';
    } else if (message.includes('HTTP_429')) {
      return 'Rate limit exceeded. Please wait before making another request.';
    } else if (message.includes('HTTP_5')) {
      return 'Server error occurred. Please try again later.';
    } else if (message.includes('fetch')) {
      return 'Network error occurred. Please check your internet connection.';
    }
    
    return `API call failed: ${message}`;
  }
});
```

## Tool Registration

### Automatic Registration

Tools are automatically registered when passed to agents:

```typescript
import { ToolRegistry } from 'agentree';

const myTool = tool({ /* ... */ });

// Automatic registration
const agent = new Agent({
  tools: [myTool],  // Tool is registered for child access
  // ...
});

// Check registration
console.log('Registered tools:', ToolRegistry.list());
console.log('Tool available:', ToolRegistry.has('my_tool'));
```

### Manual Registration

```typescript
// Manual registration for global access
ToolRegistry.register(myTool);

// Get tool by name
const retrievedTool = ToolRegistry.get('my_tool');

// Clear all tools (useful for testing)
ToolRegistry.clear();
```

### Tool Name Resolution

```typescript
// Tool name defaults to function name
const autoNamedTool = tool({
  description: 'Tool with automatic name',
  parameters: z.object({}),
  execute: function myToolName() {  // Name: 'myToolName'
    return 'result';
  }
});

// Explicit name override
const explicitNamedTool = tool({
  name: 'custom_name',  // Name: 'custom_name'
  description: 'Tool with explicit name',
  parameters: z.object({}),
  execute: () => 'result'
});
```

## Tool Interface

### Generated Tool Interface

The `tool()` function returns a `Tool` object with this interface:

```typescript
interface Tool {
  name: string;                                    // Tool name
  description: string;                             // Tool description
  parameters: {                                    // JSON Schema parameters
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any, context?: any) => Promise<string> | string;
  errorFunction?: (context: any, error: Error) => string;
}
```

### Tool Metadata for LLM

Tools are converted to this format for LLM consumption:

```typescript
interface ToolMetadata {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
```

## Advanced Tool Patterns

### Contextual Tools

Tools that adapt behavior based on agent context:

```typescript
const contextualTool = tool({
  name: 'smart_file_reader',
  description: 'Read files with format detection',
  parameters: z.object({
    filePath: z.string()
  }),
  execute: async ({ filePath }, context) => {
    // Access agent context if available
    const agentName = context?.agentName || 'unknown';
    const agentDepth = context?.agentDepth || 0;
    
    console.log(`Tool called by ${agentName} at depth ${agentDepth}`);
    
    const extension = path.extname(filePath);
    const content = await fs.readFile(filePath, 'utf8');
    
    switch (extension) {
      case '.json':
        return `JSON data: ${JSON.stringify(JSON.parse(content), null, 2)}`;
      case '.csv':
        return `CSV data (${content.split('\n').length} rows):\n${content}`;
      default:
        return `Text content (${content.length} chars):\n${content}`;
    }
  }
});
```

### Tool Composition

Create tools that use other tools:

```typescript
const compositeTool = tool({
  name: 'data_pipeline',
  description: 'Execute a complete data processing pipeline',
  parameters: z.object({
    inputFile: z.string(),
    outputFile: z.string(),
    transformations: z.array(z.string())
  }),
  execute: async ({ inputFile, outputFile, transformations }) => {
    // Use other tools programmatically
    let data = await readFileTool.execute({ path: inputFile });
    
    for (const transformation of transformations) {
      data = await transformationTool.execute({ 
        data, 
        operation: transformation 
      });
    }
    
    await writeFileTool.execute({ 
      path: outputFile, 
      content: data 
    });
    
    return `Pipeline completed: ${inputFile} -> ${outputFile}`;
  }
});
```

### Dynamic Tool Generation

Generate tools programmatically:

```typescript
const createDatabaseTool = (tableName: string) => {
  return tool({
    name: `query_${tableName}`,
    description: `Query the ${tableName} table`,
    parameters: z.object({
      where: z.string().optional().describe('WHERE clause'),
      limit: z.number().optional().describe('Result limit'),
      orderBy: z.string().optional().describe('ORDER BY clause')
    }),
    execute: async ({ where, limit, orderBy }) => {
      let query = `SELECT * FROM ${tableName}`;
      if (where) query += ` WHERE ${where}`;
      if (orderBy) query += ` ORDER BY ${orderBy}`;
      if (limit) query += ` LIMIT ${limit}`;
      
      const result = await database.query(query);
      return JSON.stringify(result.rows, null, 2);
    }
  });
};

// Generate tools for each table
const usersTool = createDatabaseTool('users');
const ordersTool = createDatabaseTool('orders');
const productsTool = createDatabaseTool('products');
```

## Best Practices

### 1. Clear Tool Names and Descriptions

```typescript
// Good: Descriptive and specific
const calculateMortgageTool = tool({
  name: 'calculate_mortgage_payment',
  description: 'Calculate monthly mortgage payment including principal, interest, taxes, and insurance',
  // ...
});

// Poor: Vague and generic
const calcTool = tool({
  name: 'calc',
  description: 'Calculate stuff',
  // ...
});
```

### 2. Comprehensive Parameter Validation

```typescript
// Good: Detailed validation with helpful descriptions
const emailTool = tool({
  parameters: z.object({
    to: z.string()
      .email('Must be a valid email address')
      .describe('Recipient email address'),
    subject: z.string()
      .min(1, 'Subject cannot be empty')
      .max(100, 'Subject must be under 100 characters')
      .describe('Email subject line'),
    body: z.string()
      .min(1, 'Email body cannot be empty')
      .describe('Email content in plain text or HTML'),
    priority: z.enum(['low', 'normal', 'high'])
      .default('normal')
      .describe('Email priority level')
  }),
  // ...
});
```

### 3. Proper Error Handling

```typescript
// Good: Comprehensive error handling
const fileTool = tool({
  name: 'secure_file_operation',
  execute: async ({ filePath, operation }) => {
    try {
      // Validate file path
      if (filePath.includes('..')) {
        throw new Error('Path traversal not allowed');
      }
      
      // Check permissions
      await fs.access(filePath, fs.constants.R_OK);
      
      // Perform operation
      return await performOperation(filePath, operation);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      } else if (error.code === 'EACCES') {
        throw new Error(`Permission denied: ${filePath}`);
      }
      throw error;
    }
  },
  errorFunction: (context, error) => {
    // Provide user-friendly error messages
    return `File operation failed: ${error.message}. Please check the file path and permissions.`;
  }
});
```

## See Also

- [Built-in Tools](/api/built-in-tools) - Reference for default tools
- [Agent Class](/api/agent-class) - Using tools with agents
- [Examples - Custom Tools](/examples/custom-tools) - Practical tool examples
- [Types Reference](/api/types-reference) - Complete type definitions