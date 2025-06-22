import { RunData, RunSummary, RunListItem } from './types';

export class RunFormatter {
  private colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
  };

  /**
   * Format list of runs
   */
  formatRunList(runs: RunListItem[]): string {
    if (runs.length === 0) {
      return '📭 No agent runs found';
    }

    const output: string[] = [];
    output.push(`📋 ${this.colors.bright}Agent Runs (${runs.length} total)${this.colors.reset}\n`);
    
    // Table header
    const header = this.formatTableRow([
      { text: 'ID', width: 25, align: 'left' },
      { text: 'Agent', width: 20, align: 'left' },
      { text: 'Status', width: 12, align: 'center' },
      { text: 'Duration', width: 10, align: 'right' },
      { text: 'Size', width: 8, align: 'right' },
      { text: 'Started', width: 19, align: 'left' }
    ]);
    
    output.push(this.colors.gray + header + this.colors.reset);
    output.push(this.colors.gray + '─'.repeat(100) + this.colors.reset);

    // Table rows
    for (const run of runs) {
      const statusColor = this.getStatusColor(run.status);
      const sizeFormatted = this.formatBytes(run.size);
      const durationFormatted = this.formatDuration(run.duration);
      const startTime = new Date(run.startTime).toLocaleString().substring(0, 19);
      
      const row = this.formatTableRow([
        { text: this.truncate(run.id, 24), width: 25, align: 'left' },
        { text: this.truncate(run.agentName, 19), width: 20, align: 'left' },
        { text: statusColor + this.getStatusIcon(run.status) + ' ' + run.status + this.colors.reset, width: 12, align: 'center', noColorCount: true },
        { text: durationFormatted, width: 10, align: 'right' },
        { text: sizeFormatted, width: 8, align: 'right' },
        { text: startTime, width: 19, align: 'left' }
      ]);

      output.push(row);
      
      // Show hierarchy indicator
      if (run.hasChildren) {
        output.push(this.colors.dim + '  └─ Has child agents' + this.colors.reset);
      }
    }

    return output.join('\n');
  }

  /**
   * Format detailed run information
   */
  formatRunDetails(runData: RunData): string {
    const output: string[] = [];
    const { metadata, metrics, conversation, children } = runData;

    // Header
    output.push(`${this.colors.bright}${this.colors.blue}🤖 Agent Run Details${this.colors.reset}\n`);
    output.push(`${this.colors.bright}${metadata.name}${this.colors.reset} (${runData.id})\n`);

    // Basic info
    output.push(`${this.colors.bright}📊 Basic Information${this.colors.reset}`);
    output.push(`  ID: ${this.colors.cyan}${runData.id}${this.colors.reset}`);
    output.push(`  Task: ${metadata.task}`);
    output.push(`  Status: ${this.getStatusColor(metadata.status)}${this.getStatusIcon(metadata.status)} ${metadata.status}${this.colors.reset}`);
    output.push(`  Depth: ${metadata.depth}`);
    if (metadata.parentId) {
      output.push(`  Parent: ${this.colors.gray}${metadata.parentId}${this.colors.reset}`);
    }
    output.push('');

    // Timing
    output.push(`${this.colors.bright}⏱️  Execution Timeline${this.colors.reset}`);
    output.push(`  Started: ${new Date(metadata.startTime).toLocaleString()}`);
    if (metadata.endTime) {
      output.push(`  Ended: ${new Date(metadata.endTime).toLocaleString()}`);
      const duration = new Date(metadata.endTime).getTime() - new Date(metadata.startTime).getTime();
      output.push(`  Duration: ${this.colors.yellow}${this.formatDuration(duration)}${this.colors.reset}`);
    } else {
      output.push(`  Status: ${this.colors.yellow}Still running or incomplete${this.colors.reset}`);
    }
    output.push('');

    // Metrics
    output.push(`${this.colors.bright}📈 Execution Metrics${this.colors.reset}`);
    output.push(`  Messages: ${this.colors.cyan}${metrics.totalMessages}${this.colors.reset}`);
    output.push(`  LLM Calls: ${this.colors.cyan}${metrics.llmCalls}${this.colors.reset}`);
    output.push(`  Tool Calls: ${this.colors.cyan}${metrics.toolCalls}${this.colors.reset}`);
    output.push(`  Children Created: ${this.colors.cyan}${metrics.childrenCreated}${this.colors.reset}`);
    if (metrics.errors > 0) {
      output.push(`  Errors: ${this.colors.red}${metrics.errors}${this.colors.reset}`);
    }
    output.push(`  Avg Message Length: ${metrics.averageMessageLength} chars`);
    output.push(`  Est. Tokens: ${this.colors.yellow}~${metrics.totalTokensApprox.toLocaleString()}${this.colors.reset}`);
    output.push('');

    // Tools used
    if (metrics.tools.length > 0) {
      output.push(`${this.colors.bright}🔧 Tools Used${this.colors.reset}`);
      metrics.tools.forEach(tool => {
        output.push(`  • ${this.colors.green}${tool}${this.colors.reset}`);
      });
      output.push('');
    }

    // Conversation summary
    if (conversation.length > 0) {
      output.push(`${this.colors.bright}💬 Conversation Summary${this.colors.reset}`);
      const roleStats = metrics.conversationStats.roleDistribution;
      Object.entries(roleStats).forEach(([role, count]) => {
        const roleColor = this.getRoleColor(role);
        output.push(`  ${roleColor}${role}${this.colors.reset}: ${count} messages`);
      });
      output.push(`  Total Characters: ${metrics.conversationStats.totalCharacters.toLocaleString()}`);
      output.push('');
    }

    // Child agents
    if (children.length > 0) {
      output.push(`${this.colors.bright}👥 Child Agents (${children.length})${this.colors.reset}`);
      children.forEach((child, index) => {
        const statusColor = this.getStatusColor(child.metadata.status);
        const duration = child.metadata.endTime ? 
          new Date(child.metadata.endTime).getTime() - new Date(child.metadata.startTime).getTime() : 0;
        
        output.push(`  ${index + 1}. ${this.colors.cyan}${child.metadata.name}${this.colors.reset}`);
        output.push(`     Status: ${statusColor}${this.getStatusIcon(child.metadata.status)} ${child.metadata.status}${this.colors.reset}`);
        output.push(`     Duration: ${this.formatDuration(duration)}`);
        output.push(`     Messages: ${child.metrics.totalMessages}`);
      });
      output.push('');
    }

    // File paths
    output.push(`${this.colors.bright}📁 Files${this.colors.reset}`);
    output.push(`  📊 Report: ${this.colors.blue}${runData.path}/agent-report.md${this.colors.reset}`);
    output.push(`  💬 Conversation: ${this.colors.blue}${runData.path}/conversation.md${this.colors.reset}`);
    output.push(`  📋 Events: ${this.colors.blue}${runData.path}/execution-log.json${this.colors.reset}`);

    return output.join('\n');
  }

  /**
   * Format overall summary
   */
  formatSummary(summary: RunSummary): string {
    const output: string[] = [];

    output.push(`${this.colors.bright}${this.colors.blue}📈 Agent Run Statistics${this.colors.reset}\n`);

    // Overview
    output.push(`${this.colors.bright}📊 Overview${this.colors.reset}`);
    output.push(`  Total Runs: ${this.colors.cyan}${summary.totalRuns}${this.colors.reset}`);
    output.push(`  Successful: ${this.colors.green}${summary.successfulRuns}${this.colors.reset} (${Math.round(summary.successfulRuns/summary.totalRuns*100)}%)`);
    output.push(`  Failed: ${this.colors.red}${summary.failedRuns}${this.colors.reset} (${Math.round(summary.failedRuns/summary.totalRuns*100)}%)`);
    if (summary.runningRuns > 0) {
      output.push(`  Running: ${this.colors.yellow}${summary.runningRuns}${this.colors.reset}`);
    }
    output.push(`  Unique Agents: ${summary.uniqueAgents}`);
    output.push(`  Has Hierarchy: ${summary.hasHierarchy ? '✅ Yes' : '❌ No'}`);
    output.push('');

    // Performance
    output.push(`${this.colors.bright}⚡ Performance${this.colors.reset}`);
    output.push(`  Average Duration: ${this.colors.yellow}${this.formatDuration(summary.averageDuration)}${this.colors.reset}`);
    output.push(`  Total Duration: ${this.formatDuration(summary.totalDuration)}`);
    output.push(`  Total Storage: ${this.colors.cyan}${this.formatBytes(summary.totalSize)}${this.colors.reset}`);
    output.push('');

    // Recent activity
    output.push(`${this.colors.bright}📅 Recent Activity${this.colors.reset}`);
    output.push(`  Last 24h: ${this.colors.cyan}${summary.trends.runsLast24h}${this.colors.reset} runs`);
    output.push(`  Last 7d: ${this.colors.cyan}${summary.trends.runsLast7d}${this.colors.reset} runs`);
    output.push(`  Success Rate (7d): ${this.colors.green}${Math.round(summary.trends.successRateLast7d*100)}%${this.colors.reset}`);
    output.push(`  Avg Duration (7d): ${this.formatDuration(summary.trends.averageDurationLast7d)}`);
    output.push('');

    // Recent runs
    if (summary.recentRuns.length > 0) {
      output.push(`${this.colors.bright}🕒 Recent Runs${this.colors.reset}`);
      summary.recentRuns.forEach((run, index) => {
        const statusColor = this.getStatusColor(run.status);
        const timeAgo = this.timeAgo(new Date(run.startTime));
        output.push(`  ${index + 1}. ${this.colors.cyan}${run.agentName}${this.colors.reset} - ${statusColor}${this.getStatusIcon(run.status)}${this.colors.reset} ${timeAgo}`);
      });
    }

    return output.join('\n');
  }

  /**
   * Format agent hierarchy tree
   */
  formatAgentTree(runData: RunData): string {
    const output: string[] = [];
    
    output.push(`${this.colors.bright}${this.colors.blue}🌳 Agent Hierarchy${this.colors.reset}\n`);
    
    this.formatAgentNode(runData, output, '', true);
    
    return output.join('\n');
  }

  /**
   * Format single agent node in tree
   */
  private formatAgentNode(agent: RunData, output: string[], prefix: string, isLast: boolean): void {
    const connector = isLast ? '└── ' : '├── ';
    const statusColor = this.getStatusColor(agent.metadata.status);
    const statusIcon = this.getStatusIcon(agent.metadata.status);
    
    output.push(`${prefix}${connector}${this.colors.cyan}${agent.metadata.name}${this.colors.reset} ${statusColor}${statusIcon}${this.colors.reset}`);
    output.push(`${prefix}${isLast ? '    ' : '│   '}${this.colors.gray}${agent.metadata.task.substring(0, 60)}${agent.metadata.task.length > 60 ? '...' : ''}${this.colors.reset}`);
    
    if (agent.metadata.endTime) {
      const duration = new Date(agent.metadata.endTime).getTime() - new Date(agent.metadata.startTime).getTime();
      output.push(`${prefix}${isLast ? '    ' : '│   '}${this.colors.dim}Duration: ${this.formatDuration(duration)}, Messages: ${agent.metrics.totalMessages}${this.colors.reset}`);
    }

    // Add children
    agent.children.forEach((child, index) => {
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      const isLastChild = index === agent.children.length - 1;
      this.formatAgentNode(child, output, childPrefix, isLastChild);
    });
  }

  /**
   * Format conversation log
   */
  formatConversationLog(runData: RunData, limit: number = 20): string {
    const output: string[] = [];
    const { conversation, metadata } = runData;

    output.push(`${this.colors.bright}${this.colors.blue}💬 Conversation Log${this.colors.reset}`);
    output.push(`${this.colors.bright}${metadata.name}${this.colors.reset} - Showing ${Math.min(limit, conversation.length)} of ${conversation.length} messages\n`);

    const messagesToShow = conversation.slice(0, limit);

    messagesToShow.forEach((message, index) => {
      const roleColor = this.getRoleColor(message.role);
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      const preview = this.truncate(message.content.replace(/\n/g, ' '), 80);
      
      output.push(`${this.colors.gray}[${timestamp}]${this.colors.reset} ${roleColor}${message.role}${this.colors.reset}: ${preview}`);
      
      if (index < messagesToShow.length - 1) {
        output.push('');
      }
    });

    if (conversation.length > limit) {
      output.push(`\n${this.colors.dim}... ${conversation.length - limit} more messages${this.colors.reset}`);
      output.push(`${this.colors.dim}View full conversation: ${runData.path}/conversation.md${this.colors.reset}`);
    }

    return output.join('\n');
  }

  /**
   * Format run as markdown export
   */
  formatRunAsMarkdown(runData: RunData): string {
    const output: string[] = [];
    const { metadata, metrics, conversation, children } = runData;

    output.push(`# Agent Run Report: ${metadata.name}`);
    output.push('');
    output.push(`**Run ID:** ${runData.id}  `);
    output.push(`**Task:** ${metadata.task}  `);
    output.push(`**Status:** ${metadata.status}  `);
    output.push(`**Started:** ${new Date(metadata.startTime).toLocaleString()}  `);
    if (metadata.endTime) {
      output.push(`**Completed:** ${new Date(metadata.endTime).toLocaleString()}  `);
      const duration = new Date(metadata.endTime).getTime() - new Date(metadata.startTime).getTime();
      output.push(`**Duration:** ${this.formatDuration(duration)}  `);
    }
    output.push('');

    output.push('## Execution Metrics');
    output.push('');
    output.push(`- **Messages:** ${metrics.totalMessages}`);
    output.push(`- **LLM Calls:** ${metrics.llmCalls}`);
    output.push(`- **Tool Calls:** ${metrics.toolCalls}`);
    output.push(`- **Children Created:** ${metrics.childrenCreated}`);
    output.push(`- **Estimated Tokens:** ~${metrics.totalTokensApprox.toLocaleString()}`);
    output.push('');

    if (metrics.tools.length > 0) {
      output.push('## Tools Used');
      output.push('');
      metrics.tools.forEach(tool => output.push(`- ${tool}`));
      output.push('');
    }

    if (children.length > 0) {
      output.push('## Child Agents');
      output.push('');
      children.forEach((child, index) => {
        output.push(`### ${index + 1}. ${child.metadata.name}`);
        output.push(`- **Task:** ${child.metadata.task}`);
        output.push(`- **Status:** ${child.metadata.status}`);
        output.push(`- **Messages:** ${child.metrics.totalMessages}`);
        output.push('');
      });
    }

    output.push('## Conversation Summary');
    output.push('');
    const roleStats = metrics.conversationStats.roleDistribution;
    Object.entries(roleStats).forEach(([role, count]) => {
      output.push(`- **${role}:** ${count} messages`);
    });

    return output.join('\n');
  }

  // Helper methods

  private formatTableRow(columns: Array<{text: string, width: number, align: 'left'|'center'|'right', noColorCount?: boolean}>): string {
    return columns.map(col => {
      const textLength = col.noColorCount ? this.stripAnsiCodes(col.text).length : col.text.length;
      const padding = Math.max(0, col.width - textLength);
      
      switch (col.align) {
        case 'right':
          return ' '.repeat(padding) + col.text;
        case 'center':
          const leftPad = Math.floor(padding / 2);
          const rightPad = padding - leftPad;
          return ' '.repeat(leftPad) + col.text + ' '.repeat(rightPad);
        default:
          return col.text + ' '.repeat(padding);
      }
    }).join(' ');
  }

  private stripAnsiCodes(text: string): string {
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return this.colors.green;
      case 'error': return this.colors.red;
      case 'running': return this.colors.yellow;
      default: return this.colors.gray;
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'error': return '❌';
      case 'running': return '🔄';
      default: return '⏳';
    }
  }

  private getRoleColor(role: string): string {
    switch (role) {
      case 'system': return this.colors.gray;
      case 'user': return this.colors.blue;
      case 'assistant': return this.colors.green;
      case 'tool': return this.colors.yellow;
      case 'tool_call': return this.colors.magenta;
      default: return this.colors.white;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    if (milliseconds < 3600000) return `${(milliseconds / 60000).toFixed(1)}m`;
    return `${(milliseconds / 3600000).toFixed(1)}h`;
  }

  private truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 1) + '…' : text;
  }

  private timeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}