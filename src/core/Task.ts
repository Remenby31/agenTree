import { TaskContext } from '../types';
import { Context } from './Context';

import { TaskParams } from '../types';

export class Task {
  public readonly name: string;
  public readonly description: string;
  public readonly context: TaskContext;
  public readonly contextItems: string[];
  public readonly systemPrompt?: string;

  constructor(name: string, description: string, contextItems: string[] = [], systemPrompt?: string) {
    this.name = name;
    this.description = description;
    this.contextItems = contextItems;
    this.context = { files: {}, urls: {}, text: [] };
    this.systemPrompt = systemPrompt;
  }

  static fromParams(params: TaskParams): Task {
    return new Task(
      params.name,
      params.description,
      params.contextItems ?? [],
      params.systemPrompt
    );
  }

  public async loadContext(): Promise<void> {
    const loadedContext = await Context.loadContext(this.contextItems);
    Object.assign(this.context, loadedContext);
  }

  public getSystemPrompt(): string {
    if (this.systemPrompt) {
      return this.systemPrompt;
    }

    let prompt = `You are an AI agent named "${this.name}".

      Your task: ${this.description}

      You have access to tools that you can use to complete this task. You can:
      - Create child agents to handle subtasks using the "createAgent" tool
      - Stop execution and return results using the "stopAgent" tool

      When you need to break down a complex task, create child agents with specific roles and tasks.
      When you have completed your work, use the stopAgent tool to return your final result.`;

    // Add context if available
    const contextPrompt = Context.formatContextForPrompt(this.context);
    if (contextPrompt) {
      prompt += `\n${contextPrompt}`;
    }

    return prompt;
  }

  public getUserPrompt(): string {
    return `${this.description}`;
  }
}
