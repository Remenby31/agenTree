# Output Management

## Overview

AgenTree automatically generates comprehensive documentation of agent execution, including conversation logs, execution reports, and structured data. This provides full transparency and debugging capabilities.

## Output Structure

### Default Output

When `outputFile: true` (default), each agent execution creates:

```
.agentree/
└── agent-name-2025-07-02-14-30/
    ├── agent-report.md          # Human-readable execution report
    ├── conversation.md          # Complete LLM conversation log
    ├── execution-log.json       # Machine-readable event stream
    └── metadata.json           # Agent metadata and configuration
```

### Hierarchical Output

Child agents create nested folder structures:

```
.agentree/
└── research-coordinator-2025-07-02-14-30/
    ├── agent-report.md
    ├── conversation.md
    ├── execution-log.json
    ├── metadata.json
    ├── market-researcher/              # Child agent
    │   ├── agent-report.md
    │   ├── conversation.md
    │   ├── execution-log.json
    │   ├── metadata.json
    │   ├── competitor-analyzer/        # Grandchild agent
    │   │   ├── agent-report.md
    │   │   └── conversation.md
    │   └── pricing-researcher/
    │       ├── agent-report.md
    │       └── conversation.md
    └── strategy-planner/
        ├── agent-report.md
        ├── conversation.md
        └── report-generator/
            ├── agent-report.md
            └── conversation.md
```

## Configuration

### Basic Configuration

```typescript
const agent = new Agent({
  name: "data-analyzer",
  task: "Analyze sales data",
  config: {
    outputFile: true,                    // Enable output generation
    outputFolder: '.agentree',           // Output directory
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY
  }
});
```

### Custom Output Location

```typescript
const agent = new Agent({
  name: "report-generator",
  task: "Generate quarterly report",
  config: {
    outputFile: true,
    outputFolder: './reports/q3-2025',   // Custom folder
    // ...
  }
});
```

### Disable Output

```typescript
const agent = new Agent({
  name: "quick-task",
  task: "Simple calculation",
  config: {
    outputFile: false,                   // No file output
    // ...
  }
});
```

## Output Files

### Agent Report (agent-report.md)

Human-readable execution summary:

```markdown
# Agent Report: data-analyzer

**Agent ID:** `a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6`
**Depth:** 0
**Started:** 2025-07-02T14:30:15.123Z

## Status

✅ **Completed Successfully** - Execution time: 2,847ms

## Task

Analyze sales data from Q3 and identify trends, outliers, and recommendations

## Execution Summary

- **Messages Exchanged:** 12
- **LLM Calls:** 4
- **Tools Used:** readFile, calculateStats, generateChart
- **Child Agents Created:** 2
- **Current Status:** completed

## Progress Timeline

✅ Agent created and initialized
✅ Context loaded and ready
✅ Data analysis completed
✅ Child agents created for specialized tasks
✅ Final report generated

## Final Result

**Success:** ✅ Yes
**Completed:** 2025-07-02T14:32:02.970Z
**Execution Time:** 2,847ms

### Result Content

Analysis of Q3 sales data reveals three key trends:

1. **Growth Acceleration**: 23% increase compared to Q2
2. **Regional Performance**: West Coast leading with 34% of total revenue
3. **Product Mix**: Premium tier showing strongest growth (+45%)

### Child Agents

1. **trend-analyzer** - ✅ Completed
2. **outlier-detector** - ✅ Completed

## Tools Used

- readFile: Read sales data CSV
- calculateStats: Statistical analysis
- generateChart: Visualization creation
```

### Conversation Log (conversation.md)

Complete LLM interaction record:

