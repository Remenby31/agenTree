# Task Decomposition

## Understanding Decomposition

Task decomposition is the core intelligence of AgenTree. The LLM analyzes complex tasks and breaks them down into manageable subtasks, each handled by a specialized child agent.

## Decomposition Strategies

### Sequential Decomposition

Tasks that must be completed in order:

```typescript
const agent = new Agent({
  name: "data-pipeline",
  task: "Process raw data: extract, clean, analyze, and generate report",
  tools: [readFileTool, writeFileTool, csvTool],
  maxDepth: 3
});
```

**Typical decomposition:**
```
📊 Data Pipeline
├── 1️⃣ Data Extraction Agent
├── 2️⃣ Data Cleaning Agent (depends on 1)
├── 3️⃣ Data Analysis Agent (depends on 2)
└── 4️⃣ Report Generation Agent (depends on 3)
```

### Parallel Decomposition

Independent tasks that can run simultaneously:

```typescript
const agent = new Agent({
  name: "market-research",
  task: "Research competitors, analyze trends, and assess pricing across different markets",
  tools: [webSearchTool, analysisTools],
  maxDepth: 3
});
```

**Typical decomposition:**
```
📈 Market Research
├── 🏢 Competitor Analysis Agent (parallel)
├── 📊 Trend Analysis Agent (parallel)
├── 💰 Pricing Analysis Agent (parallel)
└── 🌍 Geographic Analysis Agent (parallel)
```

### Hierarchical Decomposition

Complex domains broken into specialties:

```typescript
const agent = new Agent({
  name: "software-audit",
  task: "Perform comprehensive security and performance audit of our application",
  tools: [codeAnalysisTools, testingTools],
  maxDepth: 4
});
```

**Typical decomposition:**
```
🔍 Software Audit
├── 🔒 Security Audit Agent
│   ├── 🚪 Authentication Analysis
│   ├── 🛡️ Authorization Analysis
│   └── 🔐 Encryption Analysis
├── ⚡ Performance Audit Agent
│   ├── 💾 Memory Analysis
│   ├── 🚀 Speed Analysis
│   └── 📊 Scalability Analysis
└── 📋 Code Quality Agent
    ├── 🎯 Best Practices Check
    └── 📝 Documentation Review
```

## Effective Task Design

### Clear Task Descriptions

**Good:**
```typescript
task: "Analyze our Q3 sales data to identify top-performing products, underperforming regions, and seasonal trends. Create visualizations and actionable recommendations."
```

**Poor:**
```typescript
task: "Look at sales stuff and make it better"
```

### Context-Rich Tasks

Provide relevant context for better decomposition:

```typescript
const agent = new Agent({
  name: "content-strategy",
  task: "Develop content strategy for our B2B SaaS product targeting enterprise clients",
  context: [
    "./company/product-specs.md",
    "./marketing/current-strategy.md",
    "./research/competitor-analysis.json",
    "Our main competitors are Salesforce, HubSpot, and Pipedrive",
    "Target audience: IT managers and CTOs at companies with 500+ employees"
  ],
  tools: [webSearchTool, contentTools],
  maxDepth: 3
});
```

### Domain-Specific Tasks

Include domain knowledge in task descriptions:

```typescript
const agent = new Agent({
  name: "financial-analyzer",
  task: "Perform DCF analysis on AAPL stock: gather financial statements, calculate WACC, project cash flows for 5 years, and determine fair value",
  tools: [financialDataTool, calculatorTool],
  maxDepth: 3
});
```

## Decomposition Patterns

### Research Pattern

```
🔍 Research Task
├── 📚 Information Gathering
├── 🧮 Data Analysis
├── 🔍 Fact Verification
└── 📊 Synthesis & Reporting
```

### Creation Pattern

```
🎨 Content Creation
├── 📋 Planning & Structure
├── ✍️ Content Writing
├── 🎨 Design & Formatting
└ ⚡ Review & Optimization
```

### Analysis Pattern

```
📊 Data Analysis
├── 🧹 Data Preparation
├── 📈 Descriptive Analysis
├── 🔮 Predictive Modeling
└── 📋 Insights & Recommendations
```

### Problem-Solving Pattern

```
🎯 Problem Solving
├── 🔍 Problem Definition
├── 💡 Solution Generation
├── ⚖️ Solution Evaluation
└── 🚀 Implementation Planning
```

## Controlling Decomposition

### Depth Limits

Control how deep decomposition can go:

```typescript
// Shallow decomposition - broad tasks
const agent = new Agent({
  maxDepth: 2, // Parent + 1 level of children
  // ...
});

// Deep decomposition - granular tasks
const agent = new Agent({
  maxDepth: 5, // Highly specialized agents
  // ...
});
```

### Tool Constraints

Influence decomposition by providing specific tools:

```typescript
// Will likely create file-processing focused children
const agent = new Agent({
  tools: [readFileTool, writeFileTool, csvTool],
  // ...
});

// Will likely create web-research focused children
const agent = new Agent({
  tools: [webSearchTool, scrapeContentTool],
  // ...
});
```

### Context Guidance

Guide decomposition with strategic context:

```typescript
const agent = new Agent({
  name: "market-analysis",
  task: "Analyze market opportunities for our product",
  context: [
    "Focus on quantitative data over qualitative insights",
    "Prioritize emerging markets over established ones",
    "Consider regulatory constraints in each region"
  ],
  // ...
});
```

## Common Decomposition Issues

### Over-Decomposition

**Problem:** Too many tiny agents
```
❌ Word Counter Agent → Character Counter Agent → Space Counter Agent
```

**Solution:** Set appropriate maxDepth and use clearer task descriptions

### Under-Decomposition

**Problem:** Agents trying to do everything themselves
```
❌ Single agent doing research + analysis + reporting + presentation
```

**Solution:** Use higher maxDepth and more specific task descriptions

### Poor Boundaries

**Problem:** Overlapping responsibilities
```
❌ Agent A: "Analyze data and create visualizations"
❌ Agent B: "Process data and generate charts"
```

**Solution:** Clear, non-overlapping task descriptions

## Monitoring Decomposition

### Track Decision Process

```typescript
agent.on('llmCall', (data) => {
  console.log(`🧠 Agent ${data.name} thinking with ${data.availableTools.length} tools`);
});

agent.on('childCreated', (data) => {
  console.log(`👶 Created: ${data.childName}`);
  console.log(`   Task: ${data.childTask}`);
  console.log(`   Parent: ${data.parentName}`);
});
```

### Analyze Decomposition Results

```typescript
agent.on('agentCompleted', (data) => {
  if (data.depth === 0) {
    console.log(`\n📊 Decomposition Summary:`);
    console.log(`   Total children: ${data.result.children?.length || 0}`);
    console.log(`   Max depth reached: ${getMaxDepth(data.result)}`);
  }
});
```

## Best Practices

### 1. Start Simple

Begin with lower maxDepth and increase as needed:

```typescript
// Start here
maxDepth: 2

// Scale up
maxDepth: 3-4

// Complex projects only
maxDepth: 5+
```

### 2. Provide Rich Context

Include all relevant information:
- Files and documents
- Domain-specific constraints
- Success criteria
- Resource limitations

### 3. Design for Decomposition

Write tasks that naturally break down:

**Good:** "Research competitors, analyze pricing, and create comparison report"
**Better:** "Research top 5 competitors in our space, analyze their pricing models, identify gaps in their offerings, and create detailed comparison report with recommendations"

### 4. Monitor and Iterate

- Watch decomposition patterns
- Adjust task descriptions based on results
- Fine-tune maxDepth based on complexity