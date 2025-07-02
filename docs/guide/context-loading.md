# Context Loading

## Overview

Context provides agents with relevant information (files, URLs, text) to inform their decision-making and task execution. AgenTree automatically loads and formats context for agents.

## Context Types

### File Context

Load local files as context:

```typescript
const agent = new Agent({
  name: "code-reviewer",
  task: "Review the code and suggest improvements",
  context: [
    "./src/main.ts",
    "./package.json",
    "./README.md",
    "./tests/unit.test.ts"
  ],
  tools: [codeAnalysisTools]
});
```

**Supported file types:**
- Text files (.txt, .md, .json, .yaml, .xml)
- Code files (.ts, .js, .py, .java, .cpp, etc.)
- Configuration files (.env, .config, .ini)
- Any UTF-8 encoded text file

### URL Context

Load content from web URLs:

```typescript
const agent = new Agent({
  name: "trend-analyzer",
  task: "Analyze current trends in AI development",
  context: [
    "https://api.github.com/repos/microsoft/TypeScript/releases/latest",
    "https://news.ycombinator.com/rss",
    "https://arxiv.org/list/cs.AI/recent"
  ],
  tools: [analysisTools]
});
```

**URL requirements:**
- Must be publicly accessible
- Should return text content
- Supports HTTP/HTTPS protocols

### Text Context

Provide direct text information:

```typescript
const agent = new Agent({
  name: "strategy-planner",
  task: "Develop marketing strategy for our new product",
  context: [
    "./product-specs.json",
    "Our target audience is developers aged 25-35 working at tech startups",
    "Budget constraint: $50,000 for initial campaign",
    "Launch date: Q1 2025",
    "Primary competitors: Vercel, Netlify, Railway"
  ],
  tools: [marketingTools]
});
```

## Mixed Context

Combine all context types for comprehensive information:

```typescript
const agent = new Agent({
  name: "business-analyst",
  task: "Analyze our business performance and create strategic recommendations",
  context: [
    // Files
    "./data/q3-financials.csv",
    "./reports/market-analysis.pdf",
    "./strategy/current-goals.md",
    
    // URLs
    "https://api.example.com/market-data",
    "https://competitor-site.com/pricing",
    
    // Text
    "Current headcount: 150 employees",
    "Target growth rate: 25% YoY",
    "Primary concern: customer acquisition cost is increasing",
    "Key success metrics: MRR, CAC, LTV, churn rate"
  ],
  tools: [financialTools, analysisTools]
});
```

## Context Processing

### Automatic Loading

Context is loaded during agent initialization:

```typescript
const agent = new Agent({
  context: ["./large-dataset.csv"],
  // ...
});

// Context loads when execute() is called
const result = await agent.execute();
```

### Loading Process

1. **File Detection**: Identifies file paths vs URLs vs text
2. **Content Retrieval**: Reads files, fetches URLs
3. **Format Integration**: Structures content for LLM consumption
4. **Error Handling**: Skips failed loads with warnings

### Context in System Prompt

Context is automatically formatted into the agent's system prompt:

```
You are an AI agent named "business-analyst".

Your task: Analyze our business performance and create strategic recommendations

## Files:
### ./data/q3-financials.csv
```
Revenue,Month,Department
50000,July,Sales
45000,August,Sales
...
```

### ./reports/market-analysis.pdf
Market Analysis Q3 2024
Executive Summary: The market shows...

## URLs:
### https://api.example.com/market-data
{
  "market_size": "$2.3B",
  "growth_rate": "15%"
}

## Context:
Current headcount: 150 employees
Target growth rate: 25% YoY
Primary concern: customer acquisition cost is increasing
```

## Context Best Practices

### 1. Relevant Content Only

Include only context directly relevant to the task:

```typescript
// Good - focused context
const agent = new Agent({
  task: "Analyze user engagement metrics",
  context: [
    "./analytics/user-engagement.csv",
    "./config/metrics-definitions.json",
    "Focus on monthly active users and session duration"
  ]
});

// Poor - too much irrelevant context
const agent = new Agent({
  task: "Analyze user engagement metrics", 
  context: [
    "./analytics/user-engagement.csv",
    "./hr/employee-handbook.pdf",      // Irrelevant
    "./legal/terms-of-service.txt",    // Irrelevant
    "./marketing/brand-guidelines.pdf" // Irrelevant
  ]
});
```

### 2. Structure Information

Organize context logically:

```typescript
const agent = new Agent({
  task: "Plan database migration",
  context: [
    // Current state
    "./database/current-schema.sql",
    "./database/current-data-volume.json",
    
    // Target state
    "./database/target-schema.sql",
    "./database/migration-requirements.md",
    
    // Constraints
    "Migration window: 4-hour maintenance window",
    "Zero data loss requirement",
    "Rollback plan must be ready"
  ]
});
```

### 3. Clear Text Context

Make text context specific and actionable:

