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
import { logger } from '../_private/logger.js';
import { quotaErrorCallbacks } from '../models/quotaErrorCallbacks.js';
import '../_version.js';
/**
 * Runs all of the callback functions, one at a time sequentially, in the order
 * in which they were registered.
 *
 * @memberof workbox-core
 * @private
 */
function executeQuotaErrorCallbacks() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.NODE_ENV !== 'production') {
            logger.log(`About to run ${quotaErrorCallbacks.size} ` +
                `callbacks to clean up caches.`);
        }
        for (const callback of quotaErrorCallbacks) {
            yield callback();
            if (process.env.NODE_ENV !== 'production') {
                logger.log(callback, 'is complete.');
            }
        }
        if (process.env.NODE_ENV !== 'production') {
            logger.log('Finished running callbacks.');
        }
    });
}
export { executeQuotaErrorCallbacks };
