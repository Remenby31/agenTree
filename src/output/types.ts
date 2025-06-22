export interface OutputPaths {
  rootFolder: string;
  agentReport: string;
  conversationLog: string;
  executionLog: string;
}

export interface ExecutionEvent {
  timestamp: string;
  event: string;
  agentId: string;
  agentName: string;
  depth: number;
  data?: any;
}

export interface AgentMetadata {
  id: string;
  name: string;
  task: string;
  depth: number;
  parentId?: string;
  startTime: string;
  endTime?: string;
  status: 'created' | 'running' | 'completed' | 'error';
}

export interface ConversationEntry {
  timestamp: string;
  role: 'system' | 'user' | 'assistant' | 'tool' | 'tool_call';
  content: string;
  toolCallId?: string;
  toolCalls?: any[];
}

export interface ReportSection {
  title: string;
  content: string;
  lastUpdated: string;
}

export interface StreamingOutputConfig {
  enabled: boolean;
  rootFolder: string;
  includeConversation: boolean;
  includeExecutionLog: boolean;
  updateFrequency: 'immediate' | 'buffered';
}