```markdown
# Conversation Log - data-analyzer

## 2025-07-02T14:30:15.123Z
**system:**

You are an AI agent named "data-analyzer".

Your task: Analyze sales data from Q3 and identify trends, outliers, and recommendations

## Files:
### ./data/q3-sales.csv
```
Date,Product,Revenue,Region
2025-07-01,Premium,15000,West
...
```

## 2025-07-02T14:30:16.234Z
**user:**

Please complete the following task: Analyze sales data from Q3 and identify trends, outliers, and recommendations

## 2025-07-02T14:30:18.345Z
**assistant:**

I'll analyze the Q3 sales data systematically. Let me start by reading the data file to understand its structure.

**Tool Calls:**
- readFile({"path": "./data/q3-sales.csv"})

## 2025-07-02T14:30:18.456Z
**tool:**

Date,Product,Revenue,Region
2025-07-01,Premium,15000,West
2025-07-01,Standard,8000,East
...
[Complete CSV data]

## 2025-07-02T14:30:19.567Z
**assistant:**

Perfect! I can see the sales data contains Date, Product, Revenue, and Region columns. Let me create specialized child agents to analyze different aspects of this data.

**Tool Calls:**
- createAgent({"name": "trend-analyzer", "task": "Analyze revenue trends over Q3 period"})
```

### Execution Log (execution-log.json)

Machine-readable event stream (newline-delimited JSON):

```json
{"timestamp":"2025-07-02T14:30:15.123Z","event":"agentCreated","agentId":"a1b2c3d4","agentName":"data-analyzer","depth":0,"data":{"id":"a1b2c3d4","name":"data-analyzer","task":"Analyze sales data from Q3","depth":0}}
{"timestamp":"2025-07-02T14:30:15.124Z","event":"agentStarted","agentId":"a1b2c3d4","agentName":"data-analyzer","depth":0,"data":{"id":"a1b2c3d4","name":"data-analyzer"}}
{"timestamp":"2025-07-02T14:30:15.567Z","event":"contextLoaded","agentId":"a1b2c3d4","agentName":"data-analyzer","depth":0,"data":{"context":{"fileCount":1,"urlCount":0,"textCount":0}}}
{"timestamp":"2025-07-02T14:30:16.789Z","event":"llmCall","agentId":"a1b2c3d4","agentName":"data-analyzer","depth":0,"data":{"messageCount":2,"availableTools":["readFile","writeFile","createAgent","stopAgent"]}}
{"timestamp":"2025-07-02T14:30:18.345Z","event":"toolCallStarted","agentId":"a1b2c3d4","agentName":"data-analyzer","depth":0,"data":{"toolName":"readFile","toolInput":{"path":"./data/q3-sales.csv"},"toolCallId":"tool_1"}}
{"timestamp":"2025-07-02T14:30:18.456Z","event":"toolCallCompleted","agentId":"a1b2c3d4","agentName":"data-analyzer","depth":0,"data":{"toolName":"readFile","toolOutput":"[CSV content]","duration":111,"toolCallId":"tool_1"}}
```

### Metadata (metadata.json)

Agent configuration and status:

```json
{
  "id": "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
  "name": "data-analyzer",
  "task": "Analyze sales data from Q3 and identify trends, outliers, and recommendations",
  "depth": 0,
  "startTime": "2025-07-02T14:30:15.123Z",
  "endTime": "2025-07-02T14:32:02.970Z",
  "status": "completed"
}
```

## Real-time Updates

### Streaming Output

Output files are updated in real-time during execution:

```typescript
const agent = new Agent({
  name: "long-running-task",
  task: "Process large dataset",
  config: {
    outputFile: true,
    streaming: true  // Enable streaming for real-time updates
  }
});

// Files update as agent executes
await agent.execute();
```

### Monitoring File Updates

Watch output files for real-time progress:

```bash
# Watch main report
tail -f .agentree/data-analyzer-*/agent-report.md

# Watch conversation
tail -f .agentree/data-analyzer-*/conversation.md

# Watch events
tail -f .agentree/data-analyzer-*/execution-log.json
```

## Output Analysis Tools

### Built-in Viewer

Use the built-in viewer for analysis:

