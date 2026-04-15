import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(frontendRoot, "src");
const localesRoot = path.join(srcRoot, "i18n", "locales");
const reportRoot = path.join(frontendRoot, "reports", "i18n");
const supportedLanguages = ["en", "da", "sv", "no"];

const ignoredPathSegments = [
  `${path.sep}src${path.sep}i18n${path.sep}`,
  `${path.sep}src${path.sep}types${path.sep}`,
  `${path.sep}src${path.sep}app${path.sep}api${path.sep}`,
];

const ignoredJsxProps = new Set([
  "className",
  "href",
  "src",
  "id",
  "type",
  "name",
  "value",
  "defaultValue",
  "role",
  "method",
  "htmlFor",
  "target",
  "rel",
  "icon",
  "variant",
  "size",
  "data-name",
  "data-testid",
  "data-state",
  "data-slot",
  "data-collapsed",
  "data-name",
  "data-node-id",
  "data-id",
  "data-value",
  "dataName",
  "aria-hidden",
  "aria-current",
  "aria-live",
]);

const userFacingJsxProps = new Set([
  "title",
  "description",
  "label",
  "placeholder",
  "helperText",
  "error",
  "errorMessage",
  "aria-label",
  "ariaLabel",
  "alt",
  "summary",
  "message",
  "emptyMessage",
  "selectedLabel",
  "selectedItemsLabel",
  "clearAllLabel",
]);

const translationKeyProps = new Set([
  "key",
  "titleKey",
  "descriptionKey",
  "ctaKey",
  "noticeKey",
  "nextLabelKey",
  "activeItemKey",
  "labelKey",
  "valueKey",
  "noteKey",
]);

const userFacingObjectProps = new Set([
  "title",
  "subtitle",
  "description",
  "helper",
  "message",
  "detail",
  "summary",
  "label",
  "placeholder",
  "helperText",
  "emptyMessage",
  "selectedLabel",
  "selectedItemsLabel",
  "clearAllLabel",
  "cta",
  "badge",
  "timing",
  "status",
  "meta",
  "note",
  "errorMessage",
]);

const userFacingVariablePattern =
  /(?:title|subtitle|description|message|detail|summary|label|placeholder|helper|error|status|cta|timing|badge|notice)$/i;

const uiLibraryPathMatchers = [
  `${path.sep}src${path.sep}lib${path.sep}dashboard${path.sep}`,
  `${path.sep}src${path.sep}lib${path.sep}matches${path.sep}`,
  `${path.sep}src${path.sep}lib${path.sep}workflows${path.sep}`,
  `${path.sep}src${path.sep}lib${path.sep}validation${path.sep}`,
  `${path.sep}src${path.sep}components${path.sep}admin${path.sep}`,
  `${path.sep}src${path.sep}constants${path.sep}`,
];

