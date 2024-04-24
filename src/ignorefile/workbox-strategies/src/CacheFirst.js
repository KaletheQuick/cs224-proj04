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
 * An implementation of a [cache-first](https://developer.chrome.com/docs/workbox/caching-strategies-overview/#cache-first-falling-back-to-network)
 * request strategy.
 *
 * A cache first strategy is useful for assets that have been revisioned,
 * such as URLs like `/styles/example.a8f5f1.css`, since they
 * can be cached for long periods of time.
 *
 * If the network request fails, and there is no cache match, this will throw
 * a `WorkboxError` exception.
 *
 * @extends workbox-strategies.Strategy
 * @memberof workbox-strategies
 */
class CacheFirst extends Strategy {
    /**
     * @private
     * @param {Request|string} request A request to run this strategy for.
     * @param {workbox-strategies.StrategyHandler} handler The event that
     *     triggered the request.
     * @return {Promise<Response>}
     */
    _handle(request, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            const logs = [];
            if (process.env.NODE_ENV !== 'production') {
                assert.isInstance(request, Request, {
                    moduleName: 'workbox-strategies',
                    className: this.constructor.name,
                    funcName: 'makeRequest',
                    paramName: 'request',
                });
            }
            let response = yield handler.cacheMatch(request);
            let error = undefined;
            if (!response) {
                if (process.env.NODE_ENV !== 'production') {
                    logs.push(`No response found in the '${this.cacheName}' cache. ` +
                        `Will respond with a network request.`);
                }
                try {
                    response = yield handler.fetchAndCachePut(request);
                }
                catch (err) {
                    if (err instanceof Error) {
                        error = err;
                    }
                }
                if (process.env.NODE_ENV !== 'production') {
                    if (response) {
                        logs.push(`Got response from network.`);
                    }
                    else {
                        logs.push(`Unable to get a response from the network.`);
                    }
                }
            }
            else {
                if (process.env.NODE_ENV !== 'production') {
                    logs.push(`Found a cached response in the '${this.cacheName}' cache.`);
                }
            }
            if (process.env.NODE_ENV !== 'production') {
                logger.groupCollapsed(messages.strategyStart(this.constructor.name, request));
                for (const log of logs) {
                    logger.log(log);
                }
                messages.printFinalResponse(response);
                logger.groupEnd();
            }
            if (!response) {
                throw new WorkboxError('no-response', { url: request.url, error });
            }
            return response;
        });
    }
}
export { CacheFirst };
