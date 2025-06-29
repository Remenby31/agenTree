// Analyseur de types TypeScript vers JSON Schema
import * as ts from "typescript";

export interface ParameterInfo {
  name: string;
  type: any;
  optional: boolean;
  defaultValue?: any;
  rest: boolean;
}

export interface FunctionInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType: any;
  async: boolean;
}

export class TypeAnalyzer {
  private checker: ts.TypeChecker;

  constructor(checker: ts.TypeChecker) {
    this.checker = checker;
  }

  analyzeFunctionDeclaration(node: ts.FunctionDeclaration): FunctionInfo {
    const name = node.name ? node.name.getText() : "";
    const async = !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword);
    const parameters = node.parameters.map(param => this.analyzeParameter(param));
    let signature: ts.Signature | undefined;
    try {
      signature = this.checker.getSignatureFromDeclaration(node);
    } catch {
      signature = undefined;
    }
    let returnType: any;
    if (signature) {
      try {
        returnType = this.typeToJsonSchema(this.checker.getReturnTypeOfSignature(signature));
      } catch {
        returnType = { type: "any" };
      }
    } else {
      returnType = { type: "any" };
    }
    return { name, parameters, returnType, async };
  }

  private analyzeParameter(param: ts.ParameterDeclaration): ParameterInfo {
    const name = param.name.getText();
    const optional = !!param.questionToken || !!param.initializer;
    const rest = !!param.dotDotDotToken;
    let type: any = { type: "any" };
    if (param.type) {
      const t = this.checker.getTypeFromTypeNode(param.type);
      type = this.typeToJsonSchema(t);
    }
    let defaultValue: any = undefined;
    if (param.initializer) {
      defaultValue = this.getLiteralValue(param.initializer);
    }
    return { name, type, optional, defaultValue, rest };
  }

  private typeToJsonSchema(type: ts.Type): any {
    if (type.flags & ts.TypeFlags.String) return { type: "string" };
    if (type.flags & ts.TypeFlags.Number) return { type: "number" };
    if (type.flags & ts.TypeFlags.Boolean) return { type: "boolean" };
    if (type.flags & ts.TypeFlags.BigInt) return { type: "integer" };
    if (type.flags & ts.TypeFlags.Null) return { type: "null" };
    if (type.flags & ts.TypeFlags.Undefined) return { type: "null" };
    if (type.flags & ts.TypeFlags.Any) return { type: "any" };
    if (type.flags & ts.TypeFlags.Unknown) return { type: "any" };
    if (type.flags & ts.TypeFlags.Void) return { type: "null" };
    if (type.isUnion()) {
      const types = type.types.map(t => this.typeToJsonSchema(t));
      return { anyOf: types };
    }
    if (type.isIntersection()) {
      const types = type.types.map(t => this.typeToJsonSchema(t));
      return { allOf: types };
    }
    if (type.getCallSignatures().length) {
      return { type: "function" };
    }
    if (type.getNumberIndexType() || type.getStringIndexType() || type.getProperties().length) {
      // Objet ou interface
      const props: Record<string, any> = {};
      for (const prop of type.getProperties()) {
        let decl = prop.valueDeclaration;
        if (!decl && prop.declarations && prop.declarations.length > 0) {
          decl = prop.declarations[0];
        }
        if (!decl) {
          props[prop.getName()] = { type: "any" };
        } else {
          const propType = this.checker.getTypeOfSymbolAtLocation(prop, decl);
          props[prop.getName()] = this.typeToJsonSchema(propType);
        }
      }
      return { type: "object", properties: props };
    }
    if (type.symbol && type.symbol.getName() === "Array") {
      const typeArgs = (type as ts.TypeReference).typeArguments;
      if (typeArgs && typeArgs.length === 1) {
        return { type: "array", items: this.typeToJsonSchema(typeArgs[0]) };
      }
      return { type: "array", items: { type: "any" } };
    }
    // Tuple
    if (
      (type as ts.TupleTypeReference).target &&
      ((type as ts.TupleTypeReference).target.objectFlags & ts.ObjectFlags.Tuple)
    ) {
      const tupleTypes = (type as ts.TupleTypeReference).typeArguments || [];
      return { type: "array", items: tupleTypes.map(t => this.typeToJsonSchema(t)) };
    }
    // Enum
    if (type.symbol && (type.symbol.flags & ts.SymbolFlags.Enum)) {
      const values = this.getEnumValues(type);
      return { enum: values };
    }
    return { type: "any" };
  }

  private getLiteralValue(expr: ts.Expression): any {
    if (ts.isLiteralExpression(expr)) return expr.text;
    if (ts.isPrefixUnaryExpression(expr) && ts.isNumericLiteral(expr.operand)) {
      return expr.operator === ts.SyntaxKind.MinusToken
        ? -Number(expr.operand.text)
        : Number(expr.operand.text);
    }
    if (expr.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (expr.kind === ts.SyntaxKind.FalseKeyword) return false;
    return undefined;
  }

  private getEnumValues(type: ts.Type): any[] {
    if (!type.symbol || !type.symbol.declarations) return [];
    const decl = type.symbol.declarations[0];
    if (!ts.isEnumDeclaration(decl)) return [];
    return decl.members.map(m => m.name.getText());
  }
}
/**
 * Utilitaire pour les tests : analyse les types d'une fonction à partir d'un code source string.
 */
export function analyzeFunctionTypes(source: string) {
  const ts = require("typescript");
  const fileName = "test.ts";
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let func: any = null;
  ts.forEachChild(sourceFile, (node: any) => {
    if (ts.isFunctionDeclaration(node)) func = node;
  });
  if (!func) throw new Error("Aucune fonction trouvée");

  // Crée un CompilerHost virtuel pour injecter le sourceFile en mémoire
  const compilerHost = ts.createCompilerHost({});
  compilerHost.getSourceFile = (fileNameArg: string) => {
    if (fileNameArg === fileName) return sourceFile;
    return undefined;
  };
  compilerHost.readFile = (fileNameArg: string) => {
    if (fileNameArg === fileName) return source;
    return undefined;
  };
  compilerHost.fileExists = (fileNameArg: string) => fileNameArg === fileName;

  const program = ts.createProgram([fileName], {}, compilerHost);
  const checker = program.getTypeChecker();
  const analyzer = new TypeAnalyzer(checker);
  const info = analyzer.analyzeFunctionDeclaration(func);
  // Adapter le format pour le test
  return {
    params: info.parameters.map(p => ({ name: p.name, type: typeof p.type === "string" ? p.type : (p.type?.type || "any") })),
    returns: typeof info.returnType === "string" ? info.returnType : (info.returnType?.type || "any")
  };
}
