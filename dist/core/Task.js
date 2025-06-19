"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const Context_1 = require("./Context");
class Task {
    constructor(name, description, contextItems = []) {
        this.name = name;
        this.description = description;
        this.contextItems = contextItems;
        this.context = { files: {}, urls: {}, text: [] };
    }
    async loadContext() {
        const loadedContext = await Context_1.Context.loadContext(this.contextItems);
        Object.assign(this.context, loadedContext);
    }
    getSystemPrompt() {
        let prompt = `You are an AI agent named "${this.name}".

Your task: ${this.description}

You have access to tools that you can use to complete this task. You can:
- Create child agents to handle subtasks using the "createAgent" tool
- Stop execution and return results using the "stopAgent" tool

When you need to break down a complex task, create child agents with specific roles and tasks.
When you have completed your work, use the stopAgent tool to return your final result.`;
        // Add context if available
        const contextPrompt = Context_1.Context.formatContextForPrompt(this.context);
        if (contextPrompt) {
            prompt += `\n${contextPrompt}`;
        }
        return prompt;
    }
    getUserPrompt() {
        return `Please complete the following task: ${this.description}`;
    }
}
exports.Task = Task;
//# sourceMappingURL=Task.js.map