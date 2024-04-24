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
import { WorkboxError } from 'workbox-core/_private/WorkboxError.js';
import { logger } from 'workbox-core/_private/logger.js';
import { assert } from 'workbox-core/_private/assert.js';
import { getFriendlyURL } from 'workbox-core/_private/getFriendlyURL.js';
import { QueueStore } from './lib/QueueStore.js';
import { StorableRequest } from './lib/StorableRequest.js';
import './_version.js';
const TAG_PREFIX = 'workbox-background-sync';
const MAX_RETENTION_TIME = 60 * 24 * 7; // 7 days in minutes
const queueNames = new Set();
/**
 * Converts a QueueStore entry into the format exposed by Queue. This entails
 * converting the request data into a real request and omitting the `id` and
 * `queueName` properties.
 *
 * @param {UnidentifiedQueueStoreEntry} queueStoreEntry
 * @return {Queue}
 * @private
 */
const convertEntry = (queueStoreEntry) => {
    const queueEntry = {
        request: new StorableRequest(queueStoreEntry.requestData).toRequest(),
        timestamp: queueStoreEntry.timestamp,
    };
    if (queueStoreEntry.metadata) {
        queueEntry.metadata = queueStoreEntry.metadata;
    }
    return queueEntry;
};
/**
 * A class to manage storing failed requests in IndexedDB and retrying them
 * later. All parts of the storing and replaying process are observable via
 * callbacks.
 *
 * @memberof workbox-background-sync
 */
