import { z } from 'zod';
import { tool } from '../ToolHelper';
import * as fs from 'fs-extra';

const readFileSchema = z.object({
  path: z.string().describe("Path to the file to read").default('.'),
});

export const readFileTool = tool({
  name: 'readFile',
  description: 'Read the content of a file',
  parameters: readFileSchema,
  execute: async (args) => {
    const { path } = args;
    if (!await fs.pathExists(path)) {
      throw new Error(`File ${path} does not exist, run listTree tool to see available files.`);
    }
    const content = await fs.readFile(path, 'utf-8');
    return content;
  }
});