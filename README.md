# AgenTree 🌳

> **Hierarchical AI agents that decompose tasks automatically**

AgenTree is a TypeScript library that enables AI agents to recursively break down complex tasks by creating specialized child agents. Each agent can dynamically define the role, context, and tools of its children, forming an intelligent task decomposition tree.

[![npm version](https://badge.fury.io/js/agentree.svg)](https://www.npmjs.com/package/agentree)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Key Features

- **🧠 Intelligent Task Decomposition** - Agents automatically break down complex tasks into manageable subtasks
- **🎯 Dynamic Role Assignment** - Parent agents define specialized roles and tools for their children
- **📁 Automatic Documentation** - Complete execution traces saved as structured markdown reports  
- **🔧 Easy Tool Creation** - Transform any function into an agent tool with Zod schema validation
- **🔌 MCP Integration** - Native support for Model Context Protocol servers
- **📊 Real-time Monitoring** - Track agent creation and task progress with event callbacks

## 🚀 Quick Start

```typescript
import { Agent, tool } from 'agentree';
import { z } from 'zod';

// Define tools using the tool() helper with Zod schemas
const webSearchTool = tool({
  name: 'web_search',
  description: 'Search the web for information',
  parameters: z.object({
    query: z.string().describe('The search query'),
    maxResults: z.number().default(5).describe('Maximum number of results to return')
  }),
  async execute({ query, maxResults }) {
    // Your implementation
    return `Search results for: ${query}`;
  }
});

const readFileTool = tool({
  name: 'read_file',
  description: 'Read content from a file',
  parameters: z.object({
    filePath: z.string().describe('Path to the file to read')
  }),
  async execute({ filePath }) {
    return fs.readFileSync(filePath, 'utf8');
  }
});

// Create and execute an agent
const agent = new Agent({
  name: "market-researcher",
  task: "Research our competitors and create a detailed analysis report",
  context: [
    "./company-info.md",
    "https://industry-report.com/2025-trends"
  ],
  tools: [webSearchTool, readFileTool],
  config: {
    model: "claude-3-sonnet",
    maxDepth: 3,
    outputFile: true
  }
});

const result = await agent.execute();
console.log("Analysis complete! Check .agentree/ for detailed reports");
```

## 🧠 How It Works

Unlike traditional AI frameworks where you predefine agent roles, **AgenTree agents create their own specialized children on-demand**:

1. **📝 Parent receives a complex task**
2. **🤔 Analyzes what subtasks are needed** 
3. **👶 Creates specialized child agents** with custom roles, context, and tools
4. **🔄 Children can create their own children** (up to max depth)
5. **📊 Results bubble up** through the hierarchy
6. **📁 Complete execution tree** saved as organized markdown reports

### Example Decomposition

```
🎯 Task: "Launch a new product"
└── 📊 Market Research Agent
    ├── 🔍 Competitor Analysis Agent  
    ├── 📈 Trend Analysis Agent
    └── 💰 Pricing Research Agent
└── 📋 Strategy Planning Agent
    ├── 🎨 Marketing Strategy Agent
    └── 📅 Timeline Planning Agent
```

## 📖 Complete Examples

### Basic Usage

```typescript
const contentCreator = new Agent({
  name: "content-creator",
  task: "Write a blog post about sustainable technology",
  tools: [webSearchTool, readFileTool]
});

await contentCreator.execute();
```

### With Custom Context

```typescript
const readCSVTool = tool({
  name: 'read_csv',
  description: 'Read and parse CSV data',
  parameters: z.object({
    filePath: z.string().describe('Path to the CSV file')
  }),
  async execute({ filePath }) {
    // CSV parsing implementation
    return parsedData;
  }
});

const agent = new Agent({
  name: "sales-analyzer", 
  task: "Analyze Q1 sales performance and identify improvement opportunities",
  context: [
    "./data/sales-q1.csv",           // File context
    "./docs/sales-methodology.md",   // Documentation context  
    "Our target market is SMB SaaS companies" // Text context
  ],
  tools: [readCSVTool, calculateMetrics, generateChart]
});
```

### Advanced Configuration

```typescript
const agent = new Agent({
  name: "strategic-planner",
  task: "Develop a 2025 product roadmap",
  tools: [webSearchTool, readFileTool, dataAnalysis],
  config: {
    baseUrl: "https://api.anthropic.com",
    model: "claude-4-sonnet", 
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxDepth: 4,
    outputFile: true,
    outputFolder: "./reports"
  }
});
```

### Real-time Monitoring

```typescript
const agent = new Agent({
  name: "researcher",
  task: "Research market trends",
  tools: [webSearchTool]
});

// Monitor agent tree creation
agent.on('agentCreated', (childAgent) => {
  console.log(`✨ Created: ${childAgent.name} - ${childAgent.task}`);
});

agent.on('agentCompleted', (childAgent, result) => {
  console.log(`✅ Completed: ${childAgent.name}`);
});

await agent.execute();
```

### List of Events

| Event | Description | Data |
|-------|-------------|------|
| `agentCreated` | Agent created | `{ id, name, task, depth, parentId }` |
| `agentStarted` | Agent started | `{ id, name, task, depth }` |
| `agentCompleted` | Agent completed | `{ id, name, result, executionTime, success }` |
| `agentError` | Error in agent | `{ id, name, error, stack }` |
| `contextLoaded` | Context loaded | `{ id, name, context: { fileCount, urlCount, textCount } }` |
| `llmCall` | LLM call | `{ id, name, messageCount, availableTools, model }` |
| `toolCalls` | Tool usage | `{ id, name, toolCalls }` |
| `childCreated` | Child agent created | `{ parentId, parentName, childId, childName, childTask }` |
| `child*` | Child events | All events from child agents |

## 🔧 Creating Custom Tools

Transform any function into an agent tool using the `tool()` helper with Zod schema validation:

```typescript
import { tool } from 'agentree';
import { z } from 'zod';

// Analyze CSV data tool
const analyzeCSVTool = tool({
  name: 'analyze_csv',
  description: 'Analyze CSV data and generate insights',
  parameters: z.object({
    filePath: z.string().describe('Path to the CSV file'),
    groupBy: z.string().describe('Column to group data by'),
    metric: z.enum(['sum', 'avg', 'count']).default('count').describe('Metric to calculate')
  }),
  async execute({ filePath, groupBy, metric }) {
    const data = await readCSV(filePath);
    return performAnalysis(data, groupBy, metric);
  }
});

// API call tool
const apiCallTool = tool({
  name: 'api_call',
  description: 'Send data to an external API',
  parameters: z.object({
    endpoint: z.string().url().describe('API endpoint URL'),
    data: z.any().describe('Data to send')
  }),
  async execute({ endpoint, data }) {
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json());
  }
});

// Database query tool with custom error handling
const dbQueryTool = tool({
  name: 'db_query',
  description: 'Execute a database query',
  parameters: z.object({
    query: z.string().describe('SQL query to execute'),
    params: z.array(z.any()).optional().describe('Query parameters')
  }),
  async execute({ query, params = [] }) {
    return await database.query(query, params);
  },
  errorFunction: (context, error) => {
    return `Database error: ${error.message}. Please check your query syntax.`;
  }
});
```

### Tool Options Reference

| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | Defaults to the function name (e.g., `get_weather`) |
| `description` | Yes | Clear, human-readable description shown to the LLM |
| `parameters` | Yes | Zod schema object defining the tool parameters |
| `strict` | No | When `true` (default), returns error if arguments don't validate |
| `execute` | Yes | `(args, context) => string \| Promise<string>` – your business logic |
| `errorFunction` | No | Custom handler `(context, error) => string` for error transformation |

## 🔌 MCP Integration

AgenTree supports Model Context Protocol servers out of the box:

### Remote MCP Servers

```typescript
import { MCPServer } from 'agentree';

// Connect to remote MCP servers
const dbServer = new MCPServer("sqlite://./company.db");
const webServer = new MCPServer("web-scraper://config.json");

const agent = new Agent({
  name: "data-analyst",
  task: "Find patterns in our customer data and compare with industry benchmarks", 
  tools: [
    ...dbServer.tools,    // Database tools auto-discovered
    ...webServer.tools,   // Web scraping tools
    customAnalysis        // Your custom tools
  ]
});
```

### Local MCP Servers

```typescript
import { Agent, MCPServerStdio } from 'agentree';

// Spawn and connect to local MCP server
const server = new MCPServerStdio({
  fullCommand: 'npx -y @modelcontextprotocol/server-filesystem ./sample_files',
});
await server.connect();

const agent = new Agent({
  name: 'file-assistant',
  mcpServers: [server],
  task: 'Analyze the files in our project directory'
});
```

## 📁 Output Structure

AgenTree automatically creates organized reports in your specified output folder:

```
.agentree/
└── market-research-2025-06-19-14-30/
    ├── agent-report.md                    # Root agent report
    ├── competitive-analysis/
    │   ├── agent-report.md               # Child agent report
    │   ├── pricing-research/
    │   │   └── agent-report.md           # Grandchild agent report
    │   └── feature-comparison/
    │       └── agent-report.md
    └── trend-analysis/
        ├── agent-report.md
        └── market-sizing/
            └── agent-report.md
```

Each report contains:
- 📋 **Task description** and context used
- 🛠️ **Tools** available to the agent  
- 💭 **Thought process** and reasoning
- 📊 **Results** and findings
- 🔗 **Links** to child agent reports

## ⚙️ Installation

```bash
npm install agentree zod
```

### Environment Setup

```bash
# For Anthropic Claude
export ANTHROPIC_API_KEY="your-api-key"

# For OpenAI
export OPENAI_API_KEY="your-api-key"

# For custom endpoints
export LLM_BASE_URL="https://your-llm-endpoint.com"
```

## 📚 API Reference

### Agent

```typescript
class Agent {
  constructor(options: AgentOptions)
  execute(): Promise<AgentResult>
  on(event: string, callback: Function): void
}

interface AgentOptions {
  name: string;              // Agent identifier
  task: string;              // Task description  
  context?: string[];        // Context (files, URLs, text)
  tools?: Tool[];            // Available tools
  mcpServers?: MCPServer[];  // MCP servers
  config?: AgentTreeConfig;  // Configuration
}
```

### Configuration

```typescript
interface AgentTreeConfig {
  baseUrl?: string;          // LLM endpoint URL
  model?: string;            // Model name
  apiKey?: string;           // API key
  maxDepth?: number;         // Max tree depth (default: 5)
  outputFile?: boolean;      // Save reports (default: true)  
  outputFolder?: string;     // Output directory (default: .agentree)
}
```

### Tool Helper

```typescript
import { tool } from 'agentree';
import { z } from 'zod';

const myTool = tool({
  name?: string;                              // Tool name
  description: string;                        // Tool description
  parameters: z.ZodSchema;                    // Zod parameter schema
  strict?: boolean;                           // Strict validation (default: true)
  execute: (args, context?) => Promise<any>; // Tool execution
  errorFunction?: (context, error) => string; // Custom error handler
});
```

## 🗺️ Roadmap

- [ ] **Parallel execution** - Run sibling agents concurrently
- [ ] **Agent memory** - Persistent memory across task decompositions  
- [ ] **Visual debugger** - Web UI for monitoring agent trees
- [ ] **Plugin ecosystem** - Marketplace for pre-built agent tools
- [ ] **Multi-modal support** - Image and video processing capabilities
- [ ] **Agent collaboration** - Cross-branch communication in agent trees

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by hierarchical task decomposition research
- Built with modern TypeScript and AI best practices
- Thanks to the open source community for invaluable feedback

---

**Ready to build intelligent agent trees?** Start with our [Quick Start Guide](#-quick-start) or explore the [examples](./examples) directory!

[![Star this repo](https://img.shields.io/github/stars/yourusername/agentree?style=social)](https://github.com/yourusername/agentree)