function main() {
  const files = collectSourceFiles(srcRoot)
    .filter(
      (filePath) =>
        !ignoredPathSegments.some((segment) => filePath.includes(segment)),
    )
    .sort();

  const localeMaps = Object.fromEntries(
    supportedLanguages.map((language) => {
      const filePath = path.join(localesRoot, language, "app.json");
      const contents = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return [language, contents];
    }),
  );

  const occurrences = [];

  for (const filePath of files) {
    const relativePath = path.relative(frontendRoot, filePath);
    const sourceText = fs.readFileSync(filePath, "utf8");
    const scriptKind = filePath.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    );

    walk(sourceFile, (node) => {
      if (!isCandidateNode(node)) {
        return;
      }

      const text = extractNodeText(node);
      if (!text || !hasLetters(text) || looksLikeCode(text)) {
        return;
      }

      const classification = classifyNode(node, relativePath);
      if (!classification) {
        return;
      }

      if (shouldIgnoreHardcodedToken(text, classification.kind)) {
        return;
      }

      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile),
      );
      const lineText = sourceText.split(/\r?\n/u)[line] ?? "";
      const localeStatus = buildLocaleStatus(text, localeMaps);

      occurrences.push({
        kind: classification.kind,
        context: classification.context,
        text,
        file: relativePath,
        line: line + 1,
        column: character + 1,
        inEnglishLocale: localeStatus.inEnglishLocale,
        missingLanguages: localeStatus.missingLanguages,
        sourceLine: lineText.trim(),
      });
    });
  }

  const summary = buildSummary(files, occurrences);
  const catalog = buildCatalog(occurrences);

  fs.mkdirSync(reportRoot, { recursive: true });
  fs.writeFileSync(
    path.join(reportRoot, "summary.json"),
    JSON.stringify(summary, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(reportRoot, "hardcoded-ui-strings.json"),
    JSON.stringify(
      occurrences.filter((entry) => entry.kind.startsWith("hardcoded")),
      null,
      2,
    ) + "\n",
  );
  fs.writeFileSync(
    path.join(reportRoot, "translation-catalog.json"),
    JSON.stringify(catalog, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(reportRoot, "summary.md"),
    buildMarkdownSummary(summary, catalog),
  );

  printConsoleSummary(summary);
}

function collectSourceFiles(rootDir) {
  const files = [];

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    if (
      entry.isFile() &&
      /\.(ts|tsx)$/u.test(entry.name) &&
      !entry.name.endsWith(".d.ts")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function walk(node, visit) {
  visit(node);
  ts.forEachChild(node, (child) => walk(child, visit));
}

function isCandidateNode(node) {
  return (
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    ts.isTemplateExpression(node) ||
    ts.isJsxText(node)
  );
}

function extractNodeText(node) {
  if (
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    ts.isJsxText(node)
  ) {
    return normalizeWhitespace(node.text);
  }

  if (ts.isTemplateExpression(node)) {
    let text = node.head.text;

    node.templateSpans.forEach((span, index) => {
      text += `{{${getPlaceholderName(span.expression, index)}}}${span.literal.text}`;
    });

    return normalizeWhitespace(text);
  }

  return "";
}

function getPlaceholderName(expression, index) {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }

  if (
    ts.isElementAccessExpression(expression) &&
    ts.isIdentifier(expression.expression)
  ) {
    return expression.expression.text;
  }

  if (ts.isCallExpression(expression)) {
    const calleeName = getCallName(expression.expression);
    return calleeName || `value${index + 1}`;
  }

  return `value${index + 1}`;
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/gu, " ").trim();
}

function hasLetters(value) {
  return /[A-Za-zÀ-ÖØ-öø-ÿ]/u.test(value);
}

function looksLikeCode(value) {
  if (!value) {
    return true;
  }

  return (
    value === "use client" ||
    /^https?:\/\//u.test(value) ||
    /^\/[A-Za-z0-9/_-]*$/u.test(value) ||
    /^#[0-9a-f]{3,8}$/iu.test(value) ||
    /^(GET|POST|PUT|PATCH|DELETE)$/u.test(value) ||
    /^[A-Z0-9_]+$/u.test(value) ||
    value.includes("rgba(") ||
    value.includes("bg-[") ||
    value.includes("text-[") ||
    value.includes("shadow-[") ||
    value.includes("rounded-[") ||
    /^[a-z]+(?:-[a-z0-9]+)+$/u.test(value)
  );
}

function shouldIgnoreHardcodedToken(text, kind) {
  if (!kind.startsWith("hardcoded")) {
    return false;
  }

  return (
    /^(true|false|null|undefined)$/u.test(text) || /^[a-z]{3,}$/u.test(text)
  );
}

function classifyNode(node, relativePath) {
  if (
    isTypeOnlyString(node) ||
    isImportLikeString(node) ||
    isIgnoredCallArgument(node)
  ) {
    return null;
  }

  if (isTranslationCallArgument(node)) {
    return {
      kind: "translated-call",
      context: "t(...)",
    };
  }

  const jsxAttribute = findAncestor(
    node,
    (ancestor) =>
      ts.isJsxAttribute(ancestor) &&
      ancestor.initializer &&
      nodeIsWithin(node, ancestor.initializer),
  );

  if (jsxAttribute) {
    const propName = jsxAttribute.name.getText();

    if (ignoredJsxProps.has(propName)) {
      return null;
    }

    if (translationKeyProps.has(propName) || propName.endsWith("Key")) {
      return {
        kind: "translated-prop-key",
        context: propName,
      };
    }

    if (userFacingJsxProps.has(propName)) {
      return {
        kind: "hardcoded-prop",
        context: propName,
      };
    }
  }

  if (ts.isJsxText(node) || isDisplayedJsxExpression(node)) {
    return {
      kind: "hardcoded-jsx",
      context: "jsx",
    };
  }

  const propertyAssignment = findAncestor(
    node,
    (ancestor) =>
      ts.isPropertyAssignment(ancestor) &&
      nodeIsWithin(node, ancestor.initializer),
  );

  if (propertyAssignment) {
    const propertyName = getPropertyName(propertyAssignment.name);

    if (propertyName) {
      if (
        translationKeyProps.has(propertyName) ||
        propertyName.endsWith("Key")
      ) {
        return {
          kind: "translated-object-key",
          context: propertyName,
        };
      }

      if (userFacingObjectProps.has(propertyName)) {
        return {
          kind: "hardcoded-object",
          context: propertyName,
        };
      }
    }
  }

  const variableDeclaration = findAncestor(
    node,
    (ancestor) =>
      ts.isVariableDeclaration(ancestor) &&
      Boolean(ancestor.initializer) &&
      nodeIsWithin(node, ancestor.initializer),
  );

  if (variableDeclaration && ts.isIdentifier(variableDeclaration.name)) {
    const variableName = variableDeclaration.name.text;

    if (userFacingVariablePattern.test(variableName)) {
      return {
        kind: "hardcoded-variable",
        context: variableName,
      };
    }
  }

  if (relativePath.includes(`${path.sep}validation${path.sep}`)) {
    return {
      kind: "hardcoded-validation",
      context: "validation-message",
    };
  }

  if (uiLibraryPathMatchers.some((matcher) => relativePath.includes(matcher))) {
    const returnStatement = findAncestor(
      node,
      (ancestor) =>
        ts.isReturnStatement(ancestor) &&
        Boolean(ancestor.expression) &&
        nodeIsWithin(node, ancestor.expression),
    );

    if (returnStatement) {
      return {
        kind: "hardcoded-return",
        context: "return",
      };
    }
  }

  if (relativePath.includes(`${path.sep}constants${path.sep}`)) {
    const constantName = getEnclosingConstName(node);

    if (constantName) {
      return {
        kind: "hardcoded-constant",
        context: constantName,
      };
    }
  }

  return null;
}

function isTypeOnlyString(node) {
  return Boolean(
    findAncestor(
      node,
      (ancestor) =>
        ts.isLiteralTypeNode(ancestor) ||
        ts.isTypeAliasDeclaration(ancestor) ||
        ts.isUnionTypeNode(ancestor) ||
        ts.isHeritageClause(ancestor),
    ),
  );
}

function isImportLikeString(node) {
  const parent = node.parent;
  return Boolean(
    parent &&
    (ts.isImportDeclaration(parent) ||
      ts.isExportDeclaration(parent) ||
      ts.isImportEqualsDeclaration(parent) ||
      ts.isExternalModuleReference(parent) ||
      ts.isModuleDeclaration(parent)),
  );
}

function isIgnoredCallArgument(node) {
  const callExpression = findAncestor(
    node,
    (ancestor) =>
      ts.isCallExpression(ancestor) &&
      ancestor.arguments.some(
        (argument) => argument === node || nodeIsWithin(node, argument),
      ),
  );

  if (!callExpression) {
    return false;
  }

  const callName = getCallName(callExpression.expression);
  return [
    "fetch",
    "setField",
    "setState",
    "push",
    "replace",
    "redirect",
  ].includes(callName);
}

function isTranslationCallArgument(node) {
  const callExpression = findAncestor(
    node,
    (ancestor) =>
      ts.isCallExpression(ancestor) &&
      ancestor.arguments[0] &&
      (ancestor.arguments[0] === node ||
        nodeIsWithin(node, ancestor.arguments[0])),
  );

  return Boolean(
    callExpression && getCallName(callExpression.expression) === "t",
  );
}

function getCallName(expression) {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }

  return "";
}

