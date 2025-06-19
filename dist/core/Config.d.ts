import { AgentTreeConfig } from '../types';
export declare class Config {
    private static defaultConfig;
    static merge(userConfig?: Partial<AgentTreeConfig>): AgentTreeConfig;
    static validate(config: AgentTreeConfig): void;
    static getDefault(): AgentTreeConfig;
}
//# sourceMappingURL=Config.d.ts.map