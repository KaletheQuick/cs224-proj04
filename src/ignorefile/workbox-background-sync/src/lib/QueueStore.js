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
import { QueueDb, } from './QueueDb.js';
import '../_version.js';
/**
 * A class to manage storing requests from a Queue in IndexedDB,
 * indexed by their queue name for easier access.
 *
 * Most developers will not need to access this class directly;
 * it is exposed for advanced use cases.
 */
export class QueueStore {
    /**
     * Associates this instance with a Queue instance, so entries added can be
     * identified by their queue name.
     *
     * @param {string} queueName
     */
    constructor(queueName) {
        this._queueName = queueName;
        this._queueDb = new QueueDb();
    }
    /**
     * Append an entry last in the queue.
     *
     * @param {Object} entry
     * @param {Object} entry.requestData
     * @param {number} [entry.timestamp]
     * @param {Object} [entry.metadata]
     */
    pushEntry(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.env.NODE_ENV !== 'production') {
                assert.isType(entry, 'object', {
                    moduleName: 'workbox-background-sync',
                    className: 'QueueStore',
                    funcName: 'pushEntry',
                    paramName: 'entry',
                });
                assert.isType(entry.requestData, 'object', {
                    moduleName: 'workbox-background-sync',
                    className: 'QueueStore',
                    funcName: 'pushEntry',
                    paramName: 'entry.requestData',
                });
            }
            // Don't specify an ID since one is automatically generated.
            delete entry.id;
            entry.queueName = this._queueName;
            yield this._queueDb.addEntry(entry);
        });
    }
    /**
     * Prepend an entry first in the queue.
     *
     * @param {Object} entry
     * @param {Object} entry.requestData
     * @param {number} [entry.timestamp]
     * @param {Object} [entry.metadata]
     */
    unshiftEntry(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.env.NODE_ENV !== 'production') {
                assert.isType(entry, 'object', {
                    moduleName: 'workbox-background-sync',
                    className: 'QueueStore',
                    funcName: 'unshiftEntry',
                    paramName: 'entry',
                });
                assert.isType(entry.requestData, 'object', {
                    moduleName: 'workbox-background-sync',
                    className: 'QueueStore',
                    funcName: 'unshiftEntry',
                    paramName: 'entry.requestData',
                });
            }
            const firstId = yield this._queueDb.getFirstEntryId();
            if (firstId) {
                // Pick an ID one less than the lowest ID in the object store.
                entry.id = firstId - 1;
            }
            else {
                // Otherwise let the auto-incrementor assign the ID.
                delete entry.id;
            }
            entry.queueName = this._queueName;
            yield this._queueDb.addEntry(entry);
        });
    }
    /**
     * Removes and returns the last entry in the queue matching the `queueName`.
     *
     * @return {Promise<QueueStoreEntry|undefined>}
     */
    popEntry() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._removeEntry(yield this._queueDb.getLastEntryByQueueName(this._queueName));
        });
    }
    /**
     * Removes and returns the first entry in the queue matching the `queueName`.
     *
     * @return {Promise<QueueStoreEntry|undefined>}
     */
    shiftEntry() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._removeEntry(yield this._queueDb.getFirstEntryByQueueName(this._queueName));
        });
    }
    /**
     * Returns all entries in the store matching the `queueName`.
     *
     * @param {Object} options See {@link workbox-background-sync.Queue~getAll}
     * @return {Promise<Array<Object>>}
     */
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._queueDb.getAllEntriesByQueueName(this._queueName);
        });
    }
    /**
     * Returns the number of entries in the store matching the `queueName`.
     *
     * @param {Object} options See {@link workbox-background-sync.Queue~size}
     * @return {Promise<number>}
     */
    size() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._queueDb.getEntryCountByQueueName(this._queueName);
        });
    }
    /**
     * Deletes the entry for the given ID.
     *
     * WARNING: this method does not ensure the deleted entry belongs to this
     * queue (i.e. matches the `queueName`). But this limitation is acceptable
     * as this class is not publicly exposed. An additional check would make
     * this method slower than it needs to be.
     *
     * @param {number} id
     */
    deleteEntry(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._queueDb.deleteEntry(id);
        });
    }
    /**
     * Removes and returns the first or last entry in the queue (based on the
     * `direction` argument) matching the `queueName`.
     *
     * @return {Promise<QueueStoreEntry|undefined>}
     * @private
     */
    _removeEntry(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entry) {
                yield this.deleteEntry(entry.id);
            }
            return entry;
        });
    }
}
