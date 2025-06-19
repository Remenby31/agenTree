import * as fs from 'fs-extra';
import * as path from 'path';
import { TaskContext } from '../types';

export class Context {
  public static async loadContext(contextItems: string[]): Promise<TaskContext> {
    const context: TaskContext = {
      files: {},
      urls: {},
      text: []
    };

    for (const item of contextItems) {
      if (this.isFilePath(item)) {
        try {
          const content = await this.loadFile(item);
          context.files[item] = content;
        } catch (error) {
          console.warn(`Failed to load file ${item}:`, error);
        }
      } else if (this.isUrl(item)) {
        try {
          const content = await this.fetchUrl(item);
          context.urls[item] = content;
        } catch (error) {
          console.warn(`Failed to fetch URL ${item}:`, error);
        }
      } else {
        // Treat as text
        context.text.push(item);
      }
    }

    return context;
  }

  public static formatContextForPrompt(context: TaskContext): string {
    let prompt = '';

    // Add file contents
    if (Object.keys(context.files).length > 0) {
      prompt += '\n## Files:\n';
      for (const [filePath, content] of Object.entries(context.files)) {
        prompt += `\n### ${filePath}\n\`\`\`\n${content}\n\`\`\`\n`;
      }
    }

    // Add URL contents
    if (Object.keys(context.urls).length > 0) {
      prompt += '\n## URLs:\n';
      for (const [url, content] of Object.entries(context.urls)) {
        prompt += `\n### ${url}\n\`\`\`\n${content}\n\`\`\`\n`;
      }
    }

    // Add text context
    if (context.text.length > 0) {
      prompt += '\n## Context:\n';
      for (const text of context.text) {
        prompt += `\n${text}\n`;
      }
    }

    return prompt;
  }

  private static isFilePath(item: string): boolean {
    // Check if it looks like a file path
    return item.startsWith('./') || item.startsWith('../') || item.startsWith('/') || 
           item.includes('.') && !item.includes(' ') && !item.startsWith('http');
  }

  private static isUrl(item: string): boolean {
    try {
      new URL(item);
      return true;
    } catch {
      return false;
    }
  }

  private static async loadFile(filePath: string): Promise<string> {
    const resolvedPath = path.resolve(filePath);
    return await fs.readFile(resolvedPath, 'utf-8');
  }

  private static async fetchUrl(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  }
}
