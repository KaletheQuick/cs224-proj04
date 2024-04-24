/*
  Copyright 2019 Google LLC

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
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { rollup } from 'rollup';
import { terser } from 'rollup-plugin-terser';
import { writeFile } from 'fs-extra';
import omt from '@surma/rollup-plugin-off-main-thread';
import presetEnv from '@babel/preset-env';
import replace from '@rollup/plugin-replace';
import tempy from 'tempy';
import upath from 'upath';
export function bundle({ babelPresetEnvTargets, inlineWorkboxRuntime, mode, sourcemap, swDest, unbundledCode, }) {
    return __awaiter(this, void 0, void 0, function* () {
        // We need to write this to the "real" file system, as Rollup won't read from
        // a custom file system.
        const { dir, base } = upath.parse(swDest);
        const temporaryFile = tempy.file({ name: base });
        yield writeFile(temporaryFile, unbundledCode);
        const plugins = [
            nodeResolve(),
            replace({
                // See https://github.com/GoogleChrome/workbox/issues/2769
                'preventAssignment': true,
                'process.env.NODE_ENV': JSON.stringify(mode),
            }),
            babel({
                babelHelpers: 'bundled',
                // Disable the logic that checks for local Babel config files:
                // https://github.com/GoogleChrome/workbox/issues/2111
                babelrc: false,
                configFile: false,
                presets: [
                    [
                        presetEnv,
                        {
                            targets: {
                                browsers: babelPresetEnvTargets,
                            },
                            loose: true,
                        },
                    ],
                ],
            }),
        ];
        if (mode === 'production') {
            plugins.push(terser({
                mangle: {
                    toplevel: true,
                    properties: {
                        regex: /(^_|_$)/,
                    },
                },
            }));
        }
        const rollupConfig = {
            plugins,
            input: temporaryFile,
        };
        // Rollup will inline the runtime by default. If we don't want that, we need
        // to add in some additional config.
        if (!inlineWorkboxRuntime) {
            // No lint for omt(), library has no types.
            // eslint-disable-next-line  @typescript-eslint/no-unsafe-call
            rollupConfig.plugins.unshift(omt());
            rollupConfig.manualChunks = (id) => {
                return id.includes('workbox') ? 'workbox' : undefined;
            };
        }
        const bundle = yield rollup(rollupConfig);
        const { output } = yield bundle.generate({
            sourcemap,
            // Using an external Workbox runtime requires 'amd'.
            format: inlineWorkboxRuntime ? 'es' : 'amd',
        });
        const files = [];
        for (const chunkOrAsset of output) {
            if (chunkOrAsset.type === 'asset') {
                files.push({
                    name: chunkOrAsset.fileName,
                    contents: chunkOrAsset.source,
                });
            }
            else {
                let code = chunkOrAsset.code;
                if (chunkOrAsset.map) {
                    const sourceMapFile = chunkOrAsset.fileName + '.map';
                    code += `//# sourceMappingURL=${sourceMapFile}\n`;
                    files.push({
                        name: sourceMapFile,
                        contents: chunkOrAsset.map.toString(),
                    });
                }
                files.push({
                    name: chunkOrAsset.fileName,
                    contents: code,
                });
            }
        }
        // Make sure that if there was a directory portion included in swDest, it's
        // preprended to all of the generated files.
        return files.map((file) => {
            file.name = upath.format({
                dir,
                base: file.name,
                ext: '',
                name: '',
                root: '',
            });
            return file;
        });
    });
}
