#!/usr/bin/env ts-node

import * as fs from 'fs-extra';
import * as path from 'path';
import { RunParser } from './lib/RunParser';
import { RunFormatter } from './lib/RunFormatter';
import { RunData, RunSummary } from './lib/types';

class AgentRunViewer {
  private outputFolder: string;
  private parser: RunParser;
  private formatter: RunFormatter;

  constructor(outputFolder: string = '.agentree') {
    this.outputFolder = outputFolder;
    this.parser = new RunParser();
    this.formatter = new RunFormatter();
  }

  /**
   * Main command dispatcher
   */
  async run(command?: string, ...args: string[]): Promise<void> {
    try {
      switch (command) {
        case 'list':
        case 'ls':
          await this.listRuns();
          break;
        
        case 'show':
        case 'view':
          await this.showRun(args[0]);
          break;
          
        case 'summary':
        case 'stats':
          await this.showSummary();
          break;
          
        case 'tree':
          await this.showTree(args[0]);
          break;
          
        case 'logs':
          await this.showLogs(args[0]);
          break;
          
        case 'clean':
          await this.cleanOldRuns(parseInt(args[0]) || 10);
          break;
          
        case 'export':
          await this.exportRun(args[0], args[1]);
          break;
          
        case 'watch':
          await this.watchLatest();
          break;
          
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * List all available runs
   */
  async listRuns(): Promise<void> {
    console.log('🔍 Scanning agent runs...\n');
    
    if (!await fs.pathExists(this.outputFolder)) {
      console.log(`❌ Output folder not found: ${this.outputFolder}`);
      console.log('💡 Run an agent first to generate output files');
      return;
    }

    const runs = await this.parser.scanRuns(this.outputFolder);
    
    if (runs.length === 0) {
      console.log('📭 No agent runs found');
      console.log(`💡 Check folder: ${this.outputFolder}`);
      return;
    }

    console.log(this.formatter.formatRunList(runs));
    console.log(`\n💡 Use 'npm run view show <run-id>' to see details`);
  }

  /**
   * Show detailed view of specific run
   */
  async showRun(runId?: string): Promise<void> {
    if (!runId) {
      console.log('❌ Please specify a run ID');
      console.log('💡 Use: npm run view show <run-id>');
      console.log('💡 Get run IDs with: npm run view list');
      return;
    }

    const runPath = await this.findRunPath(runId);
    if (!runPath) {
      console.log(`❌ Run not found: ${runId}`);
      return;
    }

    console.log(`🔍 Loading run: ${runId}\n`);
    
    const runData = await this.parser.parseRun(runPath);
    console.log(this.formatter.formatRunDetails(runData));
  }

  /**
   * Show overall statistics
   */
  async showSummary(): Promise<void> {
    console.log('📊 Agent Run Statistics\n');
    
    const runs = await this.parser.scanRuns(this.outputFolder);
    if (runs.length === 0) {
      console.log('📭 No runs to analyze');
      return;
    }

    const summary = await this.parser.generateSummary(runs);
    console.log(this.formatter.formatSummary(summary));
  }

  /**
   * Show agent hierarchy tree
   */
  async showTree(runId?: string): Promise<void> {
    if (!runId) {
      // Show latest run
      const runs = await this.parser.scanRuns(this.outputFolder);
      if (runs.length === 0) {
        console.log('📭 No runs found');
        return;
      }
      runId = runs[0].id;
    }

    const runPath = await this.findRunPath(runId);
    if (!runPath) {
      console.log(`❌ Run not found: ${runId}`);
      return;
    }

    console.log(`🌳 Agent Hierarchy: ${runId}\n`);
    
    const runData = await this.parser.parseRun(runPath);
    console.log(this.formatter.formatAgentTree(runData));
  }

  /**
   * Show conversation logs
   */
  async showLogs(runId?: string): Promise<void> {
    if (!runId) {
      const runs = await this.parser.scanRuns(this.outputFolder);
      if (runs.length === 0) {
        console.log('📭 No runs found');
        return;
      }
      runId = runs[0].id;
    }

    const runPath = await this.findRunPath(runId);
    if (!runPath) {
      console.log(`❌ Run not found: ${runId}`);
      return;
    }

    console.log(`💬 Conversation Logs: ${runId}\n`);
    
    const runData = await this.parser.parseRun(runPath);
    console.log(this.formatter.formatConversationLog(runData));
  }

  /**
   * Clean old runs (keep last N)
   */
  async cleanOldRuns(keepCount: number = 10): Promise<void> {
    console.log(`🧹 Cleaning old runs (keeping last ${keepCount})...\n`);
    
    const runs = await this.parser.scanRuns(this.outputFolder);
    const toDelete = runs.slice(keepCount);

    if (toDelete.length === 0) {
      console.log('✅ No old runs to clean');
      return;
    }

    console.log(`📋 Runs to delete (${toDelete.length}):`);
    toDelete.forEach(run => {
      console.log(`  🗑️  ${run.id} - ${run.agentName} (${run.startTime})`);
    });

    console.log('\n❓ Continue? (y/N)');
    
    // Simple confirmation (in real use, you'd want proper readline)
    const confirmed = process.argv.includes('--yes') || process.argv.includes('-y');
    
    if (confirmed) {
      for (const run of toDelete) {
        await fs.remove(run.path);
        console.log(`✅ Deleted: ${run.id}`);
      }
      console.log(`\n🎉 Cleaned ${toDelete.length} old runs`);
    } else {
      console.log('💡 Add --yes flag to confirm deletion');
    }
  }

  /**
   * Export run data
   */
  async exportRun(runId?: string, format: string = 'json'): Promise<void> {
    if (!runId) {
      console.log('❌ Please specify a run ID');
      return;
    }

    const runPath = await this.findRunPath(runId);
    if (!runPath) {
      console.log(`❌ Run not found: ${runId}`);
      return;
    }

    console.log(`📦 Exporting run: ${runId}`);
    
    const runData = await this.parser.parseRun(runPath);
    const exportPath = `./export-${runId}.${format}`;

    if (format === 'json') {
      await fs.writeFile(exportPath, JSON.stringify(runData, null, 2));
    } else if (format === 'md') {
      const markdown = this.formatter.formatRunAsMarkdown(runData);
      await fs.writeFile(exportPath, markdown);
    } else {
      console.log('❌ Unsupported format. Use: json, md');
      return;
    }

    console.log(`✅ Exported to: ${exportPath}`);
  }

  /**
   * Watch latest run for changes
   */
  async watchLatest(): Promise<void> {
    console.log('👀 Watching latest run for changes...');
    console.log('Press Ctrl+C to stop\n');

    const runs = await this.parser.scanRuns(this.outputFolder);
    if (runs.length === 0) {
      console.log('📭 No runs to watch');
      return;
    }

    const latestRun = runs[0];
    console.log(`📁 Watching: ${latestRun.id}`);

    // Simple file watching (in production, use chokidar)
    let lastSize = 0;
    
    setInterval(async () => {
      try {
        const conversationFile = path.join(latestRun.path, 'conversation.md');
        if (await fs.pathExists(conversationFile)) {
          const stats = await fs.stat(conversationFile);
          if (stats.size !== lastSize) {
            lastSize = stats.size;
            console.log(`🔄 ${new Date().toLocaleTimeString()} - Conversation updated (${stats.size} bytes)`);
          }
        }
      } catch (error) {
        // Silent fail
      }
    }, 1000);
  }

  /**
   * Find run path by ID (fuzzy search)
   */
  private async findRunPath(runId: string): Promise<string | null> {
    const runs = await this.parser.scanRuns(this.outputFolder);
    
    // Exact match first
    let run = runs.find(r => r.id === runId);
    
    // Fuzzy match if not found
    if (!run) {
      run = runs.find(r => r.id.includes(runId) || r.agentName.includes(runId));
    }

    return run?.path || null;
  }

  /**
   * Show help
   */
  private showHelp(): void {
    console.log(`🤖 Agent Run Viewer - Help

Usage: npm run view <command> [options]

Commands:
  list, ls                List all agent runs
  show <run-id>          Show detailed run information  
  summary, stats         Show overall statistics
  tree [run-id]          Show agent hierarchy tree
  logs [run-id]          Show conversation logs
  clean [keep-count]     Clean old runs (default: keep 10)
  export <run-id> [fmt]  Export run data (json|md)
  watch                  Watch latest run for changes
  help                   Show this help

Examples:
  npm run view list                    # List all runs
  npm run view show strategic-plan     # Show specific run
  npm run view tree                    # Show latest run tree
  npm run view clean 5 --yes          # Keep only 5 newest runs
  npm run view export abc123 md       # Export run as markdown

Options:
  --yes, -y              Auto-confirm prompts

Output folder: ${this.outputFolder}
`);
  }
}

// CLI execution
if (require.main === module) {
  const viewer = new AgentRunViewer();
  const [,, command, ...args] = process.argv;
  viewer.run(command, ...args);
}