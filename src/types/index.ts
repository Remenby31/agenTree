export interface AgentTreeConfig {
  baseUrl?: string;           // URL du LLM (ex: https://api.openai.com)
  model?: string;             // Modèle à utiliser
  maxDepth?: number;          // Profondeur max de l'arbre (défaut: 5)
  outputFile?: boolean;       // Activer/désactiver écriture fichiers (défaut: true)
  outputFolder?: string;      // Dossier de sortie (défaut: .agentree)
  apiKey?: string;           // Clé API
  streaming?: boolean;        // Mode streaming (défaut: false)
}

export interface AgentConfig {
  name: string;
  task: string;
  context?: string[];
  tools?: string[];
  config?: AgentTreeConfig;
  parentId?: string;
  depth?: number;
  parentPath?: string;
}

export interface AgentResult {
  success: boolean;
  result: string;
  error?: string;
  children?: AgentResult[];
  agentName: string;
  timestamp: string;
  executionTime: number;
}

export interface ToolMetadata {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolFunction {
  (...args: any[]): Promise<any> | any;
  __toolMetadata?: ToolMetadata;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface LLMResponse {
  content: string;
  tool_calls?: ToolCall[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMStreamChunk {
  content?: string;
  tool_calls?: Partial<ToolCall>[];
  done: boolean;
}

export interface TaskContext {
  files: Record<string, string>;
  urls: Record<string, string>;
  text: string[];
}

export interface EventData {
  agentId: string;
  agentName: string;
  type: 'start' | 'tool_call' | 'llm_call' | 'child_created' | 'completed' | 'error';
  data?: any;
  timestamp: string;
}

import type { ToolReference } from './enhanced-tools';
// Import du nouveau type
export { ToolReference, ToolResolver } from './enhanced-tools';

// Étendre AgentConfig pour supporter les deux formats
export interface FlexibleAgentConfig extends Omit<AgentConfig, 'tools'> {
  tools?: ToolReference[]; // ✅ Support strings ET fonctions
}
