import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { 
  AgentConfig, 
  AgentResult, 
  LLMMessage, 
  ToolCall,
  ToolMetadata,
  Tool 
} from '../types';
import { 
  AgentEvents, 
  EventDataBuilder,
  ToolCallDetail,
  ToolCallStartedEventData,
  ToolCallCompletedEventData,
  StreamChunkEventData
} from '../types/events';
import { Task } from './Task';
import { LLMClient } from '../llm/LLMClient';
import { OpenAIClient } from '../llm/OpenAIClient';
import { ToolRegistry } from '../tools/ToolRegistry';
import { CreateAgentParams, createAgentMetadata } from '../tools/builtins/createAgent';
import { StopAgentParams, stopAgentMetadata } from '../tools/builtins/stopAgent';
import { StreamingOutputManager } from '../output/StreamingOutputManager';

// Interface typée pour EventEmitter
interface TypedEventEmitter {
  on<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this;
  emit<K extends keyof AgentEvents>(event: K, ...args: Parameters<AgentEvents[K]>): boolean;
  off<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this;
  once<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this;
}

export class Agent extends EventEmitter implements TypedEventEmitter {
  private readonly id: string;
  private readonly task: Task;
  private readonly tools: Tool[];
  private readonly toolNames: string[];
  private readonly llmClient: LLMClient;
  private readonly parentId?: string;
  private readonly depth: number;
  private readonly maxDepth: number;
  
  // Configuration parameters (formerly in AgentTreeConfig)
  private readonly baseUrl: string;
  private readonly _model: string;
  private readonly apiKey: string;
  private readonly outputFile: boolean;
  private readonly outputFolder: string;
  private readonly streaming: boolean;
  
  private messages: LLMMessage[] = [];
  private children: Agent[] = [];
  private isCompleted: boolean = false;
  private result?: AgentResult;
  
  // Streaming output manager
  private outputManager?: StreamingOutputManager;

  constructor(agentConfig: AgentConfig) {
    super();
    this.id = uuidv4();
    
    // Initialize configuration parameters with defaults
    this.baseUrl = agentConfig.baseUrl || 'https://api.openai.com/v1';
    this._model = agentConfig.model || 'gpt-4';
    this.apiKey = agentConfig.apiKey || '';
    this.outputFile = agentConfig.outputFile ?? true;
    this.outputFolder = agentConfig.outputFolder || '.agentree';
    this.streaming = agentConfig.streaming || false;
    
    // Validate required parameters
    if (!this.apiKey) {
      throw new Error('API key is required');
    }
    if (!this._model) {
      throw new Error('Model is required');
    }
    
    this.task = new Task(
      agentConfig.name,
      agentConfig.task,
      agentConfig.context,
      agentConfig.systemPrompt
    );
    
    // Handle both Tool[] and string[] for tools
    const configTools = agentConfig.tools || [];
    if (configTools.length > 0 && typeof configTools[0] === 'string') {
      // Tools provided as string names - resolve from registry
      this.toolNames = configTools as string[];
      this.tools = this.toolNames
        .map(name => ToolRegistry.get(name))
        .filter((tool): tool is Tool => tool !== undefined);
    } else {
      // Tools provided as Tool objects
      this.tools = configTools as Tool[];
      this.toolNames = this.tools.map(tool => tool.name);
      // Register tools in the registry for child agents
      this.tools.forEach(tool => ToolRegistry.register(tool));
    }
    
    this.parentId = agentConfig.parentId;
    this.depth = agentConfig.depth || 0;
    this.maxDepth = agentConfig.maxDepth ?? 5;
    
    // Validate maxDepth
    if (this.maxDepth < 1 || this.maxDepth > 10) {
      throw new Error('maxDepth must be between 1 and 10');
    }
    
    // Create config object for LLM client
    const config = {
      baseUrl: this.baseUrl,
      model: this._model,
      apiKey: this.apiKey,
      outputFile: this.outputFile,
      outputFolder: this.outputFolder,
      streaming: this.streaming
    };
    
    
    // Initialize LLM client - for now only OpenAI
    this.llmClient = new OpenAIClient(config);
    
    // Initialize streaming output manager
    if (this.outputFile) {
      this.outputManager = new StreamingOutputManager(
        config,
        this.id,
        this.task.name,
        this.task.description,
        this.depth,
        this.parentId,
        agentConfig.parentPath // For child agents
      );
    }

    // Emit creation event
    this.emit('agentCreated', EventDataBuilder.createBaseEventData(this));
  }

  public async execute(): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      // Initialize output files
      if (this.outputManager) {
        await this.outputManager.initialize();
      }

