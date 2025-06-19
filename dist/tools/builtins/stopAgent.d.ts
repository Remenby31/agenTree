export interface StopAgentParams {
    result: string;
    success?: boolean;
}
/**
 * Stop the current agent execution and return the final result
 * @param result The final result to return to the parent agent
 * @param success Whether the task was completed successfully (default: true)
 */
export declare function stopAgent(params: StopAgentParams): Promise<string>;
//# sourceMappingURL=stopAgent.d.ts.map