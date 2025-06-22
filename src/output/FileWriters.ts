import * as fs from 'fs-extra';
import * as path from 'path';
import { OutputPaths, ExecutionEvent, ConversationEntry, AgentMetadata, ReportSection } from './types';

export class MarkdownWriter {
  constructor(private paths: OutputPaths) {}

  /**
   * Initialize conversation log file with header
   */
  async initializeConversationLog(agentName: string): Promise<void> {
    const header = `# Conversation Log - ${agentName}\n\n`;
    await fs.writeFile(this.paths.conversationLog, header, 'utf8');
  }

  /**
   * Append a single message to conversation log
   */
  async appendConversation(entry: ConversationEntry): Promise<void> {
    const content = this.formatConversationEntry(entry);
    await fs.appendFile(this.paths.conversationLog, content, 'utf8');
  }

  /**
   * Initialize agent report with template
   */
  async initializeAgentReport(metadata: AgentMetadata): Promise<void> {
    const report = this.generateInitialReport(metadata);
    await fs.writeFile(this.paths.agentReport, report, 'utf8');
  }

  /**
   * Update specific section of agent report
   */
  async updateReportSection(section: ReportSection): Promise<void> {
    try {
      const currentReport = await fs.readFile(this.paths.agentReport, 'utf8');
      const updatedReport = this.replaceReportSection(currentReport, section);
      await fs.writeFile(this.paths.agentReport, updatedReport, 'utf8');
    } catch (error) {
      // If file doesn't exist, create it
      console.warn('Report file not found, creating new one');
    }
  }

  /**
   * Finalize agent report with completion data
   */
  async finalizeReport(metadata: AgentMetadata, result: any): Promise<void> {
    const finalSection: ReportSection = {
      title: 'Final Result',
      content: this.generateFinalResultSection(metadata, result),
      lastUpdated: new Date().toISOString()
    };
    
    await this.updateReportSection(finalSection);
    
    // Update status section
    const statusSection: ReportSection = {
      title: 'Status',
      content: this.generateStatusSection(metadata),
      lastUpdated: new Date().toISOString()
    };
    
    await this.updateReportSection(statusSection);
  }

  private formatConversationEntry(entry: ConversationEntry): string {
    let content = `## ${entry.timestamp}\n**${entry.role}:**\n\n${entry.content}\n\n`;
    
    // Add tool calls if present
    if (entry.toolCalls && entry.toolCalls.length > 0) {
      content += '**Tool Calls:**\n';
      entry.toolCalls.forEach(tc => {
        content += `- ${tc.function.name}(${tc.function.arguments})\n`;
      });
      content += '\n';
    }
    
    return content;
  }

  private generateInitialReport(metadata: AgentMetadata): string {
    return `# Agent Report: ${metadata.name}

**Agent ID:** \`${metadata.id}\`  
**Depth:** ${metadata.depth}  
${metadata.parentId ? `**Parent ID:** \`${metadata.parentId}\`  ` : ''}
**Started:** ${metadata.startTime}  

## Status

🔄 **Running** - Agent is currently executing

## Task

${metadata.task}

## Execution Summary

- **Messages Exchanged:** 0
- **Tools Used:** None yet
- **Child Agents Created:** 0
- **Current Status:** Initializing

## Progress Timeline

✅ Agent created and initialized  
🔄 Loading context and preparing execution  

---

*This report updates in real-time as the agent executes*
`;
  }

  private generateStatusSection(metadata: AgentMetadata): string {
    const statusEmoji = metadata.status === 'completed' ? '✅' : 
                       metadata.status === 'error' ? '❌' : 
                       metadata.status === 'running' ? '🔄' : '⏳';
    
    const statusText = metadata.status === 'completed' ? 'Completed Successfully' :
                      metadata.status === 'error' ? 'Completed with Errors' :
                      metadata.status === 'running' ? 'Currently Running' : 'Created';

    let content = `${statusEmoji} **${statusText}**`;
    
    if (metadata.endTime) {
      const duration = new Date(metadata.endTime).getTime() - new Date(metadata.startTime).getTime();
      content += ` - Execution time: ${duration}ms`;
    }

    return content;
  }

  private generateFinalResultSection(metadata: AgentMetadata, result: any): string {
    return `## Final Result

**Success:** ${result.success ? '✅ Yes' : '❌ No'}  
**Completed:** ${result.timestamp}  
**Execution Time:** ${result.executionTime}ms  

### Result Content

${result.result}

${result.error ? `### Error Details\n\n\`\`\`\n${result.error}\n\`\`\`` : ''}

### Child Agents

${result.children && result.children.length > 0 ? 
  result.children.map((child: any, index: number) => 
    `${index + 1}. **${child.agentName}** - ${child.success ? '✅' : '❌'}`
  ).join('\n') : 
  'No child agents created'
}
`;
  }

  private replaceReportSection(currentReport: string, section: ReportSection): string {
    // Simple section replacement - find section by title and replace content
    const sectionRegex = new RegExp(`(## ${section.title}\\n)[\\s\\S]*?(?=\\n## |$)`, 'g');
    
    if (sectionRegex.test(currentReport)) {
      return currentReport.replace(sectionRegex, `## ${section.title}\n\n${section.content}\n\n`);
    } else {
      // Section doesn't exist, append it
      return currentReport + `\n## ${section.title}\n\n${section.content}\n\n`;
    }
  }
}

export class JSONWriter {
  constructor(private paths: OutputPaths) {}

  /**
   * Initialize execution log file
   */
  async initializeExecutionLog(): Promise<void> {
    await fs.writeFile(this.paths.executionLog, '', 'utf8');
  }

  /**
   * Append single event to execution log
   */
  async appendEvent(event: ExecutionEvent): Promise<void> {
    const eventLine = JSON.stringify(event) + '\n';
    await fs.appendFile(this.paths.executionLog, eventLine, 'utf8');
  }

  /**
   * Write metadata file (overwrites)
   */
  async writeMetadata(metadata: AgentMetadata): Promise<void> {
    const metadataPath = path.join(path.dirname(this.paths.agentReport), 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  }
}

export class PathManager {
  /**
   * Create folder structure and return paths
   */
  static async createOutputStructure(
    rootFolder: string, 
    agentName: string, 
    parentPath?: string
  ): Promise<OutputPaths> {
    let outputPath: string;
    
    if (parentPath) {
      // Child agent - create subfolder
      const sanitizedName = this.sanitizeFileName(agentName);
      outputPath = path.join(parentPath, sanitizedName);
    } else {
      // Root agent - create timestamped folder
      const timestamp = new Date().toISOString()
        .replace(/:/g, '-')
        .replace(/\.\d{3}Z$/, '')
        .replace('T', '-');
      
      const folderName = `${this.sanitizeFileName(agentName)}-${timestamp}`;
      outputPath = path.join(rootFolder, folderName);
    }

    await fs.ensureDir(outputPath);

    return {
      rootFolder: outputPath,
      agentReport: path.join(outputPath, 'agent-report.md'),
      conversationLog: path.join(outputPath, 'conversation.md'),
      executionLog: path.join(outputPath, 'execution-log.json')
    };
  }

  private static sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  }
}