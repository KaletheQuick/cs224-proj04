// Kind of gross, but essentially asserting that the exports of this module are the same as the
// exports of index-browser, since this file may be replaced at bundle time with index-browser.
({});
import path from "path";
import getTargets from "@babel/helper-compilation-targets";
export function resolveBrowserslistConfigFile(browserslistConfigFile, configFileDir) {
    return path.resolve(configFileDir, browserslistConfigFile);
}
export function resolveTargets(options, root) {
    const optTargets = options.targets;
    let targets;
    if (typeof optTargets === "string" || Array.isArray(optTargets)) {
        targets = { browsers: optTargets };
    }
    else if (optTargets) {
        if ("esmodules" in optTargets) {
            targets = Object.assign(Object.assign({}, optTargets), { esmodules: "intersect" });
        }
        else {
            // https://github.com/microsoft/TypeScript/issues/17002
            targets = optTargets;
        }
    }
    const { browserslistConfigFile } = options;
    let configFile;
    let ignoreBrowserslistConfig = false;
    if (typeof browserslistConfigFile === "string") {
        configFile = browserslistConfigFile;
    }
    else {
        ignoreBrowserslistConfig = browserslistConfigFile === false;
    }
    return getTargets(targets, {
        ignoreBrowserslistConfig,
        configFile,
        configPath: root,
        browserslistEnv: options.browserslistEnv,
    });
}
