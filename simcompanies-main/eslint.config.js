import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    languageOptions: { globals: globals.browser },
    rules: { "no-unused-vars": "off", "no-undef": "off", "no-empty": "off" }
  },
  pluginJs.configs.recommended,
];