class Queue {
    /**
     * Creates an instance of Queue with the given options
     *
     * @param {string} name The unique name for this queue. This name must be
     *     unique as it's used to register sync events and store requests
     *     in IndexedDB specific to this instance. An error will be thrown if
     *     a duplicate name is detected.
     * @param {Object} [options]
     * @param {Function} [options.onSync] A function that gets invoked whenever
     *     the 'sync' event fires. The function is invoked with an object
     *     containing the `queue` property (referencing this instance), and you
     *     can use the callback to customize the replay behavior of the queue.
     *     When not set the `replayRequests()` method is called.
     *     Note: if the replay fails after a sync event, make sure you throw an
     *     error, so the browser knows to retry the sync event later.
     * @param {number} [options.maxRetentionTime=7 days] The amount of time (in
     *     minutes) a request may be retried. After this amount of time has
     *     passed, the request will be deleted from the queue.
     * @param {boolean} [options.forceSyncFallback=false] If `true`, instead
     *     of attempting to use background sync events, always attempt to replay
     *     queued request at service worker startup. Most folks will not need
     *     this, unless you explicitly target a runtime like Electron that
     *     exposes the interfaces for background sync, but does not have a working
     *     implementation.
     */
    constructor(name, { forceSyncFallback, onSync, maxRetentionTime } = {}) {
        this._syncInProgress = false;
        this._requestsAddedDuringSync = false;
        // Ensure the store name is not already being used
        if (queueNames.has(name)) {
            throw new WorkboxError('duplicate-queue-name', { name });
        }
        else {
            queueNames.add(name);
        }
        this._name = name;
        this._onSync = onSync || this.replayRequests;
        this._maxRetentionTime = maxRetentionTime || MAX_RETENTION_TIME;
        this._forceSyncFallback = Boolean(forceSyncFallback);
        this._queueStore = new QueueStore(this._name);
        this._addSyncListener();
    }
    /**
     * @return {string}
     */
    get name() {
        return this._name;
    }
    /**
     * Stores the passed request in IndexedDB (with its timestamp and any
     * metadata) at the end of the queue.
     *
     * @param {QueueEntry} entry
     * @param {Request} entry.request The request to store in the queue.
     * @param {Object} [entry.metadata] Any metadata you want associated with the
     *     stored request. When requests are replayed you'll have access to this
     *     metadata object in case you need to modify the request beforehand.
     * @param {number} [entry.timestamp] The timestamp (Epoch time in
     *     milliseconds) when the request was first added to the queue. This is
     *     used along with `maxRetentionTime` to remove outdated requests. In
     *     general you don't need to set this value, as it's automatically set
     *     for you (defaulting to `Date.now()`), but you can update it if you
     *     don't want particular requests to expire.
     */
    pushRequest(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.env.NODE_ENV !== 'production') {
                assert.isType(entry, 'object', {
                    moduleName: 'workbox-background-sync',
                    className: 'Queue',
                    funcName: 'pushRequest',
                    paramName: 'entry',
                });
                assert.isInstance(entry.request, Request, {
                    moduleName: 'workbox-background-sync',
                    className: 'Queue',
                    funcName: 'pushRequest',
                    paramName: 'entry.request',
                });
            }
            yield this._addRequest(entry, 'push');
        });
    }
    /**
     * Stores the passed request in IndexedDB (with its timestamp and any
     * metadata) at the beginning of the queue.
     *
     * @param {QueueEntry} entry
     * @param {Request} entry.request The request to store in the queue.
     * @param {Object} [entry.metadata] Any metadata you want associated with the
     *     stored request. When requests are replayed you'll have access to this
     *     metadata object in case you need to modify the request beforehand.
     * @param {number} [entry.timestamp] The timestamp (Epoch time in
     *     milliseconds) when the request was first added to the queue. This is
     *     used along with `maxRetentionTime` to remove outdated requests. In
     *     general you don't need to set this value, as it's automatically set
     *     for you (defaulting to `Date.now()`), but you can update it if you
     *     don't want particular requests to expire.
     */
    unshiftRequest(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.env.NODE_ENV !== 'production') {
                assert.isType(entry, 'object', {
                    moduleName: 'workbox-background-sync',
                    className: 'Queue',
                    funcName: 'unshiftRequest',
                    paramName: 'entry',
                });
                assert.isInstance(entry.request, Request, {
                    moduleName: 'workbox-background-sync',
                    className: 'Queue',
                    funcName: 'unshiftRequest',
                    paramName: 'entry.request',
                });
            }
            yield this._addRequest(entry, 'unshift');
        });
    }
    /**
     * Removes and returns the last request in the queue (along with its
     * timestamp and any metadata). The returned object takes the form:
     * `{request, timestamp, metadata}`.
     *
     * @return {Promise<QueueEntry | undefined>}
     */
    popRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._removeRequest('pop');
        });
    }
    /**
     * Removes and returns the first request in the queue (along with its
     * timestamp and any metadata). The returned object takes the form:
     * `{request, timestamp, metadata}`.
     *
     * @return {Promise<QueueEntry | undefined>}
     */
    shiftRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._removeRequest('shift');
        });
    }
    /**
     * Returns all the entries that have not expired (per `maxRetentionTime`).
     * Any expired entries are removed from the queue.
     *
     * @return {Promise<Array<QueueEntry>>}
     */
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const allEntries = yield this._queueStore.getAll();
            const now = Date.now();
            const unexpiredEntries = [];
            for (const entry of allEntries) {
                // Ignore requests older than maxRetentionTime. Call this function
                // recursively until an unexpired request is found.
                const maxRetentionTimeInMs = this._maxRetentionTime * 60 * 1000;
                if (now - entry.timestamp > maxRetentionTimeInMs) {
                    yield this._queueStore.deleteEntry(entry.id);
                }
                else {
                    unexpiredEntries.push(convertEntry(entry));
                }
            }
            return unexpiredEntries;
        });
    }
    /**
     * Returns the number of entries present in the queue.
     * Note that expired entries (per `maxRetentionTime`) are also included in this count.
     *
     * @return {Promise<number>}
     */
    size() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._queueStore.size();
        });
    }
    /**
     * Adds the entry to the QueueStore and registers for a sync event.
     *
     * @param {Object} entry
     * @param {Request} entry.request
     * @param {Object} [entry.metadata]
     * @param {number} [entry.timestamp=Date.now()]
     * @param {string} operation ('push' or 'unshift')
     * @private
     */
    _addRequest({ request, metadata, timestamp = Date.now() }, operation) {
        return __awaiter(this, void 0, void 0, function* () {
            const storableRequest = yield StorableRequest.fromRequest(request.clone());
            const entry = {
                requestData: storableRequest.toObject(),
                timestamp,
            };
            // Only include metadata if it's present.
            if (metadata) {
                entry.metadata = metadata;
            }
            switch (operation) {
                case 'push':
                    yield this._queueStore.pushEntry(entry);
                    break;
                case 'unshift':
                    yield this._queueStore.unshiftEntry(entry);
                    break;
            }
            if (process.env.NODE_ENV !== 'production') {
                logger.log(`Request for '${getFriendlyURL(request.url)}' has ` +
                    `been added to background sync queue '${this._name}'.`);
            }
            // Don't register for a sync if we're in the middle of a sync. Instead,
            // we wait until the sync is complete and call register if
            // `this._requestsAddedDuringSync` is true.
            if (this._syncInProgress) {
                this._requestsAddedDuringSync = true;
            }
            else {
                yield this.registerSync();
            }
        });
    }
    /**
     * Removes and returns the first or last (depending on `operation`) entry
     * from the QueueStore that's not older than the `maxRetentionTime`.
     *
     * @param {string} operation ('pop' or 'shift')
     * @return {Object|undefined}
     * @private
     */
    _removeRequest(operation) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            let entry;
            switch (operation) {
                case 'pop':
                    entry = yield this._queueStore.popEntry();
                    break;
                case 'shift':
                    entry = yield this._queueStore.shiftEntry();
                    break;
            }
            if (entry) {
                // Ignore requests older than maxRetentionTime. Call this function
                // recursively until an unexpired request is found.
                const maxRetentionTimeInMs = this._maxRetentionTime * 60 * 1000;
                if (now - entry.timestamp > maxRetentionTimeInMs) {
                    return this._removeRequest(operation);
                }
                return convertEntry(entry);
            }
            else {
                return undefined;
            }
        });
    }
    /**
     * Loops through each request in the queue and attempts to re-fetch it.
     * If any request fails to re-fetch, it's put back in the same position in
     * the queue (which registers a retry for the next sync event).
     */
    replayRequests() {
        return __awaiter(this, void 0, void 0, function* () {
            let entry;
            while ((entry = yield this.shiftRequest())) {
                try {
                    yield fetch(entry.request.clone());
                    if (process.env.NODE_ENV !== 'production') {
                        logger.log(`Request for '${getFriendlyURL(entry.request.url)}' ` +
                            `has been replayed in queue '${this._name}'`);
                    }
                }
                catch (error) {
                    yield this.unshiftRequest(entry);
                    if (process.env.NODE_ENV !== 'production') {
                        logger.log(`Request for '${getFriendlyURL(entry.request.url)}' ` +
                            `failed to replay, putting it back in queue '${this._name}'`);
                    }
                    throw new WorkboxError('queue-replay-failed', { name: this._name });
                }
            }
            if (process.env.NODE_ENV !== 'production') {
                logger.log(`All requests in queue '${this.name}' have successfully ` +
                    `replayed; the queue is now empty!`);
            }
        });
    }
    /**
     * Registers a sync event with a tag unique to this instance.
     */
    registerSync() {
        return __awaiter(this, void 0, void 0, function* () {
            // See https://github.com/GoogleChrome/workbox/issues/2393
            if ('sync' in self.registration && !this._forceSyncFallback) {
                try {
                    yield self.registration.sync.register(`${TAG_PREFIX}:${this._name}`);
                }
                catch (err) {
                    // This means the registration failed for some reason, possibly due to
                    // the user disabling it.
                    if (process.env.NODE_ENV !== 'production') {
                        logger.warn(`Unable to register sync event for '${this._name}'.`, err);
                    }
                }
            }
        });
    }
    /**
     * In sync-supporting browsers, this adds a listener for the sync event.
     * In non-sync-supporting browsers, or if _forceSyncFallback is true, this
     * will retry the queue on service worker startup.
     *
     * @private
     */
    _addSyncListener() {
        // See https://github.com/GoogleChrome/workbox/issues/2393
        if ('sync' in self.registration && !this._forceSyncFallback) {
            self.addEventListener('sync', (event) => {
                if (event.tag === `${TAG_PREFIX}:${this._name}`) {
                    if (process.env.NODE_ENV !== 'production') {
                        logger.log(`Background sync for tag '${event.tag}' ` + `has been received`);
                    }
                    const syncComplete = () => __awaiter(this, void 0, void 0, function* () {
                        this._syncInProgress = true;
                        let syncError;
                        try {
                            yield this._onSync({ queue: this });
                        }
                        catch (error) {
                            if (error instanceof Error) {
                                syncError = error;
                                // Rethrow the error. Note: the logic in the finally clause
                                // will run before this gets rethrown.
                                throw syncError;
                            }
                        }
                        finally {
                            // New items may have been added to the queue during the sync,
                            // so we need to register for a new sync if that's happened...
                            // Unless there was an error during the sync, in which
                            // case the browser will automatically retry later, as long
                            // as `event.lastChance` is not true.
                            if (this._requestsAddedDuringSync &&
                                !(syncError && !event.lastChance)) {
                                yield this.registerSync();
                            }
                            this._syncInProgress = false;
                            this._requestsAddedDuringSync = false;
                        }
                    });
                    event.waitUntil(syncComplete());
                }
            });
        }
        else {
            if (process.env.NODE_ENV !== 'production') {
                logger.log(`Background sync replaying without background sync event`);
            }
            // If the browser doesn't support background sync, or the developer has
            // opted-in to not using it, retry every time the service worker starts up
            // as a fallback.
            void this._onSync({ queue: this });
        }
    }
    /**
     * Returns the set of queue names. This is primarily used to reset the list
     * of queue names in tests.
     *
     * @return {Set<string>}
     *
     * @private
     */
    static get _queueNames() {
        return queueNames;
    }
}
export { Queue };
