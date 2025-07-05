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

      IMPORTANT : At the beginning and between each step, make a short sentence of what you are doing, and what you need to do next. Dont use a tool without explaining what you are doing and why. (1 line max)
      When you have completed all your work, use the stopAgent tool to return your final result.`;


    if (this.systemPrompt) {
      prompt = `${this.systemPrompt} 
      IMPORTANT : At the beginning and between each step, make a short sentence of what you are doing, and what you need to do next. Dont use a tool without explaining what you are doing and why. (1 line max)
      When you have completed all your work, use the stopAgent tool to return your final result.`;
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
