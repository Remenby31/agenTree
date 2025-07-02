import { z } from 'zod';
import { tool } from '../ToolHelper';
import { exec } from 'child_process';

const bashToolSchema = z.object({
  command: z.string().describe("Commande bash à exécuter"),
  timeout: z.number().optional().default(10000).describe("Timeout en ms (défaut: 10000)"),
});

export const bashTool = tool({
  name: 'bash',
  description: 'Écrit et exécute une commande bash, avec timeout configurable',
  parameters: bashToolSchema,
  execute: async (args) => {
    const { command, timeout } = args;
    return new Promise((resolve, reject) => {
      const proc = exec(command, { timeout }, (error, stdout, stderr) => {
        if (error) {
          resolve(`Erreur: ${error.message}\n${stderr}`);
        } else {
          resolve(stdout || stderr);
        }
      });
    });
  }
});