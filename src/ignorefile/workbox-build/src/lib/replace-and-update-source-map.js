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
import { SourceMapConsumer, SourceMapGenerator } from 'source-map';
/**
 * Adapted from https://github.com/nsams/sourcemap-aware-replace, with modern
 * JavaScript updates, along with additional properties copied from originalMap.
 *
 * @param {Object} options
 * @param {string} options.jsFilename The name for the file whose contents
 * correspond to originalSource.
 * @param {Object} options.originalMap The sourcemap for originalSource,
 * prior to any replacements.
 * @param {string} options.originalSource The source code, prior to any
 * replacements.
 * @param {string} options.replaceString A string to swap in for searchString.
 * @param {string} options.searchString A string in originalSource to replace.
 * Only the first occurrence will be replaced.
 * @return {{source: string, map: string}} An object containing both
 * originalSource with the replacement applied, and the modified originalMap.
 *
 * @private
 */
export function replaceAndUpdateSourceMap({ jsFilename, originalMap, originalSource, replaceString, searchString, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const generator = new SourceMapGenerator({
            file: jsFilename,
        });
        const consumer = yield new SourceMapConsumer(originalMap);
        let pos;
        let src = originalSource;
        const replacements = [];
        let lineNum = 0;
        let filePos = 0;
        const lines = src.split('\n');
        for (let line of lines) {
            lineNum++;
            let searchPos = 0;
            while ((pos = line.indexOf(searchString, searchPos)) !== -1) {
                src =
                    src.substring(0, filePos + pos) +
                        replaceString +
                        src.substring(filePos + pos + searchString.length);
                line =
                    line.substring(0, pos) +
                        replaceString +
                        line.substring(pos + searchString.length);
                replacements.push({ line: lineNum, column: pos });
                searchPos = pos + replaceString.length;
            }
            filePos += line.length + 1;
        }
        replacements.reverse();
        consumer.eachMapping((mapping) => {
            for (const replacement of replacements) {
                if (replacement.line === mapping.generatedLine &&
                    mapping.generatedColumn > replacement.column) {
                    const offset = searchString.length - replaceString.length;
                    mapping.generatedColumn -= offset;
                }
            }
            if (mapping.source) {
                const newMapping = {
                    generated: {
                        line: mapping.generatedLine,
                        column: mapping.generatedColumn,
                    },
                    original: {
                        line: mapping.originalLine,
                        column: mapping.originalColumn,
                    },
                    source: mapping.source,
                };
                return generator.addMapping(newMapping);
            }
            return mapping;
        });
        consumer.destroy();
        // JSON.parse returns any.
        // eslint-disable-next-line  @typescript-eslint/no-unsafe-assignment
        const updatedSourceMap = Object.assign(JSON.parse(generator.toString()), {
            names: originalMap.names,
            sourceRoot: originalMap.sourceRoot,
            sources: originalMap.sources,
            sourcesContent: originalMap.sourcesContent,
        });
        return {
            map: JSON.stringify(updatedSourceMap),
            source: src,
        };
    });
}
