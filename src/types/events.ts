export interface AgentEventData {
  id: string;
  name: string;
  task: string;
  depth: number;
  parentId?: string;
  timestamp: string;
}

export interface AgentResultEventData extends AgentEventData {
  result: any;
  executionTime: number;
  success: boolean;
}

export interface AgentErrorEventData extends AgentEventData {
  error: string;
  stack?: string;
}

export interface LLMCallEventData extends AgentEventData {
  messageCount: number;
  availableTools: string[];
  model?: string;
}

export interface ToolCallEventData extends AgentEventData {
  toolCalls: string[];
  toolResults?: Record<string, any>;
}

export interface ContextLoadEventData extends AgentEventData {
  context: {
    fileCount: number;
    urlCount: number;
    textCount: number;
  };
}

export interface ChildAgentEventData extends AgentEventData {
  parentId: string;
  parentName: string;
  childId: string;
  childName: string;
  childTask: string;
}

// Map des événements pour TypeScript
export interface AgentEvents {
  // Événements de cycle de vie de l'agent
  'agentCreated': (data: AgentEventData) => void;
  'agentStarted': (data: AgentEventData) => void;
  'agentCompleted': (data: AgentResultEventData) => void;
  'agentError': (data: AgentErrorEventData) => void;

  // Événements d'exécution
  'contextLoaded': (data: ContextLoadEventData) => void;
  'llmCall': (data: LLMCallEventData) => void;
  'toolCalls': (data: ToolCallEventData) => void;

  // Événements d'agents enfants
  'childCreated': (data: ChildAgentEventData) => void;
  'childStarted': (data: AgentEventData) => void;
  'childCompleted': (data: AgentResultEventData) => void;
  'childError': (data: AgentErrorEventData) => void;
  'childLlmCall': (data: LLMCallEventData) => void;
  'childToolCalls': (data: ToolCallEventData) => void;
}

// Helper pour créer les données d'événement
export class EventDataBuilder {
  static createBaseEventData(agent: any): AgentEventData {
    return {
      id: agent.agentId,
      name: agent.agentName,
      task: agent.task.description,
      depth: agent.agentDepth,
      parentId: agent.parentId,
      timestamp: new Date().toISOString()
    };
  }

  static createResultEventData(agent: any, result: any, executionTime: number): AgentResultEventData {
    return {
      ...this.createBaseEventData(agent),
      result,
      executionTime,
      success: result.success ?? true
    };
  }

  static createErrorEventData(agent: any, error: Error): AgentErrorEventData {
    return {
      ...this.createBaseEventData(agent),
      error: error.message,
      stack: error.stack
    };
  }

  static createLLMCallEventData(agent: any, messageCount: number, availableTools: string[]): LLMCallEventData {
    return {
      ...this.createBaseEventData(agent),
      messageCount,
      availableTools,
      model: agent.config.model
    };
  }

  static createToolCallEventData(agent: any, toolCalls: string[]): ToolCallEventData {
    return {
      ...this.createBaseEventData(agent),
      toolCalls
    };
  }

  static createContextLoadEventData(agent: any, context: any): ContextLoadEventData {
    return {
      ...this.createBaseEventData(agent),
      context: {
        fileCount: Object.keys(context.files || {}).length,
        urlCount: Object.keys(context.urls || {}).length,
        textCount: (context.text || []).length
      }
    };
  }

  static createChildAgentEventData(parent: any, child: any): ChildAgentEventData {
    return {
      ...this.createBaseEventData(child),
      parentId: parent.agentId,
      parentName: parent.agentName,
      childId: child.agentId,
      childName: child.agentName,
      childTask: child.task.description
    };
  }
}