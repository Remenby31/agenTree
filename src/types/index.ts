export interface AgentConfig {
  // Paramètres publics de l'agent (pour l'utilisateur)
  name: string;
  task: string;
  context?: string[];
  tools?: Tool[] | string[];
  maxDepth?: number;          // Profondeur max de l'arbre (défaut: 5)
  systemPrompt?: string;      // Permet de surcharger le system prompt
  
  // Paramètres de configuration LLM (pour l'utilisateur)
  baseUrl?: string;           // URL du LLM (ex: https://api.openai.com)
  model?: string;             // Modèle à utiliser
  apiKey?: string;            // Clé API
  outputFile?: boolean;       // Activer/désactiver écriture fichiers (défaut: true)
  outputFolder?: string;      // Dossier de sortie (défaut: .agentree)
  streaming?: boolean;        // Mode streaming (défaut: false)
  
  // Paramètres internes (pour la création d'agents enfants)
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

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any, context?: any) => Promise<string> | string;
  errorFunction?: (context: any, error: Error) => string;
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

export interface TaskParams {
  name: string;
  description: string;
  contextItems?: string[];
  systemPrompt?: string;
}

export interface EventData {
  agentId: string;
  agentName: string;
  type: 'start' | 'tool_call' | 'llm_call' | 'child_created' | 'completed' | 'error';
  data?: any;
  timestamp: string;
}
