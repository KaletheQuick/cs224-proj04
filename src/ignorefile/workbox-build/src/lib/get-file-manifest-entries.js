/*
  Copyright 2021 Google LLC

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
import assert from 'assert';
import { errors } from './errors';
import { getCompositeDetails } from './get-composite-details';
import { getFileDetails } from './get-file-details';
import { getStringDetails } from './get-string-details';
import { transformManifest } from './transform-manifest';
export function getFileManifestEntries({ additionalManifestEntries, dontCacheBustURLsMatching, globDirectory, globFollow, globIgnores, globPatterns = [], globStrict, manifestTransforms, maximumFileSizeToCacheInBytes, modifyURLPrefix, templatedURLs, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const warnings = [];
        const allFileDetails = new Map();
        try {
            for (const globPattern of globPatterns) {
                const { globbedFileDetails, warning } = getFileDetails({
                    globDirectory,
                    globFollow,
                    globIgnores,
                    globPattern,
                    globStrict,
                });
                if (warning) {
                    warnings.push(warning);
                }
                for (const details of globbedFileDetails) {
                    if (details && !allFileDetails.has(details.file)) {
                        allFileDetails.set(details.file, details);
                    }
                }
            }
        }
        catch (error) {
            // If there's an exception thrown while globbing, then report
            // it back as a warning, and don't consider it fatal.
            if (error instanceof Error && error.message) {
                warnings.push(error.message);
            }
        }
        if (templatedURLs) {
            for (const url of Object.keys(templatedURLs)) {
                assert(!allFileDetails.has(url), errors['templated-url-matches-glob']);
                const dependencies = templatedURLs[url];
                if (Array.isArray(dependencies)) {
                    const details = dependencies.reduce((previous, globPattern) => {
                        try {
                            const { globbedFileDetails, warning } = getFileDetails({
                                globDirectory,
                                globFollow,
                                globIgnores,
                                globPattern,
                                globStrict,
                            });
                            if (warning) {
                                warnings.push(warning);
                            }
                            return previous.concat(globbedFileDetails);
                        }
                        catch (error) {
                            const debugObj = {};
                            debugObj[url] = dependencies;
                            throw new Error(`${errors['bad-template-urls-asset']} ` +
                                `'${globPattern}' from '${JSON.stringify(debugObj)}':\n` +
                                `${error instanceof Error ? error.toString() : ''}`);
                        }
                    }, []);
                    if (details.length === 0) {
                        throw new Error(`${errors['bad-template-urls-asset']} The glob ` +
                            `pattern '${dependencies.toString()}' did not match anything.`);
                    }
                    allFileDetails.set(url, getCompositeDetails(url, details));
                }
                else if (typeof dependencies === 'string') {
                    allFileDetails.set(url, getStringDetails(url, dependencies));
                }
            }
        }
        const transformedManifest = yield transformManifest({
            additionalManifestEntries,
            dontCacheBustURLsMatching,
            manifestTransforms,
            maximumFileSizeToCacheInBytes,
            modifyURLPrefix,
            fileDetails: Array.from(allFileDetails.values()),
        });
        transformedManifest.warnings.push(...warnings);
        return transformedManifest;
    });
}
