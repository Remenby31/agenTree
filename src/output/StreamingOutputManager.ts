import { LLMMessage, ToolCall } from '../types';
import { LLMConfig } from '../llm/LLMClient';
import { 
  OutputPaths, 
  ExecutionEvent, 
  ConversationEntry, 
  AgentMetadata, 
  ReportSection 
} from './types';
import { MarkdownWriter, JSONWriter, PathManager } from './FileWriters';

export class StreamingOutputManager {
  private paths: OutputPaths | null = null;
  private markdownWriter: MarkdownWriter | null = null;
  private jsonWriter: JSONWriter | null = null;
  private metadata: AgentMetadata;
  private stats = {
    messagesCount: 0,
    toolsUsed: new Set<string>(),
    childrenCreated: 0,
    llmCalls: 0
  };

  constructor(
    private config: LLMConfig,
    private agentId: string,
    private agentName: string,
    private task: string,
    private depth: number,
    private parentId?: string,
    private parentPath?: string
  ) {
    this.metadata = {
      id: agentId,
      name: agentName,
      task: task,
      depth: depth,
      parentId: parentId,
      startTime: new Date().toISOString(),
      status: 'created'
    };
  }

  /**
   * Initialize output files and start recording
   */
  async initialize(): Promise<void> {
    if (!this.config.outputFile) return;

    try {
      // Create folder structure
      this.paths = await PathManager.createOutputStructure(
        this.config.outputFolder || '.agentree',
        this.agentName,
        this.parentPath
      );

      // Initialize writers
      this.markdownWriter = new MarkdownWriter(this.paths);
      this.jsonWriter = new JSONWriter(this.paths);

      // Create initial files
      await this.markdownWriter.initializeConversationLog(this.agentName);
      await this.markdownWriter.initializeAgentReport(this.metadata);
      await this.jsonWriter.initializeExecutionLog();
      await this.jsonWriter.writeMetadata(this.metadata);

      // Record initialization event
      await this.recordEvent('agentCreated', {
        agentId: this.agentId,
        name: this.agentName,
        task: this.task,
        depth: this.depth,
        parentId: this.parentId
      });

      console.log(`📁 Output initialized: ${this.paths.rootFolder}`);
    } catch (error) {
      console.error('Failed to initialize output:', error);
    }
  }

  /**
   * Record any execution event
   */
  async recordEvent(eventType: string, eventData: any): Promise<void> {
    if (!this.jsonWriter) return;

    const event: ExecutionEvent = {
      timestamp: new Date().toISOString(),
      event: eventType,
      agentId: this.agentId,
      agentName: this.agentName,
      depth: this.depth,
      data: eventData
    };

    await this.jsonWriter.appendEvent(event);
  }

  /**
   * Record agent start
   */
  async recordStart(): Promise<void> {
    this.metadata.status = 'running';
    
    await this.recordEvent('agentStarted', {
      agentId: this.agentId,
      name: this.agentName
    });

    if (this.jsonWriter) {
      await this.jsonWriter.writeMetadata(this.metadata);
    }
  }

  /**
   * Record context loading
   */
  async recordContextLoaded(context: any): Promise<void> {
    await this.recordEvent('contextLoaded', {
      agentId: this.agentId,
      context: {
        fileCount: Object.keys(context.files || {}).length,
        urlCount: Object.keys(context.urls || {}).length,
        textCount: (context.text || []).length
      }
    });

    // Update progress in report
    if (this.markdownWriter) {
      const progressSection: ReportSection = {
        title: 'Progress Timeline',
        content: '✅ Agent created and initialized  \n✅ Context loaded and ready  \n🔄 Starting execution  \n',
        lastUpdated: new Date().toISOString()
      };
      await this.markdownWriter.updateReportSection(progressSection);
    }
  }

