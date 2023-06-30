import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => `https://developer.cal.com/eslint/rule/${name}`);

const rule = createRule({
  name: "avoid-direct-use-translation",
  defaultOptions: [],
  meta: {
    fixable: "code",
    docs: {
      description:
        "Avoid directly using useTranslation to prevent customers seeing a flash of untranslated tokens",
      recommended: "error",
    },
    messages: {
      "avoid-direct-use-translation": `import { useLocale } from "@calcom/lib/hooks/useLocale"; instead of useTranslation.`,
    },
    type: "suggestion",
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        (node.source.value === "next-i18next" || node.source.value === "react-i18next") &&
          node.importKind !== "type" &&
          node.specifiers.forEach((item) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const enumType = item.imported?.name; // ts doesn't know about imported, bad type?
            if (!enumType || enumType !== "useTranslation") return null;

            return context.report({
              node: item,
              loc: node.loc,
              messageId: "avoid-direct-use-translation",
              data: {
                enumType,
              },
            });
          });
      },
    };
  },
});

export default rule;
