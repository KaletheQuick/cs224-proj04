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
import { timeout } from 'workbox-core/_private/timeout.js';
import { WorkboxError } from 'workbox-core/_private/WorkboxError.js';
import { Strategy } from './Strategy.js';
import { messages } from './utils/messages.js';
import './_version.js';
/**
 * An implementation of a
 * [network-only](https://developer.chrome.com/docs/workbox/caching-strategies-overview/#network-only)
 * request strategy.
 *
 * This class is useful if you want to take advantage of any
 * [Workbox plugins](https://developer.chrome.com/docs/workbox/using-plugins/).
 *
 * If the network request fails, this will throw a `WorkboxError` exception.
 *
 * @extends workbox-strategies.Strategy
 * @memberof workbox-strategies
 */
class NetworkOnly extends Strategy {
    /**
     * @param {Object} [options]
     * @param {Array<Object>} [options.plugins] [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
     * to use in conjunction with this caching strategy.
     * @param {Object} [options.fetchOptions] Values passed along to the
     * [`init`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
     * of [non-navigation](https://github.com/GoogleChrome/workbox/issues/1796)
     * `fetch()` requests made by this strategy.
     * @param {number} [options.networkTimeoutSeconds] If set, any network requests
     * that fail to respond within the timeout will result in a network error.
     */
    constructor(options = {}) {
        super(options);
        this._networkTimeoutSeconds = options.networkTimeoutSeconds || 0;
    }
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
                    funcName: '_handle',
                    paramName: 'request',
                });
            }
            let error = undefined;
            let response;
            try {
                const promises = [
                    handler.fetch(request),
                ];
                if (this._networkTimeoutSeconds) {
                    const timeoutPromise = timeout(this._networkTimeoutSeconds * 1000);
                    promises.push(timeoutPromise);
                }
                response = yield Promise.race(promises);
                if (!response) {
                    throw new Error(`Timed out the network response after ` +
                        `${this._networkTimeoutSeconds} seconds.`);
                }
            }
            catch (err) {
                if (err instanceof Error) {
                    error = err;
                }
            }
            if (process.env.NODE_ENV !== 'production') {
                logger.groupCollapsed(messages.strategyStart(this.constructor.name, request));
                if (response) {
                    logger.log(`Got response from network.`);
                }
                else {
                    logger.log(`Unable to get a response from the network.`);
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
export { NetworkOnly };
