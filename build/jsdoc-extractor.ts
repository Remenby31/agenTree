// Extraction JSDoc TypeScript – API TypeScript uniquement

import * as ts from "typescript";

/**
 * Interface représentant les informations extraites d’un commentaire JSDoc.
 */
export interface JSDocInfo {
  description: string;
  paramDescriptions: Map<string, string>;
  returnDescription: string;
  examples: string[];
  deprecated: boolean;
  since: string | null;
}

/**
 * Classe utilitaire pour extraire et parser les commentaires JSDoc d’une fonction.
 */
export class JSDocExtractor {
  /**
   * Extrait les informations JSDoc d’une déclaration de fonction.
   */
  extractFromFunction(node: ts.FunctionDeclaration): JSDocInfo {
    // Correction : accès via getJSDocCommentsAndTags
    const jsdocs = (ts as any).getJSDocCommentsAndTags
      ? (ts as any).getJSDocCommentsAndTags(node)
      : (ts as any).getJSDocTags(node);
    const jsdoc = jsdocs && jsdocs.length > 0 && jsdocs[0].kind === ts.SyntaxKind.JSDoc
      ? jsdocs[0] as ts.JSDoc
      : undefined;
    if (!jsdoc) {
      return {
        description: "",
        paramDescriptions: new Map(),
        returnDescription: "",
        examples: [],
        deprecated: false,
        since: null,
      };
    }
    return this.parseJSDocComment(jsdoc);
  }

  /**
   * Parse un commentaire JSDoc et retourne les informations structurées.
   */
  parseJSDocComment(jsdoc: ts.JSDoc): JSDocInfo {
    const description = (jsdoc.comment && typeof jsdoc.comment === "string")
      ? jsdoc.comment
      : "";

    const tags = jsdoc.tags ? Array.from(jsdoc.tags) : [];
    const paramDescriptions = this.extractParamDescriptions(tags);

    let returnDescription = "";
    let examples: string[] = [];
    let deprecated = false;
    let since: string | null = null;

    for (const tag of tags) {
      switch (tag.tagName.escapedText) {
        case "returns":
        case "return":
          if ("comment" in tag && typeof tag.comment === "string") {
            returnDescription = tag.comment;
          }
          break;
        case "example":
          if ("comment" in tag && typeof tag.comment === "string") {
            examples.push(tag.comment);
          }
          break;
        case "deprecated":
          deprecated = true;
          break;
        case "since":
          if ("comment" in tag && typeof tag.comment === "string") {
            since = tag.comment;
          }
          break;
        // Les tags @throws sont ignorés ici (non demandés dans l’interface)
      }
    }

    return {
      description,
      paramDescriptions,
      returnDescription,
      examples,
      deprecated,
      since,
    };
  }

  /**
   * Extrait les descriptions des paramètres à partir des tags JSDoc.
   */
  extractParamDescriptions(tags: ts.JSDocTag[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const tag of tags) {
      if (
        tag.tagName.escapedText === "param" &&
        "name" in tag &&
        tag.name &&
        typeof tag.name === "object" &&
        "escapedText" in tag.name
      ) {
        const paramName = (tag.name as ts.Identifier).escapedText.toString();
        const desc = "comment" in tag && typeof tag.comment === "string"
          ? tag.comment
          : "";
        map.set(paramName, desc);
      }
    }
    return map;
  }
}
/**
 * Utilitaire pour les tests : extrait le JSDoc d'une fonction à partir d'un code source string.
 */
export function extractJSDoc(source: string) {
  const ts = require("typescript");
  const fileName = "test.ts";
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let func: any = null;
  ts.forEachChild(sourceFile, (node: any) => {
    if (ts.isFunctionDeclaration(node)) func = node;
  });
  if (!func) throw new Error("Aucune fonction trouvée");
  const extractor = new JSDocExtractor();
  const info = extractor.extractFromFunction(func);

  // Associer types JSDoc aux paramètres
  // On récupère les tags JSDoc pour parser le type
  let jsdocTags: any[] = [];
  const jsdocs = (ts as any).getJSDocCommentsAndTags
    ? (ts as any).getJSDocCommentsAndTags(func)
    : (ts as any).getJSDocTags(func);
  if (jsdocs && jsdocs.length > 0 && jsdocs[0].kind === ts.SyntaxKind.JSDoc) {
    jsdocTags = jsdocs[0].tags ? Array.from(jsdocs[0].tags) : [];
  }

  function getTypeForParam(paramName: string) {
    for (const tag of jsdocTags) {
      if (
        tag.tagName.escapedText === "param" &&
        "name" in tag &&
        tag.name &&
        typeof tag.name === "object" &&
        "escapedText" in tag.name &&
        tag.name.escapedText.toString() === paramName
      ) {
        // Parse le type depuis le tag JSDoc
        if (tag.typeExpression && tag.typeExpression.type && tag.typeExpression.type.kind === ts.SyntaxKind.TypeReference) {
          return tag.typeExpression.type.typeName.escapedText || "any";
        }
        // Fallback: parser le texte brut {type}
        if (tag.typeExpression && tag.typeExpression.type) {
          const text = tag.typeExpression.getText ? tag.typeExpression.getText() : "";
          if (typeof text === "string" && text.startsWith("{") && text.endsWith("}")) {
            return text.slice(1, -1);
          }
        }
      }
    }
    return "any";
  }

  return {
    description: info.description,
    params: Array.from(info.paramDescriptions.entries()).map(([name, description]) => ({
      name,
      type: getTypeForParam(name),
      description
    })),
    returns: (() => {
      // Chercher le type de retour dans les tags JSDoc
      let returnType = "any";
      for (const tag of jsdocTags) {
        if (
          (tag.tagName.escapedText === "returns" || tag.tagName.escapedText === "return") &&
          tag.typeExpression &&
          tag.typeExpression.type &&
          tag.typeExpression.type.kind === ts.SyntaxKind.TypeReference
        ) {
          returnType = tag.typeExpression.type.typeName.escapedText || "any";
        }
        // Fallback: parser le texte brut {type}
        if (
          (tag.tagName.escapedText === "returns" || tag.tagName.escapedText === "return") &&
          tag.typeExpression &&
          tag.typeExpression.type
        ) {
          const text = tag.typeExpression.getText ? tag.typeExpression.getText() : "";
          if (typeof text === "string" && text.startsWith("{") && text.endsWith("}")) {
            returnType = text.slice(1, -1);
          }
        }
      }
      return info.returnDescription
        ? { type: returnType, description: info.returnDescription }
        : undefined;
    })()
  };
}