```bash
# List all runs
npm run view list

# Show specific run details  
npm run view show data-analyzer-2025-07-02

# Show execution tree
npm run view tree data-analyzer-2025-07-02

# Show conversation logs
npm run view logs data-analyzer-2025-07-02

# Export to different formats
npm run view export data-analyzer-2025-07-02 json
```

### Programmatic Access

Read output files programmatically:

```typescript
import { RunParser } from './scripts/lib/RunParser';

const parser = new RunParser();

// Parse specific run
const runData = await parser.parseRun('.agentree/data-analyzer-2025-07-02-14-30');

console.log('Agent:', runData.metadata.name);
console.log('Status:', runData.metadata.status);
console.log('Duration:', runData.metrics.totalEvents);
console.log('Children:', runData.children.length);

// Parse all runs
const runs = await parser.scanRuns('.agentree');
const summary = await parser.generateSummary(runs);

console.log('Total runs:', summary.totalRuns);
console.log('Success rate:', summary.successfulRuns / summary.totalRuns);
```

## Output Cleanup

### Automatic Cleanup

```bash
# Keep only last 10 runs
npm run cleanup old --keep 10 --yes

# Remove failed runs
npm run cleanup failed --yes

# Archive old runs
npm run cleanup archive --archive ./archive --keep 20
```

### Manual Cleanup

```typescript
import fs from 'fs-extra';
import path from 'path';

// Remove runs older than 30 days
const outputDir = '.agentree';
const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

const entries = await fs.readdir(outputDir);
for (const entry of entries) {
  const entryPath = path.join(outputDir, entry);
  const stats = await fs.stat(entryPath);
  
  if (stats.isDirectory() && stats.birthtime.getTime() < thirtyDaysAgo) {
    await fs.remove(entryPath);
    console.log(`Removed old run: ${entry}`);
  }
}
```

## Custom Output Processing

### Post-execution Processing

```typescript
agent.on('agentCompleted', async (data) => {
  if (data.depth === 0) { // Root agent completed
    const outputPath = `.agentree/${data.name}-*`;
    
    // Custom processing
    await generateSummaryReport(outputPath);
    await uploadToStorage(outputPath);
    await notifyStakeholders(data.result);
  }
});
```

### Output Transformation

```typescript
// Convert reports to different formats
import { RunParser } from './scripts/lib/RunParser';
import { RunFormatter } from './scripts/lib/RunFormatter';

const parser = new RunParser();
const formatter = new RunFormatter();

const runData = await parser.parseRun(outputPath);

// Generate custom formats
const markdown = formatter.formatRunAsMarkdown(runData);
const html = await convertMarkdownToHTML(markdown);
const pdf = await generatePDFReport(runData);

await fs.writeFile('custom-report.html', html);
await fs.writeFile('custom-report.pdf', pdf);
```

## Best Practices

### 1. Organized Output

Use descriptive agent names for clear output organization:

```typescript
// Good - clear, organized output
const agent = new Agent({
  name: "q3-sales-analysis",    // Clear timestamp will be added
  // ...
});

// Poor - generic names
const agent = new Agent({
  name: "agent",               // Creates confusing output folders
  // ...
});
```

### 2. Output Location Management

Use appropriate output folders for different environments:

```typescript
const outputFolder = process.env.NODE_ENV === 'production' 
  ? './production-logs'
  : '.agentree';

const agent = new Agent({
  config: {
    outputFolder,
    // ...
  }
});
```

### 3. Storage Management

Implement output retention policies:

```typescript
// Development: Keep last 5 runs
// Staging: Keep last 20 runs  
// Production: Archive after 100 runs

const maxRuns = {
  development: 5,
  staging: 20,
  production: 100
}[process.env.NODE_ENV] || 10;
```

### 4. Security Considerations

Be careful with output in shared environments:

```typescript
const agent = new Agent({
  config: {
    outputFile: !process.env.DISABLE_OUTPUT, // Allow disabling in CI
    outputFolder: process.env.OUTPUT_DIR || '.agentree',
    // ...
  }
});
```