function isDisplayedJsxExpression(node) {
  const jsxExpression = findAncestor(
    node,
    (ancestor) =>
      ts.isJsxExpression(ancestor) &&
      ancestor.expression &&
      nodeIsWithin(node, ancestor.expression),
  );

  if (!jsxExpression || ts.isJsxAttribute(jsxExpression.parent)) {
    return false;
  }

  let current = node;

  while (current && current !== jsxExpression.expression) {
    const parent = current.parent;

    if (
      ts.isParenthesizedExpression(parent) ||
      ts.isAsExpression(parent) ||
      ts.isNonNullExpression(parent)
    ) {
      current = parent;
      continue;
    }

    if (ts.isConditionalExpression(parent)) {
      if (current === parent.condition) {
        return false;
      }

      current = parent;
      continue;
    }

    if (ts.isBinaryExpression(parent)) {
      if (
        parent.operatorToken.kind === ts.SyntaxKind.PlusToken ||
        parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
        parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
        parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
      ) {
        current = parent;
        continue;
      }

      return false;
    }

    if (
      ts.isCallExpression(parent) ||
      ts.isPropertyAccessExpression(parent) ||
      ts.isElementAccessExpression(parent) ||
      ts.isArrayLiteralExpression(parent) ||
      ts.isObjectLiteralExpression(parent)
    ) {
      return false;
    }

    current = parent;
  }

  return current === jsxExpression.expression;
}

