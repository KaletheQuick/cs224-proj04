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
import { logger } from 'workbox-core/_private/logger.js';
import { createHeaders } from './utils/createHeaders.js';
import { concatenateToResponse } from './concatenateToResponse.js';
import { isSupported } from './isSupported.js';
import './_version.js';
/**
 * A shortcut to create a strategy that could be dropped-in to Workbox's router.
 *
 * On browsers that do not support constructing new `ReadableStream`s, this
 * strategy will automatically wait for all the `sourceFunctions` to complete,
 * and create a final response that concatenates their values together.
 *
 * @param {Array<function({event, request, url, params})>} sourceFunctions
 * An array of functions similar to {@link workbox-routing~handlerCallback}
 * but that instead return a {@link workbox-streams.StreamSource} (or a
 * Promise which resolves to one).
 * @param {HeadersInit} [headersInit] If there's no `Content-Type` specified,
 * `'text/html'` will be used by default.
 * @return {workbox-routing~handlerCallback}
 * @memberof workbox-streams
 */
function strategy(sourceFunctions, headersInit) {
    return ({ event, request, url, params }) => __awaiter(this, void 0, void 0, function* () {
        const sourcePromises = sourceFunctions.map((fn) => {
            // Ensure the return value of the function is always a promise.
            return Promise.resolve(fn({ event, request, url, params }));
        });
        if (isSupported()) {
            const { done, response } = concatenateToResponse(sourcePromises, headersInit);
            if (event) {
                event.waitUntil(done);
            }
            return response;
        }
        if (process.env.NODE_ENV !== 'production') {
            logger.log(`The current browser doesn't support creating response ` +
                `streams. Falling back to non-streaming response instead.`);
        }
        // Fallback to waiting for everything to finish, and concatenating the
        // responses.
        const blobPartsPromises = sourcePromises.map((sourcePromise) => __awaiter(this, void 0, void 0, function* () {
            const source = yield sourcePromise;
            if (source instanceof Response) {
                return source.blob();
            }
            else {
                // Technically, a `StreamSource` object can include any valid
                // `BodyInit` type, including `FormData` and `URLSearchParams`, which
                // cannot be passed to the Blob constructor directly, so we have to
                // convert them to actual Blobs first.
                return new Response(source).blob();
            }
        }));
        const blobParts = yield Promise.all(blobPartsPromises);
        const headers = createHeaders(headersInit);
        // Constructing a new Response from a Blob source is well-supported.
        // So is constructing a new Blob from multiple source Blobs or strings.
        return new Response(new Blob(blobParts), { headers });
    });
}
export { strategy };
