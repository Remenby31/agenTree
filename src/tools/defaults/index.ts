// This module serves as an aggregator for various utility tools used in the project. 
// It imports several tools related to file operations and command execution and then exports them for use in other parts of the application.
//
// The following tools are included:
// - readFileTool: A tool for reading files.
// - writeFileTool: A tool for writing to files.
// - searchTool: A tool for searching content within files.
// - replaceFileTool: A tool for replacing content in files.
// - bashTool: A tool for executing bash commands.
// - listTreeTool: A tool for listing directory tree structures.
//
// The 'defaultTools' array consolidates all the imported tools, making it easier to manage and utilize them throughout the application.

import { readFileTool } from './readFile';
import { writeFileTool } from './writeFile';
import { searchTool } from './searchTool';
import { replaceFileTool } from './replaceFile';
import { bashTool } from './bashTool';
import { listTreeTool } from './listTree';

export { readFileTool } from './readFile';
export { writeFileTool } from './writeFile';
export { searchTool } from './searchTool';
export { replaceFileTool } from './replaceFile';
export { bashTool } from './bashTool';
export { listTreeTool } from './listTree';

export const defaultTools = [
  readFileTool,
  writeFileTool,
  searchTool,
  replaceFileTool,
  bashTool,
  listTreeTool
];
