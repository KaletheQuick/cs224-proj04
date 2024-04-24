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
import { assert } from 'workbox-core/_private/assert.js';
import { logger } from 'workbox-core/_private/logger.js';
import { WorkboxError } from 'workbox-core/_private/WorkboxError.js';
import { Strategy } from './Strategy.js';
import { messages } from './utils/messages.js';
import './_version.js';
/**
 * An implementation of a [cache-only](https://developer.chrome.com/docs/workbox/caching-strategies-overview/#cache-only)
 * request strategy.
 *
 * This class is useful if you want to take advantage of any
 * [Workbox plugins](https://developer.chrome.com/docs/workbox/using-plugins/).
 *
 * If there is no cache match, this will throw a `WorkboxError` exception.
 *
 * @extends workbox-strategies.Strategy
 * @memberof workbox-strategies
 */
class CacheOnly extends Strategy {
    /**
     * @private
     * @param {Request|string} request A request to run this strategy for.
     * @param {workbox-strategies.StrategyHandler} handler The event that
     *     triggered the request.
     * @return {Promise<Response>}
     */
    _handle(request, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.env.NODE_ENV !== 'production') {
                assert.isInstance(request, Request, {
                    moduleName: 'workbox-strategies',
                    className: this.constructor.name,
                    funcName: 'makeRequest',
                    paramName: 'request',
                });
            }
            const response = yield handler.cacheMatch(request);
            if (process.env.NODE_ENV !== 'production') {
                logger.groupCollapsed(messages.strategyStart(this.constructor.name, request));
                if (response) {
                    logger.log(`Found a cached response in the '${this.cacheName}' ` + `cache.`);
                    messages.printFinalResponse(response);
                }
                else {
                    logger.log(`No response found in the '${this.cacheName}' cache.`);
                }
                logger.groupEnd();
            }
            if (!response) {
                throw new WorkboxError('no-response', { url: request.url });
            }
            return response;
        });
    }
}
export { CacheOnly };
