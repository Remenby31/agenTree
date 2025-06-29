import * as ts from 'typescript';
import { TypeAnalyzer } from './type-analyzer';
import { JSDocExtractor } from './jsdoc-extractor';
import { MetadataGenerator } from './metadata-generator';

/**
 * Remplace le décorateur @tool par @tool({ ...metadata })
 */
function injectMetadataIntoDecorator(decorator: ts.Decorator, metadata: object): ts.Decorator {
  const factory = ts.factory;
  function valueToExpression(value: any): ts.Expression {
    if (typeof value === 'string') return factory.createStringLiteral(value);
    if (typeof value === 'number') return factory.createNumericLiteral(value);
    if (typeof value === 'boolean') return value ? factory.createTrue() : factory.createFalse();
    if (Array.isArray(value)) {
      return factory.createArrayLiteralExpression(value.map(valueToExpression));
    }
    if (value && typeof value === 'object') {
      return factory.createObjectLiteralExpression(
        Object.entries(value).map(([k, v]) =>
          factory.createPropertyAssignment(factory.createIdentifier(k), valueToExpression(v))
        ),
        false
      );
    }
    return factory.createNull();
  }
  return factory.createDecorator(
    factory.createCallExpression(
      (ts.isCallExpression(decorator.expression)
        ? decorator.expression.expression
        : decorator.expression
      ),
      undefined,
      [factory.createObjectLiteralExpression(
        Object.entries(metadata).map(([key, value]) =>
          factory.createPropertyAssignment(
            factory.createIdentifier(key),
            valueToExpression(value)
          )
        ),
        true
      )]
    )
  );
}

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    const checker = program.getTypeChecker();
    const typeAnalyzer = new TypeAnalyzer(checker);
    const jsdocExtractor = new JSDocExtractor();
    const metadataGenerator = new MetadataGenerator();

    function visit(node: ts.Node): ts.Node | ts.Node[] {
      // Détecte les fonctions décorées par @tool
      if (
        ts.isFunctionDeclaration(node)
      ) {
        // Extraction des infos
        const functionInfo = typeAnalyzer.analyzeFunctionDeclaration(node);
        const jsdocInfo = jsdocExtractor.extractFromFunction(node);
        const hasJSDoc = jsdocInfo && jsdocInfo.description && jsdocInfo.description.length > 0;
        // Récupère les décorateurs (compatibilité TS >= 4.8)
        const decorators = (ts.canHaveDecorators(node) && ts.getDecorators(node)) || [];
        const toolDecoratorIndex = decorators.findIndex(deco =>
          ts.isCallExpression(deco.expression)
            ? deco.expression.expression.getText() === 'tool'
            : deco.expression.getText() === 'tool'
        );
        const metadata = metadataGenerator.generateToolMetadata(functionInfo, jsdocInfo);

        // Injection du bloc metadata si JSDoc présent
        if (hasJSDoc) {
          // Création de la déclaration const metadata = {...}
          const metadataDecl = ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList(
              [
                ts.factory.createVariableDeclaration(
                  ts.factory.createIdentifier("metadata"),
                  undefined,
                  undefined,
                  (function valueToExpression(value: any): ts.Expression {
                    if (typeof value === 'string') return ts.factory.createStringLiteral(value);
                    if (typeof value === 'number') return ts.factory.createNumericLiteral(value);
                    if (typeof value === 'boolean') return value ? ts.factory.createTrue() : ts.factory.createFalse();
                    if (Array.isArray(value)) {
                      return ts.factory.createArrayLiteralExpression(value.map(valueToExpression));
                    }
                    if (value && typeof value === 'object') {
                      return ts.factory.createObjectLiteralExpression(
                        Object.entries(value).map(([k, v]) =>
                          ts.factory.createPropertyAssignment(ts.factory.createIdentifier(k), valueToExpression(v))
                        ),
                        false
                      );
                    }
                    return ts.factory.createNull();
                  })(metadata)
                )
              ],
              ts.NodeFlags.Const
            )
          );

          // Si décorateur @tool, injecte aussi dans le décorateur
          if (toolDecoratorIndex !== -1) {
            const toolDecorator = decorators[toolDecoratorIndex];
            const newDecorator = injectMetadataIntoDecorator(toolDecorator, metadata);
            const newDecorators = ts.factory.createNodeArray([
              ...decorators.slice(0, toolDecoratorIndex),
              newDecorator,
              ...decorators.slice(toolDecoratorIndex + 1)
            ]);
            return [
              metadataDecl,
              ts.factory.updateFunctionDeclaration(
                node,
                newDecorators,
                node.asteriskToken,
                node.name,
                node.typeParameters,
                node.parameters,
                node.type,
                node.body
              )
            ];
          } else {
            // Sinon, injecte juste le bloc metadata avant la fonction
            return [
              metadataDecl,
              node
            ];
          }
        }
      }
      return ts.visitEachChild(node, visit, context);
    }

    return (sourceFile: ts.SourceFile) => ts.visitNode(sourceFile, visit) as ts.SourceFile;
  };
}
/**
 * Utilitaire pour les tests : transforme du code source TypeScript et injecte les métadonnées @tool.
 */
export function transformAndInjectMetadata(source: string): string {
  const fileName = "test.ts";
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  const compilerHost = ts.createCompilerHost({});
  const program = ts.createProgram([fileName], {}, compilerHost);

  // Hack pour injecter le sourceFile dans le program (pour tests)
  (program as any).getSourceFile = () => sourceFile;

  const transformerFactory = (require('./transformer').default)(program);

  const { transformed } = ts.transform(sourceFile, [transformerFactory]);
  const printer = ts.createPrinter();
  return printer.printFile(transformed[0]);
}
