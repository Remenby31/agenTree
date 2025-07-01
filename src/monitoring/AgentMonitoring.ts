import { Agent } from '../core/Agent';
import { 
  AgentEventData, 
  AgentResultEventData, 
  AgentErrorEventData,
  LLMCallEventData,
  ToolCallEventData,
  ContextLoadEventData,
  ChildAgentEventData
} from '../types/events';

export interface MonitoringOptions {
  logLevel?: 'silent' | 'basic' | 'detailed' | 'verbose';
  colors?: boolean;
  timestamps?: boolean;
  indentation?: boolean;
  saveToFile?: string;
  customLogger?: (level: string, message: string, data?: any) => void;
}

export class AgentMonitor {
  private options: Required<MonitoringOptions>;
  private startTime: number = Date.now();
  private agentTree: Map<string, { depth: number; name: string; parentId?: string }> = new Map();

  constructor(options: MonitoringOptions = {}) {
    this.options = {
      logLevel: 'detailed',
      colors: true,
      timestamps: true,
      indentation: true,
      saveToFile: '',
      customLogger: this.defaultLogger.bind(this),
      ...options
    };
  }

  public monitor(agent: Agent): void {
    if (this.options.logLevel === 'silent') return;

    // Agent lifecycle events
    agent.on('agentCreated', this.handleAgentCreated.bind(this));
    agent.on('agentStarted', this.handleAgentStarted.bind(this));
    agent.on('agentCompleted', this.handleAgentCompleted.bind(this));
    agent.on('agentError', this.handleAgentError.bind(this));

    // Execution events
    agent.on('contextLoaded', this.handleContextLoaded.bind(this));
    agent.on('llmCall', this.handleLLMCall.bind(this));
    agent.on('toolCalls', this.handleToolCalls.bind(this));

    // Child events (only unique childCreated event, others are filtered by depth/parentId)
    agent.on('childCreated', this.handleChildCreated.bind(this));
  }

  private handleAgentCreated(data: AgentEventData): void {
    this.agentTree.set(data.id, { 
      depth: data.depth, 
      name: data.name, 
      parentId: data.parentId 
    });

    if (data.depth === 0) {
      this.log('info', `🚀 Agent principal créé: ${data.name}`, data);
      this.log('info', `📋 Tâche: ${data.task}`, data);
    }
  }

  private handleAgentStarted(data: AgentEventData): void {
    if (data.depth === 0) {
      this.log('info', `▶️  Démarrage: ${data.name}`, data);
    } else if (this.options.logLevel === 'detailed' || this.options.logLevel === 'verbose') {
      this.log('info', `▶️  Enfant démarré: ${data.name}`, data);
    }
  }

  private handleAgentCompleted(data: AgentResultEventData): void {
    const duration = Date.now() - this.startTime;
    
    if (data.depth === 0) {
      this.log('success', `✅ Terminé: ${data.name} (${data.executionTime}ms)`, data);
    } else {
      this.log('success', `✅ Enfant terminé: ${data.name}`, data);
    }
    
    if (this.options.logLevel === 'detailed' || this.options.logLevel === 'verbose') {
      const preview = data.result.result?.substring(0, 100) || 'Pas de résultat';
      this.log('info', `📊 Résultat: ${preview}${preview.length >= 100 ? '...' : ''}`, data);
    }
  }

  private handleAgentError(data: AgentErrorEventData): void {
    if (data.depth === 0) {
      this.log('error', `❌ Erreur: ${data.name} - ${data.error}`, data);
    } else {
      this.log('error', `❌ Erreur enfant: ${data.name} - ${data.error}`, data);
    }
  }

  private handleContextLoaded(data: ContextLoadEventData): void {
    if (this.options.logLevel === 'detailed' || this.options.logLevel === 'verbose') {
      const { fileCount, urlCount, textCount } = data.context;
      if (fileCount + urlCount + textCount > 0) {
        this.log('info', `📁 Contexte: ${fileCount} fichiers, ${urlCount} URLs, ${textCount} textes`, data);
      }
    }
  }

  private handleLLMCall(data: LLMCallEventData): void {
    if (this.options.logLevel === 'detailed' || this.options.logLevel === 'verbose') {
      const prefix = data.depth > 0 ? 'Enfant ' : '';
      this.log('info', `🧠 ${prefix}LLM: ${data.messageCount} messages, ${data.availableTools.length} outils`, data);
      
      if (this.options.logLevel === 'verbose' && data.availableTools.length > 0) {
        this.log('debug', `   Outils: ${data.availableTools.join(', ')}`, data);
      }
    }
  }

  private handleToolCalls(data: ToolCallEventData): void {
    if (this.options.logLevel === 'basic' || this.options.logLevel === 'detailed' || this.options.logLevel === 'verbose') {
      const prefix = data.depth > 0 ? 'Enfant ' : '';
      this.log('info', `🔧 ${prefix}Outils: ${data.toolCalls.join(', ')}`, data);
    }
  }

  private handleChildCreated(data: ChildAgentEventData): void {
    this.agentTree.set(data.childId, { 
      depth: data.depth, 
      name: data.childName, 
      parentId: data.parentId 
    });

    this.log('info', `👶 Agent enfant: ${data.childName}`, data);
    
    if (this.options.logLevel === 'detailed' || this.options.logLevel === 'verbose') {
      this.log('debug', `   Tâche: ${data.childTask}`, data);
    }
  }

  private log(level: 'info' | 'success' | 'error' | 'debug', message: string, data?: any): void {
    const agentInfo = this.agentTree.get(data?.id);
    const depth = agentInfo?.depth || 0;
    
    const prefix = this.options.indentation ? '  '.repeat(depth) : '';
    const timestamp = this.options.timestamps ? `[${new Date().toLocaleTimeString()}] ` : '';
    const coloredMessage = this.options.colors ? this.colorize(message, level) : message;
    
    const finalMessage = `${timestamp}${prefix}${coloredMessage}`;
    
    this.options.customLogger(level, finalMessage, data);
  }

  private colorize(message: string, level: string): string {
    if (!this.options.colors) return message;
    
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      debug: '\x1b[90m'    // Gray
    };
    
    const color = colors[level as keyof typeof colors] || '';
    return `${color}${message}\x1b[0m`;
  }

  private defaultLogger(level: string, message: string, data?: any): void {
    console.log(message);
    
    // Save to file if configured
    if (this.options.saveToFile) {
      // Implementation would append to file
      // fs.appendFileSync(this.options.saveToFile, message + '\n');
    }
  }

  public getExecutionSummary(): any {
    const totalAgents = this.agentTree.size;
    const rootAgents = Array.from(this.agentTree.values()).filter(a => !a.parentId).length;
    const childAgents = totalAgents - rootAgents;
    const maxDepth = Math.max(...Array.from(this.agentTree.values()).map(a => a.depth));
    
    return {
      totalExecutionTime: Date.now() - this.startTime,
      totalAgents,
      rootAgents,
      childAgents,
      maxDepth,
      agentTree: Array.from(this.agentTree.entries()).map(([id, info]) => ({
        id,
        ...info
      }))
    };
  }
}