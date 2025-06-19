"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = transformer;
// Basic transformer placeholder - will be enhanced later for JSDoc extraction
function transformer(program) {
    return (context) => {
        return (sourceFile) => {
            // For now, just return the source file unchanged
            // Later this will extract JSDoc comments and generate tool metadata
            return sourceFile;
        };
    };
}
