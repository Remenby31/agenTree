# 🎨 Agent Run Visualizer Scripts

Professional visualization and management tools for your AgenTree execution logs.

## 🚀 Quick Start

```bash
# List all agent runs
npm run view list

# Show detailed view of a specific run
npm run view show strategic-planner-2025-06-22

# View overall statistics
npm run view summary

# Show agent hierarchy tree
npm run view tree

# Clean old runs (keep last 10)
npm run cleanup old --keep 10 --yes
```

## 📊 Main Viewer Commands

### `npm run view list`
Lists all agent runs with status, duration, and size information.

```
📋 Agent Runs (15 total)

ID                        Agent                Status       Duration   Size     Started            
──────────────────────────────────────────────────────────────────────────────────────────────────
strategic-planner-2025... strategic-planner    ✅ completed    2.3s    156 KB   2025-06-22 14:30:15
market-analyst-2025-06... market-analyst       ❌ error        1.1s     89 KB   2025-06-22 13:45:22
  └─ Has child agents
data-processor-2025-06... data-processor       🔄 running      --       45 KB   2025-06-22 13:20:10
```

### `npm run view show <run-id>`
Shows comprehensive details for a specific run.

```
🤖 Agent Run Details
strategic-planner (strategic-planner-2025-06-22-14-30)

📊 Basic Information
  ID: strategic-planner-2025-06-22-14-30
  Task: Develop a comprehensive expansion strategy for 2025
  Status: ✅ completed
  Depth: 0
  
⏱️  Execution Timeline
  Started: 6/22/2025, 2:30:15 PM
  Ended: 6/22/2025, 2:32:45 PM
  Duration: 2.3s

📈 Execution Metrics
  Messages: 12
  LLM Calls: 4
  Tool Calls: 3
  Children Created: 2
  Est. Tokens: ~3,450

🔧 Tools Used
  • createAgent
  • webSearch
  • generateReport

👥 Child Agents (2)
  1. market-researcher
     Status: ✅ completed
     Duration: 1.2s
     Messages: 8
```

### `npm run view summary`
Shows overall statistics across all runs.

```
📈 Agent Run Statistics

📊 Overview
  Total Runs: 15
  Successful: 12 (80%)
  Failed: 3 (20%)
  Unique Agents: 8
  Has Hierarchy: ✅ Yes

⚡ Performance
  Average Duration: 1.8s
  Total Duration: 27.2s
  Total Storage: 892 KB

📅 Recent Activity
  Last 24h: 5 runs
  Last 7d: 15 runs
  Success Rate (7d): 80%
```

### `npm run view tree [run-id]`
Shows hierarchical agent structure.

```
🌳 Agent Hierarchy

└── strategic-planner ✅
    Develop a comprehensive expansion strategy for 2025
    Duration: 2.3s, Messages: 12
    ├── market-researcher ✅
    │   Research current market conditions and trends
    │   Duration: 1.2s, Messages: 8
    └── competitive-analyst ✅
        Analyze competitor strategies and positioning
        Duration: 0.9s, Messages: 6
```

### `npm run view logs [run-id]`
Shows conversation messages.

```
💬 Conversation Log
strategic-planner - Showing 20 of 24 messages

[2:30:15 PM] system: You are an AI agent named "strategic-planner"...
[2:30:16 PM] user: Please complete the following task: Develop expansion strategy...
[2:30:32 PM] assistant: I'll analyze the market and create a comprehensive strategy...
[2:30:33 PM] tool_call: createAgent({"name": "market-researcher"})
```

### `npm run view watch`
Watches the latest run for real-time updates.

```
👀 Watching latest run for changes...
📁 Watching: strategic-planner-2025-06-22-14-30

🔄 2:30:45 PM - Conversation updated (15,234 bytes)
🔄 2:30:52 PM - Conversation updated (18,456 bytes)
```

### `npm run view export <run-id> [format]`
Exports run data in different formats.

```bash
# Export as JSON
npm run view export strategic-planner-2025 json

# Export as Markdown
npm run view export strategic-planner-2025 md
```

## 🧹 Cleanup Commands

### `npm run cleanup stats`
Shows cleanup recommendations.

```
📊 Cleanup Statistics for .agentree

📈 Status Breakdown:
  ✅ Completed: 12
  ❌ Failed: 3
  🔄 Running: 0

💾 Storage Analysis:
  Total Size: 892 KB
  Average Size: 59 KB
  Largest Run: 156 KB (strategic-planner)

💡 Cleanup Recommendations:
  🧹 Clean 3 failed runs → Save 234 KB
     Command: npm run cleanup failed --yes
  📦 Archive 8 old runs → Save 445 KB
     Command: npm run cleanup archive --archive ./archive
```

### `npm run cleanup old`
Cleans old runs (keeps newest N).

```bash
# Keep only 5 newest runs (dry run)
npm run cleanup old --keep 5 --dry-run

# Actually delete (with confirmation)
npm run cleanup old --keep 5 --yes

# Delete runs older than 30 days
npm run cleanup old --older-than 30 --yes
```