function getPropertyName(nameNode) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode)) {
    return nameNode.text;
  }

  return null;
}

function getEnclosingConstName(node) {
  const variableDeclaration = findAncestor(
    node,
    (ancestor) =>
      ts.isVariableDeclaration(ancestor) &&
      Boolean(ancestor.initializer) &&
      nodeIsWithin(node, ancestor.initializer),
  );

  if (!variableDeclaration || !ts.isIdentifier(variableDeclaration.name)) {
    return null;
  }

  return variableDeclaration.name.text;
}

function nodeIsWithin(node, container) {
  return node.pos >= container.pos && node.end <= container.end;
}

function findAncestor(node, predicate) {
  let current = node.parent;

  while (current) {
    if (predicate(current)) {
      return current;
    }

    current = current.parent;
  }

  return null;
}

function buildLocaleStatus(text, localeMaps) {
  const missingLanguages = supportedLanguages.filter((language) => {
    const value = localeMaps[language]?.[text];
    return typeof value !== "string" || value.trim().length === 0;
  });

  return {
    inEnglishLocale: !missingLanguages.includes("en"),
    missingLanguages,
  };
}

function buildCatalog(occurrences) {
  const catalogMap = new Map();

  for (const occurrence of occurrences) {
    const existing = catalogMap.get(occurrence.text);

    if (existing) {
      existing.occurrences += 1;
      existing.kinds = Array.from(
        new Set([...existing.kinds, occurrence.kind]),
      ).sort();
      existing.missingLanguages = Array.from(
        new Set([...existing.missingLanguages, ...occurrence.missingLanguages]),
      ).sort();
      existing.sources.push({
        file: occurrence.file,
        line: occurrence.line,
        context: occurrence.context,
      });
      continue;
    }

    catalogMap.set(occurrence.text, {
      text: occurrence.text,
      occurrences: 1,
      kinds: [occurrence.kind],
      missingLanguages: [...occurrence.missingLanguages].sort(),
      inEnglishLocale: occurrence.inEnglishLocale,
      sources: [
        {
          file: occurrence.file,
          line: occurrence.line,
          context: occurrence.context,
        },
      ],
    });
  }

  return Array.from(catalogMap.values())
    .map((entry) => ({
      ...entry,
      sources: entry.sources.slice(0, 10),
      status: entry.kinds.some((kind) => kind.startsWith("hardcoded"))
        ? "needs-refactor"
        : "translation-key",
    }))
    .sort((left, right) => {
      if (right.occurrences !== left.occurrences) {
        return right.occurrences - left.occurrences;
      }

      return left.text.localeCompare(right.text);
    });
}

