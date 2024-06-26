export function findConfigUpwards(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
rootDir) {
    return null;
}
// eslint-disable-next-line require-yield
export function* findPackageData(filepath) {
    return {
        filepath,
        directories: [],
        pkg: null,
        isPackage: false,
    };
}
// eslint-disable-next-line require-yield
export function* findRelativeConfig(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
pkgData, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
envName, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
caller) {
    return { config: null, ignore: null };
}
// eslint-disable-next-line require-yield
export function* findRootConfig(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
dirname, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
envName, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
caller) {
    return null;
}
// eslint-disable-next-line require-yield
export function* loadConfig(name, dirname, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
envName, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
caller) {
    throw new Error(`Cannot load ${name} relative to ${dirname} in a browser`);
}
// eslint-disable-next-line require-yield
export function* resolveShowConfigPath(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
dirname) {
    return null;
}
export const ROOT_CONFIG_FILENAMES = [];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function resolvePlugin(name, dirname) {
    return null;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function resolvePreset(name, dirname) {
    return null;
}
export function loadPlugin(name, dirname) {
    throw new Error(`Cannot load plugin ${name} relative to ${dirname} in a browser`);
}
export function loadPreset(name, dirname) {
    throw new Error(`Cannot load preset ${name} relative to ${dirname} in a browser`);
}
