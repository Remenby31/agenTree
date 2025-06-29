import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { 
  AgentConfig, 
  AgentResult, 
  AgentTreeConfig, 
  LLMMessage, 
  ToolCall,
  ToolMetadata,
  ToolReference,
  ToolResolver,
  FlexibleAgentConfig
} from '../types';
import { 
  AgentEvents, 
  EventDataBuilder 
} from '../types/events';
import { Config } from './Config';
import { Task } from './Task';
import { LLMClient } from '../llm/LLMClient';
import { OpenAIClient } from '../llm/OpenAIClient';
import { ToolRegistry } from '../tools/ToolRegistry';
import { CreateAgentParams } from '../tools/builtins/createAgent';
import { StopAgentParams } from '../tools/builtins/stopAgent';
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
  private readonly config: AgentTreeConfig;
  private readonly task: Task;
  private readonly tools: string[];
  private readonly llmClient: LLMClient;
  private readonly parentId?: string;
  private readonly depth: number;
  
  private messages: LLMMessage[] = [];
  private children: Agent[] = [];
  private isCompleted: boolean = false;
  private result?: AgentResult;
  
  // Streaming output manager
  private outputManager?: StreamingOutputManager;

  constructor(agentConfig: FlexibleAgentConfig) {
    super();
    this.id = uuidv4();
    this.config = Config.merge(agentConfig.config);
    Config.validate(this.config);

    this.task = new Task(agentConfig.name, agentConfig.task, agentConfig.context);
    this.tools = agentConfig.tools ? ToolResolver.resolveTools(agentConfig.tools) : [];
    this.parentId = agentConfig.parentId;
    this.depth = agentConfig.depth || 0;
    
    // Initialize LLM client - for now only OpenAI
    this.llmClient = new OpenAIClient(this.config);
    
    // Initialize builtin tools
    this.initializeBuiltinTools();

    // Initialize streaming output manager
    if (this.config.outputFile) {
      this.outputManager = new StreamingOutputManager(
        this.config,
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
    const response = await this.llmClient.chat(
      this.messages,
      availableTools,
      this.config.streaming
    );
    
    // Add assistant response to messages
    const assistantMessage: LLMMessage = {
      role: 'assistant',
      content: response.content,
      tool_calls: response.tool_calls
    };
    
    this.messages.push(assistantMessage);
    
    // Record assistant message in output immediately
    if (this.outputManager) {
      await this.outputManager.recordMessage(assistantMessage);
    }
    
    // Handle tool calls if any
    if (response.tool_calls && response.tool_calls.length > 0) {
      // Emit tool calls event
      this.emit('toolCalls', EventDataBuilder.createToolCallEventData(
        this,
        response.tool_calls.map(tc => tc.function.name)
      ));
      
      // Record tool calls in output
      if (this.outputManager) {
        await this.outputManager.recordToolCalls(response.tool_calls);
      }
      
      await this.handleToolCalls(response.tool_calls);
    } else if (response.content.trim()) {
      // If no tool calls but has content, assume completion
      await this.handleStopAgent({
        result: response.content,
        success: true
      });
    }
  }

  private async handleToolCalls(toolCalls: ToolCall[]): Promise<void> {
    for (const toolCall of toolCalls) {
      try {
        const result = await this.executeToolCall(toolCall);
        
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
        const errorMessage: LLMMessage = {
          role: 'tool',
          content: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
          }),
          tool_call_id: toolCall.id
        };
        
        this.messages.push(errorMessage);
        
        // Record tool error in output
        if (this.outputManager) {
          await this.outputManager.recordMessage(errorMessage);
        }
      }
    }
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
    const tool = ToolRegistry.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    
    return await tool(args);
  }

  private async handleCreateAgent(params: CreateAgentParams): Promise<string> {
    if (this.depth >= this.config.maxDepth!) {
      throw new Error(`Maximum depth ${this.config.maxDepth} reached`);
    }
    
    // Get parent output path for child
    const parentPath = this.outputManager?.getOutputPath();
    
    const childAgent = new Agent({
      name: params.name,
      task: params.task,
      context: params.context,
      tools: params.tools,
      config: this.config,
      parentId: this.id,
      depth: this.depth + 1,
      parentPath: parentPath // Pass parent path for child output
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

  private forwardChildEvents(childAgent: Agent): void {
    // Forward lifecycle events
    childAgent.on('agentStarted', (data) => this.emit('childStarted', data));
    childAgent.on('agentCompleted', (data) => this.emit('childCompleted', data));
    childAgent.on('agentError', (data) => this.emit('childError', data));
    
    // Forward execution events
    childAgent.on('llmCall', (data) => this.emit('childLlmCall', data));
    childAgent.on('toolCalls', (data) => this.emit('childToolCalls', data));
    
    // Forward nested child events (recursive)
    childAgent.on('childCreated', (data) => this.emit('childCreated', data));
    childAgent.on('childStarted', (data) => this.emit('childStarted', data));
    childAgent.on('childCompleted', (data) => this.emit('childCompleted', data));
    childAgent.on('childError', (data) => this.emit('childError', data));
    childAgent.on('childLlmCall', (data) => this.emit('childLlmCall', data));
    childAgent.on('childToolCalls', (data) => this.emit('childToolCalls', data));
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
    if (this.depth < this.config.maxDepth!) {
      const createAgentMeta = ToolRegistry.getMetadata('createAgent');
      if (createAgentMeta) tools.push(createAgentMeta);
    }
    
    const stopAgentMeta = ToolRegistry.getMetadata('stopAgent');
    if (stopAgentMeta) tools.push(stopAgentMeta);
    
    // Add user-specified tools
    for (const toolName of this.tools) {
      const metadata = ToolRegistry.getMetadata(toolName);
      if (metadata) {
        tools.push(metadata);
      }
    }
    
    return tools;
  }

  private initializeBuiltinTools(): void {
    // Import builtin tools to trigger registration
    require('../tools/builtins/createAgent');
    require('../tools/builtins/stopAgent');
  }

  // Getters pour inspection
  public get agentId(): string { return this.id; }
  public get agentName(): string { return this.task.name; }
  public get agentDepth(): number { return this.depth; }
  public get agentChildren(): Agent[] { return this.children; }

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
