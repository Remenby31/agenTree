"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
class ToolRegistry {
    static register(name, func) {
        this.tools.set(name, func);
    }
    static get(name) {
        return this.tools.get(name);
    }
    static getMetadata(name) {
        const tool = this.tools.get(name);
        return tool?.__toolMetadata;
    }
    static getAllMetadata(toolNames) {
        const names = toolNames || Array.from(this.tools.keys());
        return names
            .map(name => this.getMetadata(name))
            .filter((metadata) => !!metadata);
    }
    static list() {
        return Array.from(this.tools.keys());
    }
    static clear() {
        this.tools.clear();
    }
    static has(name) {
        return this.tools.has(name);
    }
}
exports.ToolRegistry = ToolRegistry;
ToolRegistry.tools = new Map();
//# sourceMappingURL=ToolRegistry.js.map