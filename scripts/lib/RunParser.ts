import * as fs from 'fs-extra';
import * as path from 'path';
import { RunData, RunSummary, RunListItem, AgentMetadata, ExecutionEvent, ConversationMessage } from './types';

export class RunParser {
  
  /**
   * Scan output folder and return list of runs
   */
  async scanRuns(outputFolder: string): Promise<RunListItem[]> {
    if (!await fs.pathExists(outputFolder)) {
      return [];
    }

    const entries = await fs.readdir(outputFolder);
    const runs: RunListItem[] = [];

    for (const entry of entries) {
      const entryPath = path.join(outputFolder, entry);
      const stats = await fs.stat(entryPath);
      
      if (stats.isDirectory()) {
        try {
          const runInfo = await this.parseRunBasicInfo(entryPath);
          if (runInfo) {
            runs.push(runInfo);
          }
        } catch (error) {
          // Skip invalid directories
          console.warn(`⚠️  Skipping invalid run directory: ${entry}`);
        }
      }
    }

    // Sort by start time (newest first)
    return runs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  /**
   * Parse basic run info for listing
   */
  private async parseRunBasicInfo(runPath: string): Promise<RunListItem | null> {
    const metadataPath = path.join(runPath, 'metadata.json');
    const reportPath = path.join(runPath, 'agent-report.md');
    
    if (!await fs.pathExists(metadataPath)) {
      return null;
    }

    const metadata: AgentMetadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
    
    // Get folder size
    const stats = await this.getFolderSize(runPath);
    
    // Get final status from report if available
    let finalStatus = metadata.status;
    let duration = 0;
    
    if (metadata.endTime) {
      duration = new Date(metadata.endTime).getTime() - new Date(metadata.startTime).getTime();
    }

    return {
      id: path.basename(runPath),
      agentName: metadata.name,
      path: runPath,
      startTime: metadata.startTime,
      endTime: metadata.endTime,
      duration: duration,
      status: finalStatus,
      size: stats.size,
      depth: metadata.depth || 0,
      hasChildren: await this.hasChildAgents(runPath)
    };
  }

  /**
   * Parse complete run data
   */
  async parseRun(runPath: string): Promise<RunData> {
    const metadata = await this.parseMetadata(runPath);
    const events = await this.parseExecutionLog(runPath);
    const conversation = await this.parseConversation(runPath);
    const children = await this.parseChildAgents(runPath);
    const metrics = this.calculateMetrics(events, conversation);

    return {
      id: path.basename(runPath),
      path: runPath,
      metadata,
      events,
      conversation,
      children,
      metrics
    };
  }

  /**
   * Parse metadata.json
   */
  private async parseMetadata(runPath: string): Promise<AgentMetadata> {
    const metadataPath = path.join(runPath, 'metadata.json');
    if (!await fs.pathExists(metadataPath)) {
      throw new Error(`Metadata not found: ${metadataPath}`);
    }
    return JSON.parse(await fs.readFile(metadataPath, 'utf8'));
  }

  /**
   * Parse execution-log.json (line-delimited JSON)
   */
  private async parseExecutionLog(runPath: string): Promise<ExecutionEvent[]> {
    const logPath = path.join(runPath, 'execution-log.json');
    if (!await fs.pathExists(logPath)) {
      return [];
    }

    const content = await fs.readFile(logPath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.warn(`Invalid JSON line in execution log: ${line}`);
        return null;
      }
    }).filter(Boolean) as ExecutionEvent[];
  }

  /**
   * Parse conversation.md
   */
  private async parseConversation(runPath: string): Promise<ConversationMessage[]> {
    const conversationPath = path.join(runPath, 'conversation.md');
    if (!await fs.pathExists(conversationPath)) {
      return [];
    }

    const content = await fs.readFile(conversationPath, 'utf8');
    return this.parseMarkdownConversation(content);
  }

  /**
   * Parse markdown conversation into structured messages
   */
  private parseMarkdownConversation(content: string): ConversationMessage[] {
    const messages: ConversationMessage[] = [];
    const sections = content.split(/^## /m).slice(1); // Skip header

    for (const section of sections) {
      const lines = section.trim().split('\n');
      if (lines.length < 2) continue;

      const timestampMatch = lines[0].match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
      const roleMatch = lines[1].match(/^\*\*(\w+):\*\*/);

      if (timestampMatch && roleMatch) {
        const timestamp = timestampMatch[1];
        const role = roleMatch[1];
        const content = lines.slice(2).join('\n').trim();

        messages.push({
          timestamp,
          role: role as any,
          content,
          length: content.length
        });
      }
    }

    return messages;
  }

  /**
   * Parse child agents recursively
   */
  private async parseChildAgents(runPath: string): Promise<RunData[]> {
    const children: RunData[] = [];
    const entries = await fs.readdir(runPath);

    for (const entry of entries) {
      const entryPath = path.join(runPath, entry);
      const stats = await fs.stat(entryPath);
      
      if (stats.isDirectory()) {
        const metadataPath = path.join(entryPath, 'metadata.json');
        if (await fs.pathExists(metadataPath)) {
          try {
            const childData = await this.parseRun(entryPath);
            children.push(childData);
          } catch (error) {
            console.warn(`Failed to parse child agent: ${entry}`);
          }
        }
      }
    }

    return children.sort((a, b) => 
      new Date(a.metadata.startTime).getTime() - new Date(b.metadata.startTime).getTime()
    );
  }

  /**
   * Calculate run metrics
   */
  private calculateMetrics(events: ExecutionEvent[], conversation: ConversationMessage[]) {
    const metrics = {
      totalEvents: events.length,
      totalMessages: conversation.length,
      llmCalls: events.filter(e => e.event === 'llmCall').length,
      toolCalls: events.filter(e => e.event === 'toolCalls').length,
      childrenCreated: events.filter(e => e.event === 'childCreated').length,
      errors: events.filter(e => e.event === 'agentError').length,
      averageMessageLength: 0,
      totalTokensApprox: 0,
      timeline: this.createTimeline(events),
      tools: this.extractToolsUsed(events),
      conversationStats: this.analyzeConversation(conversation)
    };

    if (conversation.length > 0) {
      metrics.averageMessageLength = Math.round(
        conversation.reduce((sum, msg) => sum + msg.length, 0) / conversation.length
      );
      metrics.totalTokensApprox = Math.round(
        conversation.reduce((sum, msg) => sum + msg.length, 0) / 4 // Rough token estimate
      );
    }

    return metrics;
  }

  /**
   * Create execution timeline
   */
  private createTimeline(events: ExecutionEvent[]) {
    if (events.length === 0) return { start: null, end: null, duration: 0, phases: [] };

    const start = new Date(events[0].timestamp);
    const end = new Date(events[events.length - 1].timestamp);
    const duration = end.getTime() - start.getTime();

    const phases = events.map(event => ({
      timestamp: event.timestamp,
      event: event.event,
      relativeTime: new Date(event.timestamp).getTime() - start.getTime()
    }));

    return { start: start.toISOString(), end: end.toISOString(), duration, phases };
  }

  /**
   * Extract tools used from events
   */
  private extractToolsUsed(events: ExecutionEvent[]): string[] {
    const tools = new Set<string>();
    
    events.forEach(event => {
      if (event.event === 'toolCalls' && event.data?.toolCalls) {
        event.data.toolCalls.forEach((tool: string) => tools.add(tool));
      }
    });

    return Array.from(tools);
  }

  /**
   * Analyze conversation patterns
   */
  private analyzeConversation(conversation: ConversationMessage[]) {
    const roleStats: Record<string, number> = {};
    let longestMessage = 0;
    let shortestMessage = Infinity;

    conversation.forEach(msg => {
      roleStats[msg.role] = (roleStats[msg.role] || 0) + 1;
      longestMessage = Math.max(longestMessage, msg.length);
      if (msg.length > 0) {
        shortestMessage = Math.min(shortestMessage, msg.length);
      }
    });

    return {
      roleDistribution: roleStats,
      longestMessage: longestMessage || 0,
      shortestMessage: shortestMessage === Infinity ? 0 : shortestMessage,
      totalCharacters: conversation.reduce((sum, msg) => sum + msg.length, 0)
    };
  }

  /**
   * Generate summary statistics
   */
  async generateSummary(runs: RunListItem[]): Promise<RunSummary> {
    const totalRuns = runs.length;
    const successfulRuns = runs.filter(r => r.status === 'completed').length;
    const failedRuns = runs.filter(r => r.status === 'error').length;
    const runningRuns = runs.filter(r => r.status === 'running').length;

    const totalDuration = runs.reduce((sum, run) => sum + (run.duration || 0), 0);
    const averageDuration = totalRuns > 0 ? totalDuration / totalRuns : 0;

    const totalSize = runs.reduce((sum, run) => sum + run.size, 0);

    const agentNames = new Set(runs.map(r => r.agentName));
    const hasHierarchy = runs.some(r => r.hasChildren || r.depth > 0);

    const recentRuns = runs.slice(0, 5);
    const oldestRun = runs.length > 0 ? runs[runs.length - 1] : null;
    const newestRun = runs.length > 0 ? runs[0] : null;

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      runningRuns,
      totalDuration,
      averageDuration,
      totalSize,
      uniqueAgents: agentNames.size,
      hasHierarchy,
      recentRuns,
      oldestRun,
      newestRun,
      trends: this.calculateTrends(runs)
    };
  }

  /**
   * Calculate trends over time
   */
  private calculateTrends(runs: RunListItem[]) {
    const last7Days = runs.filter(r => {
      const runDate = new Date(r.startTime);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return runDate > weekAgo;
    });

    const last24Hours = runs.filter(r => {
      const runDate = new Date(r.startTime);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return runDate > dayAgo;
    });

    return {
      runsLast24h: last24Hours.length,
      runsLast7d: last7Days.length,
      averageDurationLast7d: last7Days.length > 0 ? 
        last7Days.reduce((sum, r) => sum + (r.duration || 0), 0) / last7Days.length : 0,
      successRateLast7d: last7Days.length > 0 ?
        last7Days.filter(r => r.status === 'completed').length / last7Days.length : 0
    };
  }

  /**
   * Check if run has child agents
   */
  private async hasChildAgents(runPath: string): Promise<boolean> {
    const entries = await fs.readdir(runPath);
    
    for (const entry of entries) {
      const entryPath = path.join(runPath, entry);
      const stats = await fs.stat(entryPath);
      
      if (stats.isDirectory()) {
        const metadataPath = path.join(entryPath, 'metadata.json');
        if (await fs.pathExists(metadataPath)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Get folder size recursively
   */
  private async getFolderSize(folderPath: string): Promise<{ size: number; files: number }> {
    let totalSize = 0;
    let fileCount = 0;

    async function calculateSize(currentPath: string) {
      const entries = await fs.readdir(currentPath);
      
      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry);
        const stats = await fs.stat(entryPath);
        
        if (stats.isFile()) {
          totalSize += stats.size;
          fileCount++;
        } else if (stats.isDirectory()) {
          await calculateSize(entryPath);
        }
      }
    }

    await calculateSize(folderPath);
    return { size: totalSize, files: fileCount };
  }
}