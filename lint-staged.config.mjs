import { relative } from "path";

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => relative(process.cwd(), f))
    .join(" --file ")}`;

const buildPrettierCommand = (filenames) =>
  `prettier --write ${filenames
    .map((f) => relative(process.cwd(), f))
    .join(" ")}`;

/**
 * @filename: lint-staged.config.mjs
 * @type {import('lint-staged').Configuration}
 */
const config = {
  "*.{js,jsx,ts,tsx,mjs}": [buildEslintCommand, buildPrettierCommand],
  "*.{json,md,yml,yaml,css}": [buildPrettierCommand],
};

export default config;
