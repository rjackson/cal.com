const HttpBackend = require("i18next-http-backend/cjs");
const path = require("path");
const i18nConfig = require("@calcom/config/next-i18next.config");

/** @type {import("next-i18next").UserConfig} */
const config = {
  ...i18nConfig,
  localePath: path.resolve("./public/static/locales"),
  backend: {
    loadPath: "/static/locales/{{lng}}/{{ns}}.json",
  },
  serializeConfig: false,
  use: typeof window !== "undefined" ? [HttpBackend] : [],
};

module.exports = config;
