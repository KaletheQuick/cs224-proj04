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
import { getFileManifestEntries } from './lib/get-file-manifest-entries';
import { validateGetManifestOptions } from './lib/validate-options';
/**
 * This method returns a list of URLs to precache, referred to as a "precache
 * manifest", along with details about the number of entries and their size,
 * based on the options you provide.
 *
 * ```
 * // The following lists some common options; see the rest of the documentation
 * // for the full set of options and defaults.
 * const {count, manifestEntries, size, warnings} = await getManifest({
 *   dontCacheBustURLsMatching: [new RegExp('...')],
 *   globDirectory: '...',
 *   globPatterns: ['...', '...'],
 *   maximumFileSizeToCacheInBytes: ...,
 * });
 * ```
 *
 * @memberof workbox-build
 */
export function getManifest(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = validateGetManifestOptions(config);
        return yield getFileManifestEntries(options);
    });
}