      // Emit start event
      this.emit('agentStarted', EventDataBuilder.createBaseEventData(this));
      
      // Record start in output
      if (this.outputManager) {
        await this.outputManager.recordStart();
      }
      
      // Load context
      await this.task.loadContext();
      
      // Emit context loaded event
      this.emit('contextLoaded', EventDataBuilder.createContextLoadEventData(this, this.task.context));
      
      // Record context loading
      if (this.outputManager) {
        await this.outputManager.recordContextLoaded(this.task.context);
      }
      
      // Initialize conversation
      this.messages = [
        { role: 'system', content: this.task.getSystemPrompt() },
        { role: 'user', content: this.task.getUserPrompt() }
      ];

      // Record initial messages
      if (this.outputManager) {
        for (const message of this.messages) {
          await this.outputManager.recordMessage(message);
        }
      }
      // Main execution loop
      while (!this.isCompleted) {
        await this.executionStep();
      }
      
      const executionTime = Date.now() - startTime;
      
      if (!this.result) {
        throw new Error('Agent completed without setting result');
      }
      
      this.result.executionTime = executionTime;
      
      // Emit completion event
      this.emit('agentCompleted', EventDataBuilder.createResultEventData(this, this.result, executionTime));
      
      // Record completion in output
      if (this.outputManager) {
        await this.outputManager.recordCompletion(this.result);
      }
      
      return this.result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorResult = {
        success: false,
        result: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        agentName: this.task.name,
        timestamp: new Date().toISOString(),
        executionTime,
        children: this.children.map(child => child.result!).filter(Boolean)
      };

      // Emit error event
      if (error instanceof Error) {
        this.emit('agentError', EventDataBuilder.createErrorEventData(this, error));
        
        // Record error in output
        if (this.outputManager) {
          await this.outputManager.recordError(error);
        }
      }

