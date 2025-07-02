import { readFileTool } from './readFile';
import { writeFileTool } from './writeFile';
import { searchTool } from './searchTool';
import { replaceFileTool } from './replaceFile';
import { bashTool } from './bashTool';

export { readFileTool } from './readFile';
export { writeFileTool } from './writeFile';
export { searchTool } from './searchTool';
export { replaceFileTool } from './replaceFile';
export { bashTool } from './bashTool';

export const defaultTools = [
  readFileTool,
  writeFileTool,
  searchTool,
  replaceFileTool,
  bashTool
];