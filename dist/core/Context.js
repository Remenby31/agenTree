"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class Context {
    static async loadContext(contextItems) {
        const context = {
            files: {},
            urls: {},
            text: []
        };
        for (const item of contextItems) {
            if (this.isFilePath(item)) {
                try {
                    const content = await this.loadFile(item);
                    context.files[item] = content;
                }
                catch (error) {
                    console.warn(`Failed to load file ${item}:`, error);
                }
            }
            else if (this.isUrl(item)) {
                try {
                    const content = await this.fetchUrl(item);
                    context.urls[item] = content;
                }
                catch (error) {
                    console.warn(`Failed to fetch URL ${item}:`, error);
                }
            }
            else {
                // Treat as text
                context.text.push(item);
            }
        }
        return context;
    }
    static formatContextForPrompt(context) {
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
    static isFilePath(item) {
        // Check if it looks like a file path
        return item.startsWith('./') || item.startsWith('../') || item.startsWith('/') ||
            item.includes('.') && !item.includes(' ') && !item.startsWith('http');
    }
    static isUrl(item) {
        try {
            new URL(item);
            return true;
        }
        catch {
            return false;
        }
    }
    static async loadFile(filePath) {
        const resolvedPath = path.resolve(filePath);
        return await fs.readFile(resolvedPath, 'utf-8');
    }
    static async fetchUrl(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    }
}
exports.Context = Context;
//# sourceMappingURL=Context.js.map