      return errorResult;
    }
  }

  private async executionStep(): Promise<void> {
    // Get available tools
    const availableTools = this.getAvailableTools();
    
    // Emit LLM call event
    this.emit('llmCall', EventDataBuilder.createLLMCallEventData(
      this, 
      this.messages.length, 
      availableTools.map(t => t.name)
    ));
    
    // Record LLM call in output
    if (this.outputManager) {
      await this.outputManager.recordLLMCall(
        this.messages.length,
        availableTools.map(t => t.name)
      );
    }
    
    // Call LLM
    let response: any;
    if (this.streaming) {
      response = await this.handleStreamingLLMCall(availableTools);
    } else {
      response = await this.llmClient.chat(
        this.messages,
        availableTools,
        false
      );
    }
    
    // Add assistant response to messages
    const assistantMessage: LLMMessage = {
      role: 'assistant',
      content: response.content,
      ...(response.tool_calls && response.tool_calls.length > 0 ? { tool_calls: response.tool_calls } : {})
    };
    
    this.messages.push(assistantMessage);
    
    // Record assistant message in output immediately
    if (this.outputManager) {
      await this.outputManager.recordMessage(assistantMessage);
    }
    
    // Handle tool calls if any
    if (response.tool_calls && response.tool_calls.length > 0) {
      // Record tool calls in output
      if (this.outputManager) {
        await this.outputManager.recordToolCalls(response.tool_calls);
      }
      
      await this.handleToolCalls(response.tool_calls);
    } else if (response.content && response.content.trim()) {
      // If no tool calls but has content, assume completion
      await this.handleStopAgent({
        result: response.content,
        success: true
      });
    } else {
      // No tool calls and no meaningful content - this shouldn't happen in normal flow
      console.warn('⚠️  LLM response has no tool calls and no content. This may indicate a streaming issue.');
      await this.handleStopAgent({
        result: 'Task completed',
        success: true
      });
    }
  }

  private async handleToolCalls(toolCalls: ToolCall[]): Promise<void> {
    const toolDetails: ToolCallDetail[] = [];
    
    for (const toolCall of toolCalls) {
      const toolInput = JSON.parse(toolCall.function.arguments);
      
      // Emit tool call started event
      this.emit('toolCallStarted', EventDataBuilder.createToolCallStartedEventData(
        this,
        toolCall.function.name,
        toolInput,
        toolCall.id
      ));
      
      const startTime = Date.now();
      const toolDetail: ToolCallDetail = {
        name: toolCall.function.name,
        input: toolInput
      };
      
      let toolOutput: string | undefined;
      let toolError: string | undefined;
      
      try {
        const result = await this.executeToolCall(toolCall);
        const duration = Date.now() - startTime;
        
        toolOutput = typeof result === 'string' ? result : JSON.stringify(result);
        toolDetail.output = toolOutput;
        toolDetail.duration = duration;
        
        // Emit tool call completed event
        this.emit('toolCallCompleted', EventDataBuilder.createToolCallCompletedEventData(
          this,
          toolCall.function.name,
          toolInput,
          toolOutput,
          undefined,
          duration,
          toolCall.id
        ));
        
        const toolMessage: LLMMessage = {
          role: 'tool',
          content: JSON.stringify(result),
          tool_call_id: toolCall.id
        };
        
        this.messages.push(toolMessage);
        
        // Record tool result in output immediately
        if (this.outputManager) {
          await this.outputManager.recordMessage(toolMessage);
        }
        
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        toolError = errorMsg;
        toolDetail.error = errorMsg;
        toolDetail.duration = duration;
        
        // Emit tool call completed event with error
        this.emit('toolCallCompleted', EventDataBuilder.createToolCallCompletedEventData(
          this,
          toolCall.function.name,
          toolInput,
          undefined,
          errorMsg,
          duration,
          toolCall.id
        ));
        
        const errorMessage: LLMMessage = {
          role: 'tool',
          content: JSON.stringify({
            error: errorMsg
          }),
          tool_call_id: toolCall.id
        };
        
        this.messages.push(errorMessage);
        
        // Record tool error in output
        if (this.outputManager) {
          await this.outputManager.recordMessage(errorMessage);
        }
      }
      
      toolDetails.push(toolDetail);
    }
    
    // Emit detailed tool calls event (legacy)
    this.emit('toolCalls', EventDataBuilder.createToolCallEventData(
      this,
      toolCalls.map(tc => tc.function.name),
      toolDetails
    ));
  }

  private async executeToolCall(toolCall: ToolCall): Promise<any> {
    const { name, arguments: argsString } = toolCall.function;
    const args = JSON.parse(argsString);
    
    // Handle builtin tools
    if (name === 'createAgent') {
      return await this.handleCreateAgent(args);
    } else if (name === 'stopAgent') {
      return await this.handleStopAgent(args);
    }
    
    // Handle user tools
    const tool = this.tools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    
    return await tool.execute(args);
  }

  private async handleCreateAgent(params: CreateAgentParams): Promise<string> {
    if (this.depth >= this.maxDepth) {
      throw new Error(`Maximum depth ${this.maxDepth} reached`);
    }
    if (!params.tools || !Array.isArray(params.tools) || params.tools.length === 0) {
      throw new Error('The "tools" field is required and must be a non-empty array.');
    }
    
    // Clean tool names - remove invalid prefixes
    const cleanedTools = params.tools.map(toolName => {
      // Remove common invalid prefixes
      if (toolName.startsWith('functions.')) {
        return toolName.replace('functions.', '');
      }
      if (toolName.startsWith('tools.')) {
        return toolName.replace('tools.', '');
      }
      return toolName;
    });
    
    // Get parent output path for child
    const parentPath = this.outputManager?.getOutputPath();

    const childAgent = new Agent({
      name: params.name,
      task: params.task,
      context: params.context,
      tools: cleanedTools,
      // Pass parent configuration to child
      baseUrl: this.baseUrl,
      model: this._model,
      apiKey: this.apiKey,
      outputFile: this.outputFile,
      outputFolder: this.outputFolder,
      streaming: this.streaming,
      maxDepth: this.maxDepth,
      parentId: this.id,
      depth: this.depth + 1,
      parentPath: parentPath, // Pass parent path for child output
      systemPrompt: params.systemPrompt // Permet au parent de transmettre un prompt custom
    });

    // Forward child events to parent with 'child' prefix
    this.forwardChildEvents(childAgent);
    
    this.children.push(childAgent);
    
    // Emit child creation event
    this.emit('childCreated', EventDataBuilder.createChildAgentEventData(this, childAgent));
    
    // Record child creation in output
    if (this.outputManager) {
      await this.outputManager.recordChildCreated({
        parentId: this.id,
        parentName: this.task.name,
        childId: childAgent.agentId,
        childName: params.name,
        childTask: params.task
      });
    }
    
    const childResult = await childAgent.execute();
    
    return `Child agent "${params.name}" completed with result: ${childResult.result}`;
  }

  private async handleStreamingLLMCall(availableTools: ToolMetadata[]): Promise<any> {
    let accumulatedContent = '';
    const toolCallsMap = new Map<string, any>();
    const indexToIdMap = new Map<number, string>(); // Track index to ID mapping
    let hasReceivedData = false;
    let chunkCount = 0;
    
    for await (const chunk of this.llmClient.chatStream(this.messages, availableTools)) {
      chunkCount++;
      
      if (chunk.content) {
        accumulatedContent += chunk.content;
        hasReceivedData = true;
      }
      
      // Handle tool calls - they come fragmented in streaming
      if (chunk.tool_calls && chunk.tool_calls.length > 0) {
        hasReceivedData = true;
        for (const partialToolCall of chunk.tool_calls) {
          const index = (partialToolCall as any).index;
          
          // If we have an ID, map the index to the ID for future chunks
          if (partialToolCall.id && index !== undefined) {
            indexToIdMap.set(index, partialToolCall.id);
          }
          
          // Use existing ID mapping if available, otherwise use the provided ID or fallback to index
          const callKey = (index !== undefined && indexToIdMap.has(index)) 
            ? indexToIdMap.get(index)! 
            : (partialToolCall.id || `index_${index !== undefined ? index : 0}`);
          
          const existingCall = toolCallsMap.get(callKey) || {
            id: callKey,
            type: 'function',
            function: { name: '', arguments: '' }
          };
          
          // Accumulate function name and arguments
          if (partialToolCall.function?.name) {
            existingCall.function.name += partialToolCall.function.name;
          }
          if (partialToolCall.function?.arguments) {
            existingCall.function.arguments += partialToolCall.function.arguments;
          }
          
          toolCallsMap.set(callKey, existingCall);
        }
      }
      
      // Emit stream chunk event
      this.emit('streamChunk', EventDataBuilder.createStreamChunkEventData(
        this,
        chunk,
        accumulatedContent
      ));
      
      if (chunk.done) {
        break;
      }
      
    }
    
    // Convert accumulated tool calls to final format
    const finalToolCalls = Array.from(toolCallsMap.values())
      .filter(tc => tc.id && tc.function?.name && tc.function?.arguments)
      .map(tc => {
        try {
          // Validate that arguments are valid JSON
          JSON.parse(tc.function.arguments);
          return tc;
        } catch (error) {
          console.warn(`Invalid JSON in tool call arguments for ${tc.function.name}:`, tc.function.arguments);
          return null;
        }
      })
      .filter(tc => tc !== null);
    
    
    return {
      content: accumulatedContent,
      tool_calls: finalToolCalls
    };
  }

  private forwardChildEvents(childAgent: Agent): void {
    // Forward all child events to parent for complete visibility
    childAgent.on('agentStarted', (data) => this.emit('agentStarted', data));
    childAgent.on('agentCompleted', (data) => this.emit('agentCompleted', data));
    childAgent.on('agentError', (data) => this.emit('agentError', data));
    childAgent.on('childCreated', (data) => this.emit('childCreated', data));
    childAgent.on('contextLoaded', (data) => this.emit('contextLoaded', data));
    childAgent.on('llmCall', (data) => this.emit('llmCall', data));
    childAgent.on('toolCallStarted', (data) => this.emit('toolCallStarted', data));
    childAgent.on('toolCallCompleted', (data) => this.emit('toolCallCompleted', data));
    childAgent.on('toolCalls', (data) => this.emit('toolCalls', data));
    childAgent.on('streamChunk', (data) => this.emit('streamChunk', data));
  }

  private async handleStopAgent(params: StopAgentParams): Promise<string> {
    this.isCompleted = true;
    this.result = {
      success: params.success ?? true,
      result: params.result,
      agentName: this.task.name,
      timestamp: new Date().toISOString(),
      executionTime: 0, // Will be set by execute()
      children: this.children.map(child => child.result!).filter(Boolean)
    };
    
    return 'Agent execution completed';
  }

  private getAvailableTools(): ToolMetadata[] {
    const tools: ToolMetadata[] = [];
    
    // Add builtin tools (except for max depth agents)
    if (this.depth < this.maxDepth) {
      tools.push(createAgentMetadata);
    }
    
    tools.push(stopAgentMetadata);
    
    // Add user-specified tools
    for (const tool of this.tools) {
      tools.push({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      });
    }
    
    return tools;
  }


  // Getters pour inspection
  public get agentId(): string { return this.id; }
  public get agentName(): string { return this.task.name; }
  public get agentDepth(): number { return this.depth; }
  public get agentChildren(): Agent[] { return this.children; }
  public get model(): string { return this._model; }

  // Méthodes typées pour EventEmitter
  public on<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this {
    return super.on(event, listener);
  }

  public emit<K extends keyof AgentEvents>(event: K, ...args: Parameters<AgentEvents[K]>): boolean {
    return super.emit(event, ...args);
  }

  public off<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this {
    return super.off(event, listener);
  }

  public once<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this {
    return super.once(event, listener);
  }
}
