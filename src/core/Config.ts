import { AgentTreeConfig } from '../types';

export class Config {
  private static defaultConfig: AgentTreeConfig = {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    maxDepth: 5,
    outputFile: true,
    outputFolder: '.agentree',
    streaming: false
  };

  public static merge(userConfig?: Partial<AgentTreeConfig>): AgentTreeConfig {
    return {
      ...this.defaultConfig,
      ...userConfig
    };
  }

  public static validate(config: AgentTreeConfig): void {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    if (config.maxDepth && (config.maxDepth < 1 || config.maxDepth > 10)) {
      throw new Error('maxDepth must be between 1 and 10');
    }

    if (!config.model) {
      throw new Error('Model is required');
    }
  }

  public static getDefault(): AgentTreeConfig {
    return { ...this.defaultConfig };
  }
}