function buildSummary(files, occurrences) {
  const hardcodedOccurrences = occurrences.filter((entry) =>
    entry.kind.startsWith("hardcoded"),
  );
  const uniqueHardcodedTexts = new Set(
    hardcodedOccurrences.map((entry) => entry.text),
  );
  const uniqueCatalogTexts = new Set(occurrences.map((entry) => entry.text));
  const missingByLanguage = Object.fromEntries(
    supportedLanguages.map((language) => [
      language,
      new Set(
        occurrences
          .filter((entry) => entry.missingLanguages.includes(language))
          .map((entry) => entry.text),
      ).size,
    ]),
  );

  const hardcodedByFile = Array.from(
    hardcodedOccurrences.reduce((map, entry) => {
      map.set(entry.file, (map.get(entry.file) ?? 0) + 1);
      return map;
    }, new Map()),
  )
    .map(([file, count]) => ({ file, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 15);

  const exampleHardcodedTexts = Array.from(uniqueHardcodedTexts)
    .sort()
    .slice(0, 25);

  return {
    generatedAt: new Date().toISOString(),
    filesScanned: files.length,
    occurrenceCount: occurrences.length,
    hardcodedOccurrenceCount: hardcodedOccurrences.length,
    uniqueHardcodedTextCount: uniqueHardcodedTexts.size,
    uniqueCatalogTextCount: uniqueCatalogTexts.size,
    missingByLanguage,
    topHardcodedFiles: hardcodedByFile,
    exampleHardcodedTexts,
  };
}

function buildMarkdownSummary(summary, catalog) {
  const topCatalogEntries = catalog.slice(0, 50);

  const lines = [
    "# I18n Audit Summary",
    "",
    `- Generated: ${summary.generatedAt}`,
    `- Files scanned: ${summary.filesScanned}`,
    `- String occurrences cataloged: ${summary.occurrenceCount}`,
    `- Likely hardcoded UI occurrences: ${summary.hardcodedOccurrenceCount}`,
    `- Unique hardcoded English texts: ${summary.uniqueHardcodedTextCount}`,
    `- Unique English catalog entries: ${summary.uniqueCatalogTextCount}`,
    "",
    "## Missing Locale Coverage",
    "",
    ...supportedLanguages.map(
      (language) =>
        `- ${language}: ${summary.missingByLanguage[language]} missing entries`,
    ),
    "",
    "## Top Files With Hardcoded UI Text",
    "",
    ...summary.topHardcodedFiles.map(
      (entry) => `- ${entry.file}: ${entry.count} hardcoded occurrences`,
    ),
    "",
    "## Sample Hardcoded English Texts",
    "",
    ...summary.exampleHardcodedTexts.map((text) => `- ${text}`),
    "",
    "## Top Catalog Entries",
    "",
    ...topCatalogEntries.map((entry) => {
      const missing =
        entry.missingLanguages.length > 0
          ? `missing ${entry.missingLanguages.join(", ")}`
          : "complete";
      return `- ${entry.text} (${entry.status}; ${entry.occurrences} occurrence${entry.occurrences === 1 ? "" : "s"}; ${missing})`;
    }),
    "",
  ];

  return lines.join("\n");
}

function printConsoleSummary(summary) {
  console.log(`Scanned ${summary.filesScanned} UI-facing source files.`);
  console.log(
    `Found ${summary.hardcodedOccurrenceCount} likely hardcoded UI string occurrences across ${summary.uniqueHardcodedTextCount} unique English texts.`,
  );
  console.log(
    `Cataloged ${summary.uniqueCatalogTextCount} unique English strings for translation coverage checks.`,
  );
  console.log("Missing locale entries by language:");

  for (const language of supportedLanguages) {
    console.log(`  - ${language}: ${summary.missingByLanguage[language]}`);
  }

  console.log(`Reports written to ${path.relative(frontendRoot, reportRoot)}`);
}

main();
