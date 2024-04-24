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
import { Queue } from './Queue.js';
import './_version.js';
/**
 * A class implementing the `fetchDidFail` lifecycle callback. This makes it
 * easier to add failed requests to a background sync Queue.
 *
 * @memberof workbox-background-sync
 */
class BackgroundSyncPlugin {
    /**
     * @param {string} name See the {@link workbox-background-sync.Queue}
     *     documentation for parameter details.
     * @param {Object} [options] See the
     *     {@link workbox-background-sync.Queue} documentation for
     *     parameter details.
     */
    constructor(name, options) {
        /**
         * @param {Object} options
         * @param {Request} options.request
         * @private
         */
        this.fetchDidFail = ({ request }) => __awaiter(this, void 0, void 0, function* () {
            yield this._queue.pushRequest({ request });
        });
        this._queue = new Queue(name, options);
    }
}
export { BackgroundSyncPlugin };
