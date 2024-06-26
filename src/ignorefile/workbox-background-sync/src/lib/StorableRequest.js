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
import '../_version.js';
const serializableProperties = [
    'method',
    'referrer',
    'referrerPolicy',
    'mode',
    'credentials',
    'cache',
    'redirect',
    'integrity',
    'keepalive',
];
/**
 * A class to make it easier to serialize and de-serialize requests so they
 * can be stored in IndexedDB.
 *
 * Most developers will not need to access this class directly;
 * it is exposed for advanced use cases.
 */
class StorableRequest {
    /**
     * Converts a Request object to a plain object that can be structured
     * cloned or JSON-stringified.
     *
     * @param {Request} request
     * @return {Promise<StorableRequest>}
     */
    static fromRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestData = {
                url: request.url,
                headers: {},
            };
            // Set the body if present.
            if (request.method !== 'GET') {
                // Use ArrayBuffer to support non-text request bodies.
                // NOTE: we can't use Blobs becuse Safari doesn't support storing
                // Blobs in IndexedDB in some cases:
                // https://github.com/dfahlander/Dexie.js/issues/618#issuecomment-398348457
                requestData.body = yield request.clone().arrayBuffer();
            }
            // Convert the headers from an iterable to an object.
            for (const [key, value] of request.headers.entries()) {
                requestData.headers[key] = value;
            }
            // Add all other serializable request properties
            for (const prop of serializableProperties) {
                if (request[prop] !== undefined) {
                    requestData[prop] = request[prop];
                }
            }
            return new StorableRequest(requestData);
        });
    }
    /**
     * Accepts an object of request data that can be used to construct a
     * `Request` but can also be stored in IndexedDB.
     *
     * @param {Object} requestData An object of request data that includes the
     *     `url` plus any relevant properties of
     *     [requestInit]{@link https://fetch.spec.whatwg.org/#requestinit}.
     */
    constructor(requestData) {
        if (process.env.NODE_ENV !== 'production') {
            assert.isType(requestData, 'object', {
                moduleName: 'workbox-background-sync',
                className: 'StorableRequest',
                funcName: 'constructor',
                paramName: 'requestData',
            });
            assert.isType(requestData.url, 'string', {
                moduleName: 'workbox-background-sync',
                className: 'StorableRequest',
                funcName: 'constructor',
                paramName: 'requestData.url',
            });
        }
        // If the request's mode is `navigate`, convert it to `same-origin` since
        // navigation requests can't be constructed via script.
        if (requestData['mode'] === 'navigate') {
            requestData['mode'] = 'same-origin';
        }
        this._requestData = requestData;
    }
    /**
     * Returns a deep clone of the instances `_requestData` object.
     *
     * @return {Object}
     */
    toObject() {
        const requestData = Object.assign({}, this._requestData);
        requestData.headers = Object.assign({}, this._requestData.headers);
        if (requestData.body) {
            requestData.body = requestData.body.slice(0);
        }
        return requestData;
    }
    /**
     * Converts this instance to a Request.
     *
     * @return {Request}
     */
    toRequest() {
        return new Request(this._requestData.url, this._requestData);
    }
    /**
     * Creates and returns a deep clone of the instance.
     *
     * @return {StorableRequest}
     */
    clone() {
        return new StorableRequest(this.toObject());
    }
}
export { StorableRequest };
