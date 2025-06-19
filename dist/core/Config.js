"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
class Config {
    static merge(userConfig) {
        return {
            ...this.defaultConfig,
            ...userConfig
        };
    }
    static validate(config) {
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
    static getDefault() {
        return { ...this.defaultConfig };
    }
}
exports.Config = Config;
Config.defaultConfig = {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    maxDepth: 5,
    outputFile: true,
    outputFolder: '.agentree',
    streaming: false
};
//# sourceMappingURL=Config.js.map