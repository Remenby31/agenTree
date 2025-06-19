import * as ts from 'typescript';

// Basic transformer placeholder - will be enhanced later for JSDoc extraction
export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      // For now, just return the source file unchanged
      // Later this will extract JSDoc comments and generate tool metadata
      return sourceFile;
    };
  };
}