  /**
   * Record LLM call
   */
  async recordLLMCall(messageCount: number, availableTools: string[]): Promise<void> {
    this.stats.llmCalls++;
    
    await this.recordEvent('llmCall', {
      agentId: this.agentId,
      messageCount,
      availableTools,
      callNumber: this.stats.llmCalls
    });

    // Update execution summary
    await this.updateExecutionSummary();
  }

  /**
   * Record message exchange
   */
  async recordMessage(message: LLMMessage): Promise<void> {
    if (!this.markdownWriter) return;

    this.stats.messagesCount++;

    const entry: ConversationEntry = {
      timestamp: new Date().toISOString(),
      role: message.role,
      content: message.content,
      toolCallId: message.tool_call_id,
      toolCalls: message.tool_calls
    };

    await this.markdownWriter.appendConversation(entry);
    await this.updateExecutionSummary();
  }

  /**
   * Record tool usage
   */
  async recordToolCalls(toolCalls: ToolCall[]): Promise<void> {
    const toolNames = toolCalls.map(tc => tc.function.name);
    toolNames.forEach(name => this.stats.toolsUsed.add(name));

    await this.recordEvent('toolCalls', {
      agentId: this.agentId,
      toolCalls: toolNames
    });

    // Record each tool call as a message
    for (const toolCall of toolCalls) {
      const entry: ConversationEntry = {
        timestamp: new Date().toISOString(),
        role: 'tool_call',
        content: `${toolCall.function.name}(${toolCall.function.arguments})`
      };
      
      if (this.markdownWriter) {
        await this.markdownWriter.appendConversation(entry);
      }
    }

    await this.updateExecutionSummary();
  }

  /**
   * Record child agent creation
   */
  async recordChildCreated(childData: any): Promise<string> {
    this.stats.childrenCreated++;

    await this.recordEvent('childCreated', childData);

    // Return child output path for the child agent
    if (this.paths) {
      return this.paths.rootFolder;
    }
    return this.config.outputFolder || '.agentree';
  }

  /**
   * Record agent completion
   */
  async recordCompletion(result: any): Promise<void> {
    this.metadata.status = result.success ? 'completed' : 'error';
    this.metadata.endTime = new Date().toISOString();

    await this.recordEvent('agentCompleted', {
      agentId: this.agentId,
      name: this.agentName,
      result: result,
      executionTime: result.executionTime,
      success: result.success
    });

    // Finalize report
    if (this.markdownWriter) {
      await this.markdownWriter.finalizeReport(this.metadata, result);
    }

    if (this.jsonWriter) {
      await this.jsonWriter.writeMetadata(this.metadata);
    }

    const outputPath = this.paths?.rootFolder || 'unknown';
    console.log(`📊 Agent completed. Full report: ${outputPath}/agent-report.md`);
  }

  /**
   * Record error
   */
  async recordError(error: Error): Promise<void> {
    this.metadata.status = 'error';
    this.metadata.endTime = new Date().toISOString();

    await this.recordEvent('agentError', {
      agentId: this.agentId,
      name: this.agentName,
      error: error.message,
      stack: error.stack
    });

    if (this.jsonWriter) {
      await this.jsonWriter.writeMetadata(this.metadata);
    }
  }

  /**
   * Update execution summary in report
   */
  private async updateExecutionSummary(): Promise<void> {
    if (!this.markdownWriter) return;

    const summarySection: ReportSection = {
      title: 'Execution Summary',
      content: `- **Messages Exchanged:** ${this.stats.messagesCount}
- **LLM Calls:** ${this.stats.llmCalls}
- **Tools Used:** ${Array.from(this.stats.toolsUsed).join(', ') || 'None'}
- **Child Agents Created:** ${this.stats.childrenCreated}
- **Current Status:** ${this.metadata.status === 'running' ? 'Processing' : this.metadata.status}`,
      lastUpdated: new Date().toISOString()
    };

    await this.markdownWriter.updateReportSection(summarySection);
  }

  /**
   * Get output folder path for child agents
   */
  getOutputPath(): string {
    return this.paths?.rootFolder || this.config.outputFolder || '.agentree';
  }
}
