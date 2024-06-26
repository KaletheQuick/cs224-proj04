import gensync from "gensync";
import loadConfig from "./config/index.ts";
import { run } from "./transformation/index.ts";
import * as fs from "./gensync-utils/fs.ts";
// Kind of gross, but essentially asserting that the exports of this module are the same as the
// exports of transform-file-browser, since this file may be replaced at bundle time with
// transform-file-browser.
({});
const transformFileRunner = gensync(function* (filename, opts) {
    const options = Object.assign(Object.assign({}, opts), { filename });
    const config = yield* loadConfig(options);
    if (config === null)
        return null;
    const code = yield* fs.readFile(filename, "utf8");
    return yield* run(config, code);
});
export function transformFile(...args) {
    transformFileRunner.errback(...args);
}
export function transformFileSync(...args) {
    return transformFileRunner.sync(...args);
}
export function transformFileAsync(...args) {
    return transformFileRunner.async(...args);
}
