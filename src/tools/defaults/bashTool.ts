import { z } from 'zod';
import { tool } from '../ToolHelper';
import { exec } from 'child_process';

const bashToolSchema = z.object({
  command: z.string().describe("The bash command to execute"),
  timeout: z.number().optional().default(10000).describe("Timeout in milliseconds (default: 10000)"),
});

export const bashTool = tool({
  name: 'bash',
  description: 'Executes a specified bash command with a configurable timeout. The command is run in a child process, and the output is returned. If an error occurs during execution, the error message along with any stderr output is returned.',
  parameters: bashToolSchema,
  execute: async (args) => {
    const { command, timeout } = args;
    return new Promise((resolve, reject) => {
      const proc = exec(command, { timeout }, (error, stdout, stderr) => {
        if (error) {
          resolve(`Error: ${error.message}\n${stderr}`);
        } else {
          resolve(stdout || stderr);
        }
      });
    });
  }
});