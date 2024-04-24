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
import fse from 'fs-extra';
import upath from 'upath';
import { bundle } from './bundle';
import { errors } from './errors';
import { populateSWTemplate } from './populate-sw-template';
export function writeSWUsingDefaultTemplate({ babelPresetEnvTargets, cacheId, cleanupOutdatedCaches, clientsClaim, directoryIndex, disableDevLogs, ignoreURLParametersMatching, importScripts, inlineWorkboxRuntime, manifestEntries, mode, navigateFallback, navigateFallbackDenylist, navigateFallbackAllowlist, navigationPreload, offlineGoogleAnalytics, runtimeCaching, skipWaiting, sourcemap, swDest, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const outputDir = upath.dirname(swDest);
        try {
            yield fse.mkdirp(outputDir);
        }
        catch (error) {
            throw new Error(`${errors['unable-to-make-sw-directory']}. ` +
                `'${error instanceof Error && error.message ? error.message : ''}'`);
        }
        const unbundledCode = populateSWTemplate({
            cacheId,
            cleanupOutdatedCaches,
            clientsClaim,
            directoryIndex,
            disableDevLogs,
            ignoreURLParametersMatching,
            importScripts,
            manifestEntries,
            navigateFallback,
            navigateFallbackDenylist,
            navigateFallbackAllowlist,
            navigationPreload,
            offlineGoogleAnalytics,
            runtimeCaching,
            skipWaiting,
        });
        try {
            const files = yield bundle({
                babelPresetEnvTargets,
                inlineWorkboxRuntime,
                mode,
                sourcemap,
                swDest,
                unbundledCode,
            });
            const filePaths = [];
            for (const file of files) {
                const filePath = upath.resolve(file.name);
                filePaths.push(filePath);
                yield fse.writeFile(filePath, file.contents);
            }
            return filePaths;
        }
        catch (error) {
            const err = error;
            if (err.code === 'EISDIR') {
                // See https://github.com/GoogleChrome/workbox/issues/612
                throw new Error(errors['sw-write-failure-directory']);
            }
            throw new Error(`${errors['sw-write-failure']} '${err.message}'`);
        }
    });
}
