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
import { errors } from './errors';
// Used to filter the libraries to copy based on our package.json dependencies.
const WORKBOX_PREFIX = 'workbox-';
// The directory within each package containing the final bundles.
const BUILD_DIR = 'build';
/**
 * This copies over a set of runtime libraries used by Workbox into a
 * local directory, which should be deployed alongside your service worker file.
 *
 * As an alternative to deploying these local copies, you could instead use
 * Workbox from its official CDN URL.
 *
 * This method is exposed for the benefit of developers using
 * {@link workbox-build.injectManifest} who would
 * prefer not to use the CDN copies of Workbox. Developers using
 * {@link workbox-build.generateSW} don't need to
 * explicitly call this method.
 *
 * @param {string} destDirectory The path to the parent directory under which
 * the new directory of libraries will be created.
 * @return {Promise<string>} The name of the newly created directory.
 *
 * @alias workbox-build.copyWorkboxLibraries
 */
export function copyWorkboxLibraries(destDirectory) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line  @typescript-eslint/no-unsafe-assignment
        const thisPkg = require('../../package.json');
        // Use the version string from workbox-build in the name of the parent
        // directory. This should be safe, because lerna will bump workbox-build's
        // pkg.version whenever one of the dependent libraries gets bumped, and we
        // care about versioning the dependent libraries.
        const workboxDirectoryName = `workbox-v${thisPkg.version ? thisPkg.version : ''}`;
        const workboxDirectoryPath = upath.join(destDirectory, workboxDirectoryName);
        yield fse.ensureDir(workboxDirectoryPath);
        const copyPromises = [];
        const librariesToCopy = Object.keys(thisPkg.dependencies || {}).filter((dependency) => dependency.startsWith(WORKBOX_PREFIX));
        for (const library of librariesToCopy) {
            // Get the path to the package on the user's filesystem by require-ing
            // the package's `package.json` file via the node resolution algorithm.
            const libraryPath = upath.dirname(require.resolve(`${library}/package.json`));
            const buildPath = upath.join(libraryPath, BUILD_DIR);
            // fse.copy() copies all the files in a directory, not the directory itself.
            // See https://github.com/jprichardson/node-fs-extra/blob/master/docs/copy.md#copysrc-dest-options-callback
            copyPromises.push(fse.copy(buildPath, workboxDirectoryPath));
        }
        try {
            yield Promise.all(copyPromises);
            return workboxDirectoryName;
        }
        catch (error) {
            throw Error(`${errors['unable-to-copy-workbox-libraries']} ${error instanceof Error ? error.toString() : ''}`);
        }
    });
}
