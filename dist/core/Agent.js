"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const uuid_1 = require("uuid");
const Config_1 = require("./Config");
const Task_1 = require("./Task");
const OpenAIClient_1 = require("../llm/OpenAIClient");
const ToolRegistry_1 = require("../tools/ToolRegistry");
class Agent {
    constructor(agentConfig) {
        this.messages = [];
        this.children = [];
        this.isCompleted = false;
        this.id = (0, uuid_1.v4)();
        this.config = Config_1.Config.merge(agentConfig.config);
        Config_1.Config.validate(this.config);
        this.task = new Task_1.Task(agentConfig.name, agentConfig.task, agentConfig.context);
        this.tools = agentConfig.tools || [];
        this.parentId = agentConfig.parentId;
        this.depth = agentConfig.depth || 0;
        // Initialize LLM client - for now only OpenAI
        this.llmClient = new OpenAIClient_1.OpenAIClient(this.config);
        // Initialize builtin tools
        this.initializeBuiltinTools();
    }
    async execute() {
        const startTime = Date.now();
        try {
            // Load context
            await this.task.loadContext();
            // Initialize conversation
            this.messages = [
                { role: 'system', content: this.task.getSystemPrompt() },
                { role: 'user', content: this.task.getUserPrompt() }
            ];
            // Main execution loop
            while (!this.isCompleted) {
                await this.executionStep();
            }
            const executionTime = Date.now() - startTime;
            if (!this.result) {
                throw new Error('Agent completed without setting result');
            }
            this.result.executionTime = executionTime;
            return this.result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            return {
                success: false,
                result: '',
                error: error instanceof Error ? error.message : 'Unknown error',
                agentName: this.task.name,
                timestamp: new Date().toISOString(),
                executionTime,
                children: this.children.map(child => child.result).filter(Boolean)
            };
        }
    }
    async executionStep() {
        // Get available tools
        const availableTools = this.getAvailableTools();
        // Call LLM
        const response = await this.llmClient.chat(this.messages, availableTools, this.config.streaming);
        // Add assistant response to messages
        this.messages.push({
            role: 'assistant',
            content: response.content,
            tool_calls: response.tool_calls
        });
        // Handle tool calls if any
        if (response.tool_calls && response.tool_calls.length > 0) {
            await this.handleToolCalls(response.tool_calls);
        }
        else if (response.content.trim()) {
            // If no tool calls but has content, assume completion
            await this.handleStopAgent({
                result: response.content,
                success: true
            });
        }
    }
    async handleToolCalls(toolCalls) {
        for (const toolCall of toolCalls) {
            try {
                const result = await this.executeToolCall(toolCall);
                this.messages.push({
                    role: 'tool',
                    content: JSON.stringify(result),
                    tool_call_id: toolCall.id
                });
            }
            catch (error) {
                this.messages.push({
                    role: 'tool',
                    content: JSON.stringify({
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }),
                    tool_call_id: toolCall.id
                });
            }
        }
    }
    async executeToolCall(toolCall) {
        const { name, arguments: argsString } = toolCall.function;
        const args = JSON.parse(argsString);
        // Handle builtin tools
        if (name === 'createAgent') {
            return await this.handleCreateAgent(args);
        }
        else if (name === 'stopAgent') {
            return await this.handleStopAgent(args);
        }
        // Handle user tools
        const tool = ToolRegistry_1.ToolRegistry.get(name);
        if (!tool) {
            throw new Error(`Tool ${name} not found`);
        }
        return await tool(args);
    }
    async handleCreateAgent(params) {
        if (this.depth >= this.config.maxDepth) {
            throw new Error(`Maximum depth ${this.config.maxDepth} reached`);
        }
        const childAgent = new Agent({
            name: params.name,
            task: params.task,
            context: params.context,
            tools: params.tools,
            config: this.config,
            parentId: this.id,
            depth: this.depth + 1
        });
        this.children.push(childAgent);
        const childResult = await childAgent.execute();
        return `Child agent "${params.name}" completed with result: ${childResult.result}`;
    }
    async handleStopAgent(params) {
        this.isCompleted = true;
        this.result = {
            success: params.success ?? true,
            result: params.result,
            agentName: this.task.name,
            timestamp: new Date().toISOString(),
            executionTime: 0, // Will be set by execute()
            children: this.children.map(child => child.result).filter(Boolean)
        };
        return 'Agent execution completed';
    }
    getAvailableTools() {
        const tools = [];
        // Add builtin tools (except for max depth agents)
        if (this.depth < this.config.maxDepth) {
            const createAgentMeta = ToolRegistry_1.ToolRegistry.getMetadata('createAgent');
            if (createAgentMeta)
                tools.push(createAgentMeta);
        }
        const stopAgentMeta = ToolRegistry_1.ToolRegistry.getMetadata('stopAgent');
        if (stopAgentMeta)
            tools.push(stopAgentMeta);
        // Add user-specified tools
        for (const toolName of this.tools) {
            const metadata = ToolRegistry_1.ToolRegistry.getMetadata(toolName);
            if (metadata) {
                tools.push(metadata);
            }
        }
        return tools;
    }
    initializeBuiltinTools() {
        // Import builtin tools to trigger registration
        require('../tools/builtins/createAgent');
        require('../tools/builtins/stopAgent');
    }
}
exports.Agent = Agent;
//# sourceMappingURL=Agent.js.map