```typescript
// Good - specific constraints
context: [
  "Budget: exactly $10,000",
  "Timeline: must complete by March 15, 2025",
  "Team size: 3 developers, 1 designer",
  "Technology stack: React, Node.js, PostgreSQL"
]

// Poor - vague information
context: [
  "We have some budget",
  "Need this soon",
  "Small team",
  "Use modern tech"
]
```

### 4. File Size Considerations

Be mindful of context size:

```typescript
// Good - manageable file sizes
context: [
  "./config/app-settings.json",        // ~2KB
  "./docs/api-reference.md",           // ~50KB
  "./data/sample-data.csv"             // ~100KB
]

// Be careful with large files
context: [
  "./logs/application.log",            // Could be 100MB+
  "./data/full-dataset.csv"           // Could be 1GB+
]
```

## Context Inheritance

### Parent to Child

Context is passed from parent to child agents:

```typescript
const parentAgent = new Agent({
  name: "research-coordinator",
  task: "Research market opportunities",
  context: [
    "./market-data/",
    "Focus on emerging markets",
    "Timeline: Q1 2025 launch"
  ]
});

// When parent creates child:
// The child automatically receives relevant context
```

### Selective Context Passing

Parents can provide specific context to children:

```typescript
// Parent's createAgent call (happens via LLM)
{
  "name": "createAgent",
  "arguments": {
    "name": "pricing-researcher", 
    "task": "Research competitor pricing models",
    "context": [
      "./market-data/competitor-analysis.json", // Specific file
      "Focus on SaaS pricing models",           // Specific guidance
      "Budget range: $10-100/month per user"    // Specific constraint
    ]
  }
}
```

## Context Monitoring

### Loading Events

Monitor context loading:

```typescript
agent.on('contextLoaded', (data) => {
  console.log(`📁 Context loaded:`);
  console.log(`   Files: ${data.context.fileCount}`);
  console.log(`   URLs: ${data.context.urlCount}`);
  console.log(`   Text items: ${data.context.textCount}`);
});
```

### Loading Errors

Handle context loading failures:

```typescript
agent.on('agentError', (data) => {
  if (data.error.includes('Failed to load context')) {
    console.error(`Context loading failed: ${data.error}`);
    // Agent continues with partial context
  }
});
```

## Advanced Context Patterns

### Dynamic Context

Use tools to dynamically load context:

```typescript
const dynamicContextTool = tool({
  name: 'load_recent_data',
  description: 'Load recent data files based on date range',
  parameters: z.object({
    startDate: z.string(),
    endDate: z.string()
  }),
  async execute({ startDate, endDate }) {
    const files = await getFilesByDateRange(startDate, endDate);
    const content = await Promise.all(
      files.map(file => fs.readFile(file, 'utf8'))
    );
    return content.join('\n---\n');
  }
});

const agent = new Agent({
  task: "Analyze recent performance trends",
  tools: [dynamicContextTool],
  // Agent can load additional context as needed
});
```

### Conditional Context

Provide context based on conditions:

```typescript
const isProduction = process.env.NODE_ENV === 'production';

const agent = new Agent({
  name: "deployment-planner",
  task: "Plan application deployment",
  context: [
    "./deployment/base-config.yaml",
    ...(isProduction 
      ? ["./deployment/prod-config.yaml", "./secrets/prod-secrets.env"]
      : ["./deployment/dev-config.yaml", "Use test database"]
    )
  ]
});
```

### Templated Context

Use templates for consistent context:

```typescript
const createAnalysisAgent = (domain: string, dataPath: string) => {
  return new Agent({
    name: `${domain}-analyzer`,
    task: `Analyze ${domain} data and provide insights`,
    context: [
      dataPath,
      `./templates/${domain}-analysis-template.md`,
      `Domain: ${domain}`,
      `Data source: ${dataPath}`,
      "Follow the analysis template for consistent reporting"
    ],
    tools: [analysisTools]
  });
};

const salesAgent = createAnalysisAgent('sales', './data/sales-q3.csv');
const marketingAgent = createAnalysisAgent('marketing', './data/campaigns.json');
```

## Security Considerations

### File Access

Be cautious with file paths in context:

```typescript
// Safe - relative paths within project
context: [
  "./data/public-data.csv",
  "./config/app-settings.json"
]

// Dangerous - absolute paths or sensitive files
context: [
  "/etc/passwd",              // System files
  "../../secret-keys.env",    // Path traversal
  "/home/user/.ssh/id_rsa"    // Private keys
]
```

### URL Safety

Validate URLs before including:

```typescript
// Safe - known domains
context: [
  "https://api.github.com/repos/owner/repo",
  "https://jsonplaceholder.typicode.com/posts"
]

// Be careful with user-provided URLs
// Consider URL validation and domain allowlisting
```

## Next Steps

- [Output Management](/guide/output-management) - How context influences output generation
- [Examples - File Processing](/examples/file-processing) - See context loading in action
- [API Reference - Task](/api/types-reference#task) - Technical details on context handling