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

export interface ExecutionEvent {
  timestamp: string;
  event: string;
  agentId: string;
  agentName: string;
  depth: number;
  data?: any;
}

export interface ConversationMessage {
  timestamp: string;
  role: 'system' | 'user' | 'assistant' | 'tool' | 'tool_call';
  content: string;
  length: number;
}

export interface RunMetrics {
  totalEvents: number;
  totalMessages: number;
  llmCalls: number;
  toolCalls: number;
  childrenCreated: number;
  errors: number;
  averageMessageLength: number;
  totalTokensApprox: number;
  timeline: {
    start: string | null;
    end: string | null;
    duration: number;
    phases: Array<{
      timestamp: string;
      event: string;
      relativeTime: number;
    }>;
  };
  tools: string[];
  conversationStats: {
    roleDistribution: Record<string, number>;
    longestMessage: number;
    shortestMessage: number;
    totalCharacters: number;
  };
}

export interface RunData {
  id: string;
  path: string;
  metadata: AgentMetadata;
  events: ExecutionEvent[];
  conversation: ConversationMessage[];
  children: RunData[];
  metrics: RunMetrics;
}

export interface RunListItem {
  id: string;
  agentName: string;
  path: string;
  startTime: string;
  endTime?: string;
  duration: number;
  status: string;
  size: number;
  depth: number;
  hasChildren: boolean;
}

export interface RunSummary {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  runningRuns: number;
  totalDuration: number;
  averageDuration: number;
  totalSize: number;
  uniqueAgents: number;
  hasHierarchy: boolean;
  recentRuns: RunListItem[];
  oldestRun: RunListItem | null;
  newestRun: RunListItem | null;
  trends: {
    runsLast24h: number;
    runsLast7d: number;
    averageDurationLast7d: number;
    successRateLast7d: number;
  };
}