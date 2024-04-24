var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
import { setCatchHandler } from 'workbox-routing/setCatchHandler.js';
import { matchPrecache } from 'workbox-precaching/matchPrecache.js';
import './_version.js';
/**
 * An implementation of the [comprehensive fallbacks recipe]{@link https://developers.google.com/web/tools/workbox/guides/advanced-recipes#comprehensive_fallbacks}. Be sure to include the fallbacks in your precache injection
 *
 * @memberof workbox-recipes
 *
 * @param {Object} [options]
 * @param {string} [options.pageFallback] Precache name to match for pag fallbacks. Defaults to offline.html
 * @param {string} [options.imageFallback] Precache name to match for image fallbacks.
 * @param {string} [options.fontFallback] Precache name to match for font fallbacks.
 */
function offlineFallback(options = {}) {
    const pageFallback = options.pageFallback || 'offline.html';
    const imageFallback = options.imageFallback || false;
    const fontFallback = options.fontFallback || false;
    self.addEventListener('install', (event) => {
        const files = [pageFallback];
        if (imageFallback) {
            files.push(imageFallback);
        }
        if (fontFallback) {
            files.push(fontFallback);
        }
        event.waitUntil(self.caches
            .open('workbox-offline-fallbacks')
            .then((cache) => cache.addAll(files)));
    });
    const handler = (options) => __awaiter(this, void 0, void 0, function* () {
        const dest = options.request.destination;
        const cache = yield self.caches.open('workbox-offline-fallbacks');
        if (dest === 'document') {
            const match = (yield matchPrecache(pageFallback)) ||
                (yield cache.match(pageFallback));
            return match || Response.error();
        }
        if (dest === 'image' && imageFallback !== false) {
            const match = (yield matchPrecache(imageFallback)) ||
                (yield cache.match(imageFallback));
            return match || Response.error();
        }
        if (dest === 'font' && fontFallback !== false) {
            const match = (yield matchPrecache(fontFallback)) ||
                (yield cache.match(fontFallback));
            return match || Response.error();
        }
        return Response.error();
    });
    setCatchHandler(handler);
}
export { offlineFallback };
