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
- **🔧 Easy Tool Creation** - Transform any TypeScript function into an agent tool with a simple decorator
- **🔌 MCP Integration** - Native support for Model Context Protocol servers
- **📊 Real-time Monitoring** - Track agent creation and task progress with event callbacks

## 🚀 Quick Start

```typescript
import { Agent, tool } from 'agentree';

/**
 * Search the web for information
 * @param query The search query
 * @param maxResults Maximum number of results to return
 */
@tool()
async function webSearch(query: string, maxResults: number = 5) {
  // Your implementation
}

/**
 * Read content from a file
 * @param filePath Path to the file to read
 */
@tool()
async function readFile(filePath: string): Promise<string> {
  return fs.readFileSync(filePath, 'utf8');
}

// Create and execute an agent
const agent = new Agent({
  name: "market-researcher",
  task: "Research our competitors and create a detailed analysis report",
  context: [
    "./company-info.md",
    "https://industry-report.com/2025-trends"
  ],
  tools: [webSearch, readFile],
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
const agent = new Agent({
  name: "content-creator",
  task: "Write a blog post about sustainable technology",
  tools: [webSearch, readFile]
});

await agent.execute();
```

### With Custom Context

```typescript
const agent = new Agent({
  name: "sales-analyzer", 
  task: "Analyze Q1 sales performance and identify improvement opportunities",
  context: [
    "./data/sales-q1.csv",           // File context
    "./docs/sales-methodology.md",   // Documentation context  
    "Our target market is SMB SaaS companies" // Text context
  ],
  tools: [readCSV, calculateMetrics, generateChart]
});
```

### Advanced Configuration

```typescript
const agent = new Agent({
  name: "strategic-planner",
  task: "Develop a 2025 product roadmap",
  tools: [webSearch, readFile, dataAnalysis],
  config: {
    baseUrl: "https://api.anthropic.com",
    model: "claude-3-opus", 
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
  tools: [webSearch]
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

## 🔧 Creating Custom Tools

Transform any TypeScript function into an agent tool using the `@tool()` decorator:

```typescript
/**
 * Analyze CSV data and generate insights
 * @param filePath Path to the CSV file
 * @param groupBy Column to group data by
 * @param metric Metric to calculate (sum, avg, count)
 */
@tool()
async function analyzeCSV(
  filePath: string, 
  groupBy: string, 
  metric: 'sum' | 'avg' | 'count' = 'count'
): Promise<AnalysisResult> {
  // Your implementation
  const data = await readCSV(filePath);
  return performAnalysis(data, groupBy, metric);
}

/**
 * Send data to an external API
 * @param endpoint API endpoint URL
 * @param data Data to send
 */
@tool()
async function apiCall(endpoint: string, data: any): Promise<any> {
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());
}
```

The `@tool()` decorator automatically:
- ✅ Extracts function descriptions from JSDoc comments
- ✅ Infers parameter types from TypeScript
- ✅ Generates tool calling schemas
- ✅ Handles validation and error handling

## 🔌 MCP Integration

AgenTree supports Model Context Protocol servers out of the box:

```typescript
import { MCPServer } from 'agentree';

// Connect to an MCP server
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
npm install agentree
```

### TypeScript Configuration

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
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
  tools?: Function[];        // Available tools
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

### Tool Decorator

```typescript
@tool(options?: ToolOptions)
function yourFunction(params): Promise<any>

interface ToolOptions {
  name?: string;           // Custom tool name
  description?: string;    // Override JSDoc description
}
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