### `npm run cleanup failed`
Removes all failed runs.

```bash
# Preview failed runs cleanup
npm run cleanup failed --dry-run

# Actually clean failed runs
npm run cleanup failed --yes
```

### `npm run cleanup archive`
Archives old runs to a separate folder.

```bash
# Archive runs to ./archive folder
npm run cleanup archive --archive ./archive --keep 10
```

## 🎯 Advanced Usage

### Fuzzy Search
Run IDs support fuzzy matching:

```bash
# These all work for "strategic-planner-2025-06-22-14-30"
npm run view show strategic-planner
npm run view show strategic
npm run view show 2025-06-22
```

### Custom Output Folder
Use a different output folder:

```bash
npm run view list --folder ./my-custom-output
npm run cleanup stats --folder ./my-custom-output
```

### Batch Operations
Chain commands for batch operations:

```bash
# Clean failed runs, then show stats
npm run cleanup failed --yes && npm run view summary

# Export all recent runs
npm run view list | grep "completed" | head -5
```

## 📁 Script Structure

```
scripts/
├── viewer.ts              # Main viewer script
├── cleanup.ts             # Cleanup utilities  
├── lib/
│   ├── RunParser.ts       # Parses output files
│   ├── RunFormatter.ts    # Formats display output
│   └── types.ts          # TypeScript definitions
└── README.md             # This file
```

## 🎨 Output Examples

### Run List View
```
📋 Agent Runs (8 total)

ID                        Agent              Status        Duration  Size    Started            
─────────────────────────────────────────────────────────────────────────────────────────────
strategic-plan-2025-06-22 strategic-planner  ✅ completed     2.3s   156KB   6/22/2025 2:30:15 PM
  └─ Has child agents
market-research-2025-06-22 market-researcher  ✅ completed     1.8s    89KB   6/22/2025 1:45:20 PM
data-analysis-2025-06-22   data-analyst      ❌ error         0.5s    23KB   6/22/2025 1:20:10 PM
content-gen-2025-06-22     content-generator  🔄 running        --     12KB   6/22/2025 12:55:05 PM
```

### Detailed Run View
```
🤖 Agent Run Details
strategic-planner (strategic-plan-2025-06-22-14-30)

📊 Basic Information
  ID: strategic-plan-2025-06-22-14-30
  Task: Develop comprehensive expansion strategy for European markets
  Status: ✅ completed
  Depth: 0

⏱️  Execution Timeline  
  Started: 6/22/2025, 2:30:15 PM
  Ended: 6/22/2025, 2:32:45 PM
  Duration: 2.5s

📈 Execution Metrics
  Messages: 18
  LLM Calls: 6
  Tool Calls: 4
  Children Created: 3
  Errors: 0
  Avg Message Length: 342 chars
  Est. Tokens: ~1,547

🔧 Tools Used
  • createAgent
  • webSearch  
  • analyzeData
  • generateReport

💬 Conversation Summary
  system: 2 messages
  user: 2 messages  
  assistant: 8 messages
  tool: 4 messages
  tool_call: 2 messages
  Total Characters: 6,156

👥 Child Agents (3)
  1. market-researcher
     Status: ✅ completed
     Duration: 1.2s
     Messages: 12
  2. competitive-analyst  
     Status: ✅ completed
     Duration: 0.9s
     Messages: 8
  3. report-generator
     Status: ✅ completed  
     Duration: 0.7s
     Messages: 6

📁 Files
  📊 Report: .agentree/strategic-plan-2025-06-22-14-30/agent-report.md
  💬 Conversation: .agentree/strategic-plan-2025-06-22-14-30/conversation.md
  📋 Events: .agentree/strategic-plan-2025-06-22-14-30/execution-log.json
```

## 🔧 Customization

### Environment Variables
```bash
# Default output folder
export AGENTREE_OUTPUT_FOLDER=./my-runs

# Default cleanup settings
export AGENTREE_KEEP_RUNS=20
export AGENTREE_ARCHIVE_FOLDER=./archive
```

### Custom Aliases
Add to your `.bashrc` or `.zshrc`:

```bash
# Quick aliases
alias alist='npm run view list'
alias ashow='npm run view show'  
alias astats='npm run view summary'
alias aclean='npm run cleanup old --keep 10 --yes'
alias awatch='npm run view watch'
```

## 🐛 Troubleshooting

### No runs found
```bash
# Check if output folder exists
ls -la .agentree

# Use custom folder
npm run view list --folder ./your-output-folder

# Run an agent first to generate data
npm run example
```

### Permission errors  
```bash
# Check folder permissions
ls -la .agentree

# Fix permissions
chmod -R 755 .agentree
```

### Large output folders
```bash
# Check folder size
npm run cleanup stats

# Clean incrementally
npm run cleanup failed --yes
npm run cleanup old --keep 20 --yes
```

---

🎉 **Your agent runs are now beautifully visualized and manageable!**

Use `npm run view` and `npm run cleanup` to explore all available commands.