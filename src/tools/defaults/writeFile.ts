import { z } from 'zod';
import { tool } from '../ToolHelper';
import * as fs from 'fs-extra';
import * as path from 'path';

const writeFileSchema = z.object({
  path: z.string().describe("Path of the file to create"),
  content: z.string().describe("Content to write into the file"),
  overwrite: z.boolean().optional().default(false).describe("Allow overwriting if the file exists"),
});

export const writeFileTool = tool({
  name: 'writeFile',
  description: 'Creates and writes a new file. If the file already exists and the agent has not read it, it returns an error unless overwrite=true',
  parameters: writeFileSchema,
  execute: async (args) => {
    const { path: filePath, content, overwrite } = args;
    if (await fs.pathExists(filePath) && !overwrite) {
      throw new Error(`File ${filePath} already exists. Use overwrite=true to overwrite it.`);
    }
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    return `File ${filePath} created successfully (${content.length} characters)`;
  },
  errorFunction: (context, error) => {
    return `Error writing file: ${error.message}`;
  }
});