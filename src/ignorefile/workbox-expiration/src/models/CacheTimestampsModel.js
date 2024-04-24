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
import { openDB, deleteDB } from 'idb';
import '../_version.js';
const DB_NAME = 'workbox-expiration';
const CACHE_OBJECT_STORE = 'cache-entries';
const normalizeURL = (unNormalizedUrl) => {
    const url = new URL(unNormalizedUrl, location.href);
    url.hash = '';
    return url.href;
};
/**
 * Returns the timestamp model.
 *
 * @private
 */
class CacheTimestampsModel {
    /**
     *
     * @param {string} cacheName
     *
     * @private
     */
    constructor(cacheName) {
        this._db = null;
        this._cacheName = cacheName;
    }
    /**
     * Performs an upgrade of indexedDB.
     *
     * @param {IDBPDatabase<CacheDbSchema>} db
     *
     * @private
     */
    _upgradeDb(db) {
        // TODO(philipwalton): EdgeHTML doesn't support arrays as a keyPath, so we
        // have to use the `id` keyPath here and create our own values (a
        // concatenation of `url + cacheName`) instead of simply using
        // `keyPath: ['url', 'cacheName']`, which is supported in other browsers.
        const objStore = db.createObjectStore(CACHE_OBJECT_STORE, { keyPath: 'id' });
        // TODO(philipwalton): once we don't have to support EdgeHTML, we can
        // create a single index with the keyPath `['cacheName', 'timestamp']`
        // instead of doing both these indexes.
        objStore.createIndex('cacheName', 'cacheName', { unique: false });
        objStore.createIndex('timestamp', 'timestamp', { unique: false });
    }
    /**
     * Performs an upgrade of indexedDB and deletes deprecated DBs.
     *
     * @param {IDBPDatabase<CacheDbSchema>} db
     *
     * @private
     */
    _upgradeDbAndDeleteOldDbs(db) {
        this._upgradeDb(db);
        if (this._cacheName) {
            void deleteDB(this._cacheName);
        }
    }
    /**
     * @param {string} url
     * @param {number} timestamp
     *
     * @private
     */
    setTimestamp(url, timestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            url = normalizeURL(url);
            const entry = {
                url,
                timestamp,
                cacheName: this._cacheName,
                // Creating an ID from the URL and cache name won't be necessary once
                // Edge switches to Chromium and all browsers we support work with
                // array keyPaths.
                id: this._getId(url),
            };
            const db = yield this.getDb();
            const tx = db.transaction(CACHE_OBJECT_STORE, 'readwrite', {
                durability: 'relaxed',
            });
            yield tx.store.put(entry);
            yield tx.done;
        });
    }
    /**
     * Returns the timestamp stored for a given URL.
     *
     * @param {string} url
     * @return {number | undefined}
     *
     * @private
     */
    getTimestamp(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            const entry = yield db.get(CACHE_OBJECT_STORE, this._getId(url));
            return entry === null || entry === void 0 ? void 0 : entry.timestamp;
        });
    }
    /**
     * Iterates through all the entries in the object store (from newest to
     * oldest) and removes entries once either `maxCount` is reached or the
     * entry's timestamp is less than `minTimestamp`.
     *
     * @param {number} minTimestamp
     * @param {number} maxCount
     * @return {Array<string>}
     *
     * @private
     */
    expireEntries(minTimestamp, maxCount) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            let cursor = yield db
                .transaction(CACHE_OBJECT_STORE)
                .store.index('timestamp')
                .openCursor(null, 'prev');
            const entriesToDelete = [];
            let entriesNotDeletedCount = 0;
            while (cursor) {
                const result = cursor.value;
                // TODO(philipwalton): once we can use a multi-key index, we
                // won't have to check `cacheName` here.
                if (result.cacheName === this._cacheName) {
                    // Delete an entry if it's older than the max age or
                    // if we already have the max number allowed.
                    if ((minTimestamp && result.timestamp < minTimestamp) ||
                        (maxCount && entriesNotDeletedCount >= maxCount)) {
                        // TODO(philipwalton): we should be able to delete the
                        // entry right here, but doing so causes an iteration
                        // bug in Safari stable (fixed in TP). Instead we can
                        // store the keys of the entries to delete, and then
                        // delete the separate transactions.
                        // https://github.com/GoogleChrome/workbox/issues/1978
                        // cursor.delete();
                        // We only need to return the URL, not the whole entry.
                        entriesToDelete.push(cursor.value);
                    }
                    else {
                        entriesNotDeletedCount++;
                    }
                }
                cursor = yield cursor.continue();
            }
            // TODO(philipwalton): once the Safari bug in the following issue is fixed,
            // we should be able to remove this loop and do the entry deletion in the
            // cursor loop above:
            // https://github.com/GoogleChrome/workbox/issues/1978
            const urlsDeleted = [];
            for (const entry of entriesToDelete) {
                yield db.delete(CACHE_OBJECT_STORE, entry.id);
                urlsDeleted.push(entry.url);
            }
            return urlsDeleted;
        });
    }
    /**
     * Takes a URL and returns an ID that will be unique in the object store.
     *
     * @param {string} url
     * @return {string}
     *
     * @private
     */
    _getId(url) {
        // Creating an ID from the URL and cache name won't be necessary once
        // Edge switches to Chromium and all browsers we support work with
        // array keyPaths.
        return this._cacheName + '|' + normalizeURL(url);
    }
    /**
     * Returns an open connection to the database.
     *
     * @private
     */
    getDb() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._db) {
                this._db = yield openDB(DB_NAME, 1, {
                    upgrade: this._upgradeDbAndDeleteOldDbs.bind(this),
                });
            }
            return this._db;
        });
    }
}
export { CacheTimestampsModel };
