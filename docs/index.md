---
layout: home

hero:
  name: "🌳 AgenTree"
  text: "Hierarchical AI Agents"
  tagline: TypeScript library for creating AI agents that recursively decompose tasks by spawning specialized children
  actions:
    - theme: brand
      text: Get Started
      link: /guide/installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/Remenby31/agentree

features:
  - title: 🧠 Intelligent Task Decomposition
    details: Agents automatically analyze complex tasks and break them down into manageable subtasks, creating specialized child agents with specific roles and tools.
  - title: 🎯 Dynamic Agent Creation  
    details: Parent agents dynamically define the role, context, and available tools for their children based on the specific requirements of each subtask.
  - title: 📁 Automatic Documentation
    details: Complete execution traces are automatically saved as structured markdown reports, providing full transparency into the decision-making process.
  - title: 🔧 Flexible Tool System
    details: Transform any TypeScript function into an agent tool using Zod schema validation. Built-in tools included for common operations.
---

## Quick Start

```bash
npm install agentree zod
```

```typescript
import { Agent, tool } from 'agentree';
import { z } from 'zod';

const webSearchTool = tool({
  name: 'web_search',
  description: 'Search the web for information',
  parameters: z.object({
    query: z.string(),
    maxResults: z.number().default(5)
  }),
  async execute({ query, maxResults }) {
    return `Search results for: ${query}`;
  }
});

const agent = new Agent({
  name: "researcher",
  task: "Research latest developments in quantum computing",
  tools: [webSearchTool],
  config: {
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY
  }
});

const result = await agent.execute();
```

## How It Works

AgenTree creates intelligent task decomposition trees where each agent can spawn specialized children:

```
📋 Complex Task
└── 📊 Data Analysis Agent
    ├── 🔍 Data Collection Agent
    │   ├── 📁 File Reader Agent
    │   └── 🌐 Web Scraper Agent
    ├── 📈 Statistical Analysis Agent
    └── 📊 Visualization Agent
└── 📝 Report Generation Agent
```

Each agent in the hierarchy has:
- **Specific role** and task scope
- **Custom tool set** relevant to their function  
- **Context** (files, URLs, data) passed from parent
- **Ability to create children** for further decomposition

## Architecture Overview

- **Agent**: Core execution unit with LLM integration
- **Tools**: Type-safe functions with Zod validation
- **Context**: File, URL, and text data loading system
- **Output**: Real-time markdown and JSON report generation
- **Events**: Complete monitoring and debugging system

## Next Steps

- [Installation & Setup](/guide/installation) - Get up and running
- [Basic Usage](/guide/basic-usage) - Your first agent
- [Examples](/examples/) - Working code samples
- [API Reference](/api/agent-class) - Complete technical reference