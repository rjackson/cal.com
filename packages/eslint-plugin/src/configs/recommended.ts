const recommended = {
  parser: "@typescript-eslint/parser",
  parserOptions: { sourceType: "module" },
  rules: {
    "@calcom/eslint/deprecated-imports": "error",
    "@calcom/eslint/avoid-web-storage": "error",
    "@calcom/eslint/avoid-prisma-client-import-for-enums": "error",
    "@calcom/eslint/avoid-direct-usetranslate": "error",
    // "@calcom/eslint/ensure-serverside-translations-on-pages": "error",
  },
};

export default recommended;
