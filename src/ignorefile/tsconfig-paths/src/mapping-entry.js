import * as path from "path";
/**
 * Converts an absolute baseUrl and paths to an array of absolute mapping entries.
 * The array is sorted by longest prefix.
 * Having an array with entries allows us to keep a sorting order rather than
 * sort by keys each time we use the mappings.
 * @param absoluteBaseUrl
 * @param paths
 * @param addMatchAll
 */
export function getAbsoluteMappingEntries(absoluteBaseUrl, paths, addMatchAll) {
    // Resolve all paths to absolute form once here, and sort them by
    // longest prefix once here, this saves time on each request later.
    // We need to put them in an array to preserve the sorting order.
    const sortedKeys = sortByLongestPrefix(Object.keys(paths));
    const absolutePaths = [];
    for (const key of sortedKeys) {
        absolutePaths.push({
            pattern: key,
            paths: paths[key].map((pathToResolve) => path.join(absoluteBaseUrl, pathToResolve)),
        });
    }
    // If there is no match-all path specified in the paths section of tsconfig, then try to match
    // all paths relative to baseUrl, this is how typescript works.
    if (!paths["*"] && addMatchAll) {
        absolutePaths.push({
            pattern: "*",
            paths: [`${absoluteBaseUrl.replace(/\/$/, "")}/*`],
        });
    }
    return absolutePaths;
}
/**
 * Sort path patterns.
 * If a module name can be matched with multiple patterns then pattern with the longest prefix will be picked.
 */
function sortByLongestPrefix(arr) {
    return arr
        .concat()
        .sort((a, b) => getPrefixLength(b) - getPrefixLength(a));
}
function getPrefixLength(pattern) {
    const prefixLength = pattern.indexOf("*");
    return pattern.substr(0, prefixLength).length;
}
