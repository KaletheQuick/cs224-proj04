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
import { additionalManifestEntriesTransform } from './additional-manifest-entries-transform';
import { errors } from './errors';
import { maximumSizeTransform } from './maximum-size-transform';
import { modifyURLPrefixTransform } from './modify-url-prefix-transform';
import { noRevisionForURLsMatchingTransform } from './no-revision-for-urls-matching-transform';
export function transformManifest({ additionalManifestEntries, dontCacheBustURLsMatching, fileDetails, manifestTransforms, maximumFileSizeToCacheInBytes, modifyURLPrefix, transformParam, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const allWarnings = [];
        // Take the array of fileDetail objects and convert it into an array of
        // {url, revision, size} objects, with \ replaced with /.
        const normalizedManifest = fileDetails.map((fileDetails) => {
            return {
                url: fileDetails.file.replace(/\\/g, '/'),
                revision: fileDetails.hash,
                size: fileDetails.size,
            };
        });
        const transformsToApply = [];
        if (maximumFileSizeToCacheInBytes) {
            transformsToApply.push(maximumSizeTransform(maximumFileSizeToCacheInBytes));
        }
        if (modifyURLPrefix) {
            transformsToApply.push(modifyURLPrefixTransform(modifyURLPrefix));
        }
        if (dontCacheBustURLsMatching) {
            transformsToApply.push(noRevisionForURLsMatchingTransform(dontCacheBustURLsMatching));
        }
        // Run any manifestTransforms functions second-to-last.
        if (manifestTransforms) {
            transformsToApply.push(...manifestTransforms);
        }
        // Run additionalManifestEntriesTransform last.
        if (additionalManifestEntries) {
            transformsToApply.push(additionalManifestEntriesTransform(additionalManifestEntries));
        }
        let transformedManifest = normalizedManifest;
        for (const transform of transformsToApply) {
            const result = yield transform(transformedManifest, transformParam);
            if (!('manifest' in result)) {
                throw new Error(errors['bad-manifest-transforms-return-value']);
            }
            transformedManifest = result.manifest;
            allWarnings.push(...(result.warnings || []));
        }
        // Generate some metadata about the manifest before we clear out the size
        // properties from each entry.
        const count = transformedManifest.length;
        let size = 0;
        for (const manifestEntry of transformedManifest) {
            size += manifestEntry.size || 0;
            delete manifestEntry.size;
        }
        return {
            count,
            size,
            manifestEntries: transformedManifest,
            warnings: allWarnings,
        };
    });
}
