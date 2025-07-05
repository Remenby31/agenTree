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
    
    let prompt = `Your task: ${this.description}

      You need to break down a complex task, create child agents with very specific roles, tasks and tools.
      When you have completed your work, use the stopAgent tool to return your final result.`;


    if (this.systemPrompt) {
      prompt = `${this.systemPrompt} 
      When you have completed your work, use the stopAgent tool to return your final result.`;
    }

    return prompt;
  }

  public getUserPrompt(): string {
    let user_prompt = `${this.description}`;
    if (this.context.files) {
      user_prompt += `\n\nFiles:\n${Object.keys(this.context.files).join('\n')}`;
    }
    if (this.context.urls) {
      user_prompt += `\n\nURLs:\n${Object.keys(this.context.urls).join('\n')}`;
    }
    if (this.context.text && this.context.text.length > 0) {
      user_prompt += `\n\nText:\n${this.context.text.join('\n')}`;
    }
    return user_prompt;
  }
}
