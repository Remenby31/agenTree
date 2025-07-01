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

export interface ToolCallDetail {
  name: string;
  input: any;
  output?: string;
  duration?: number;
  error?: string;
}

export interface ToolCallEventData extends AgentEventData {
  toolCalls: string[];
  toolDetails?: ToolCallDetail[];
}

export interface ToolCallStartedEventData extends AgentEventData {
  toolName: string;
  toolInput: any;
  toolCallId: string;
}

export interface ToolCallCompletedEventData extends AgentEventData {
  toolName: string;
  toolInput: any;
  toolOutput?: string;
  toolError?: string;
  duration: number;
  toolCallId: string;
}

export interface StreamChunkEventData extends AgentEventData {
  chunk: {
    content?: string;
    tool_calls?: any[];
    done: boolean;
  };
  accumulatedContent: string;
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
  'toolCallStarted': (data: ToolCallStartedEventData) => void;
  'toolCallCompleted': (data: ToolCallCompletedEventData) => void;
  'streamChunk': (data: StreamChunkEventData) => void;

  // Événements d'agents enfants
  'childCreated': (data: ChildAgentEventData) => void;
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

  static createToolCallEventData(agent: any, toolCalls: string[], toolDetails?: ToolCallDetail[]): ToolCallEventData {
    return {
      ...this.createBaseEventData(agent),
      toolCalls,
      toolDetails
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

  static createToolCallStartedEventData(agent: any, toolName: string, toolInput: any, toolCallId: string): ToolCallStartedEventData {
    return {
      ...this.createBaseEventData(agent),
      toolName,
      toolInput,
      toolCallId
    };
  }

  static createToolCallCompletedEventData(agent: any, toolName: string, toolInput: any, toolOutput: string | undefined, toolError: string | undefined, duration: number, toolCallId: string): ToolCallCompletedEventData {
    return {
      ...this.createBaseEventData(agent),
      toolName,
      toolInput,
      toolOutput,
      toolError,
      duration,
      toolCallId
    };
  }

  static createStreamChunkEventData(agent: any, chunk: any, accumulatedContent: string): StreamChunkEventData {
    return {
      ...this.createBaseEventData(agent),
      chunk,
      accumulatedContent
    };
  }
}