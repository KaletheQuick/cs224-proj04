import getTargets from "@babel/helper-compilation-targets";
export function resolveBrowserslistConfigFile(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
browserslistConfigFile, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
configFilePath) {
    return undefined;
}
export function resolveTargets(options, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
root) {
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
    return getTargets(targets, {
        ignoreBrowserslistConfig: true,
        browserslistEnv: options.browserslistEnv,
    });
}
