/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ModuleFilenameHelpers, } from 'webpack';
import { transformManifest } from 'workbox-build/build/lib/transform-manifest';
import { getAssetHash } from './get-asset-hash';
import { resolveWebpackURL } from './resolve-webpack-url';
/**
 * For a given asset, checks whether at least one of the conditions matches.
 *
 * @param {Asset} asset The webpack asset in question. This will be passed
 * to any functions that are listed as conditions.
 * @param {Compilation} compilation The webpack compilation. This will be passed
 * to any functions that are listed as conditions.
 * @param {Array<string|RegExp|Function>} conditions
 * @return {boolean} Whether or not at least one condition matches.
 * @private
 */
function checkConditions(asset, compilation, conditions = []) {
    for (const condition of conditions) {
        if (typeof condition === 'function') {
            return condition({ asset, compilation });
            //return compilation !== null;
        }
        else {
            if (ModuleFilenameHelpers.matchPart(asset.name, condition)) {
                return true;
            }
        }
    }
    // We'll only get here if none of the conditions applied.
    return false;
}
/**
 * Returns the names of all the assets in all the chunks in a chunk group,
 * if provided a chunk group name.
 * Otherwise, if provided a chunk name, return all the assets in that chunk.
 * Otherwise, if there isn't a chunk group or chunk with that name, return null.
 *
 * @param {Compilation} compilation
 * @param {string} chunkOrGroup
 * @return {Array<string>|null}
 * @private
 */
function getNamesOfAssetsInChunkOrGroup(compilation, chunkOrGroup) {
    const chunkGroup = compilation.namedChunkGroups &&
        compilation.namedChunkGroups.get(chunkOrGroup);
    if (chunkGroup) {
        const assetNames = [];
        for (const chunk of chunkGroup.chunks) {
            assetNames.push(...getNamesOfAssetsInChunk(chunk));
        }
        return assetNames;
    }
    else {
        const chunk = compilation.namedChunks && compilation.namedChunks.get(chunkOrGroup);
        if (chunk) {
            return getNamesOfAssetsInChunk(chunk);
        }
    }
    // If we get here, there's no chunkGroup or chunk with that name.
    return null;
}
/**
 * Returns the names of all the assets in a chunk.
 *
 * @param {Chunk} chunk
 * @return {Array<string>}
 * @private
 */
function getNamesOfAssetsInChunk(chunk) {
    const assetNames = [];
    assetNames.push(...chunk.files);
    // This only appears to be set in webpack v5.
    if (chunk.auxiliaryFiles) {
        assetNames.push(...chunk.auxiliaryFiles);
    }
    return assetNames;
}
/**
 * Filters the set of assets out, based on the configuration options provided:
 * - chunks and excludeChunks, for chunkName-based criteria.
 * - include and exclude, for more general criteria.
 *
 * @param {Compilation} compilation The webpack compilation.
 * @param {Object} config The validated configuration, obtained from the plugin.
 * @return {Set<Asset>} The assets that should be included in the manifest,
 * based on the criteria provided.
 * @private
 */
function filterAssets(compilation, config) {
    const filteredAssets = new Set();
    const assets = compilation.getAssets();
    const allowedAssetNames = new Set();
    // See https://github.com/GoogleChrome/workbox/issues/1287
    if (Array.isArray(config.chunks)) {
        for (const name of config.chunks) {
            // See https://github.com/GoogleChrome/workbox/issues/2717
            const assetsInChunkOrGroup = getNamesOfAssetsInChunkOrGroup(compilation, name);
            if (assetsInChunkOrGroup) {
                for (const assetName of assetsInChunkOrGroup) {
                    allowedAssetNames.add(assetName);
                }
            }
            else {
                compilation.warnings.push(new Error(`The chunk '${name}' was ` +
                    `provided in your Workbox chunks config, but was not found in the ` +
                    `compilation.`));
            }
        }
    }
    const deniedAssetNames = new Set();
    if (Array.isArray(config.excludeChunks)) {
        for (const name of config.excludeChunks) {
            // See https://github.com/GoogleChrome/workbox/issues/2717
            const assetsInChunkOrGroup = getNamesOfAssetsInChunkOrGroup(compilation, name);
            if (assetsInChunkOrGroup) {
                for (const assetName of assetsInChunkOrGroup) {
                    deniedAssetNames.add(assetName);
                }
            } // Don't warn if the chunk group isn't found.
        }
    }
    for (const asset of assets) {
        // chunk based filtering is funky because:
        // - Each asset might belong to one or more chunks.
        // - If *any* of those chunk names match our config.excludeChunks,
        //   then we skip that asset.
        // - If the config.chunks is defined *and* there's no match
        //   between at least one of the chunkNames and one entry, then
        //   we skip that assets as well.
        if (deniedAssetNames.has(asset.name)) {
            continue;
        }
        if (Array.isArray(config.chunks) && !allowedAssetNames.has(asset.name)) {
            continue;
        }
        // Next, check asset-level checks via includes/excludes:
        const isExcluded = checkConditions(asset, compilation, config.exclude);
        if (isExcluded) {
            continue;
        }
        // Treat an empty config.includes as an implicit inclusion.
        const isIncluded = !Array.isArray(config.include) ||
            checkConditions(asset, compilation, config.include);
        if (!isIncluded) {
            continue;
        }
        // If we've gotten this far, then add the asset.
        filteredAssets.add(asset);
    }
    return filteredAssets;
}
export function getManifestEntriesFromCompilation(compilation, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const filteredAssets = filterAssets(compilation, config);
        const { publicPath } = compilation.options.output;
        const fileDetails = Array.from(filteredAssets).map((asset) => {
            return {
                file: resolveWebpackURL(publicPath, asset.name),
                hash: getAssetHash(asset),
                size: asset.source.size() || 0,
            };
        });
        const { manifestEntries, size, warnings } = yield transformManifest({
            fileDetails,
            additionalManifestEntries: config.additionalManifestEntries,
            dontCacheBustURLsMatching: config.dontCacheBustURLsMatching,
            manifestTransforms: config.manifestTransforms,
            maximumFileSizeToCacheInBytes: config.maximumFileSizeToCacheInBytes,
            modifyURLPrefix: config.modifyURLPrefix,
            transformParam: compilation,
        });
        // See https://github.com/GoogleChrome/workbox/issues/2790
        for (const warning of warnings) {
            compilation.warnings.push(new Error(warning));
        }
        // Ensure that the entries are properly sorted by URL.
        const sortedEntries = manifestEntries.sort((a, b) => a.url === b.url ? 0 : a.url > b.url ? 1 : -1);
        return { size, sortedEntries };
    });
}
