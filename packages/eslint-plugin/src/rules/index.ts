/* eslint-disable @typescript-eslint/no-var-requires*/
import type { ESLint } from "eslint";

export default {
  "deprecated-imports": require("./deprecated-imports").default,
  "avoid-web-storage": require("./avoid-web-storage").default,
  "avoid-prisma-client-import-for-enums": require("./avoid-prisma-client-import-for-enums").default,
  "avoid-direct-usetranslate": require("./avoid-direct-usetranslate").default,
  // "ensure-serverside-translations-on-pages": require("./ensure-serverside-translations-on-pages").default,
} as ESLint.Plugin["rules"];
