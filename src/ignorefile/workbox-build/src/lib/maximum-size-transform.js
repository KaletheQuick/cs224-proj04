/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
import prettyBytes from 'pretty-bytes';
export function maximumSizeTransform(maximumFileSizeToCacheInBytes) {
    return (originalManifest) => {
        const warnings = [];
        const manifest = originalManifest.filter((entry) => {
            if (entry.size <= maximumFileSizeToCacheInBytes) {
                return true;
            }
            warnings.push(`${entry.url} is ${prettyBytes(entry.size)}, and won't ` +
                `be precached. Configure maximumFileSizeToCacheInBytes to change ` +
                `this limit.`);
            return false;
        });
        return { manifest, warnings };
    };
}
