// Kind of gross, but essentially asserting that the exports of this module are the same as the
// exports of index-browser, since this file may be replaced at bundle time with index-browser.
({});
export { findPackageData } from "./package.ts";
export { findConfigUpwards, findRelativeConfig, findRootConfig, loadConfig, resolveShowConfigPath, ROOT_CONFIG_FILENAMES, } from "./configuration.ts";
export { loadPlugin, loadPreset, resolvePlugin, resolvePreset, } from "./plugins.ts";
