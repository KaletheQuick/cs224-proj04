/*
  Copyright 2021 Google LLC

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
import { openDB } from 'idb';
import '../_version.js';
const DB_VERSION = 3;
const DB_NAME = 'workbox-background-sync';
const REQUEST_OBJECT_STORE_NAME = 'requests';
const QUEUE_NAME_INDEX = 'queueName';
/**
 * A class to interact directly an IndexedDB created specifically to save and
 * retrieve QueueStoreEntries. This class encapsulates all the schema details
 * to store the representation of a Queue.
 *
 * @private
 */
export class QueueDb {
    constructor() {
        this._db = null;
    }
    /**
     * Add QueueStoreEntry to underlying db.
     *
     * @param {UnidentifiedQueueStoreEntry} entry
     */
    addEntry(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            const tx = db.transaction(REQUEST_OBJECT_STORE_NAME, 'readwrite', {
                durability: 'relaxed',
            });
            yield tx.store.add(entry);
            yield tx.done;
        });
    }
    /**
     * Returns the first entry id in the ObjectStore.
     *
     * @return {number | undefined}
     */
    getFirstEntryId() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            const cursor = yield db
                .transaction(REQUEST_OBJECT_STORE_NAME)
                .store.openCursor();
            return cursor === null || cursor === void 0 ? void 0 : cursor.value.id;
        });
    }
    /**
     * Get all the entries filtered by index
     *
     * @param queueName
     * @return {Promise<QueueStoreEntry[]>}
     */
    getAllEntriesByQueueName(queueName) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            const results = yield db.getAllFromIndex(REQUEST_OBJECT_STORE_NAME, QUEUE_NAME_INDEX, IDBKeyRange.only(queueName));
            return results ? results : new Array();
        });
    }
    /**
     * Returns the number of entries filtered by index
     *
     * @param queueName
     * @return {Promise<number>}
     */
    getEntryCountByQueueName(queueName) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            return db.countFromIndex(REQUEST_OBJECT_STORE_NAME, QUEUE_NAME_INDEX, IDBKeyRange.only(queueName));
        });
    }
    /**
     * Deletes a single entry by id.
     *
     * @param {number} id the id of the entry to be deleted
     */
    deleteEntry(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            yield db.delete(REQUEST_OBJECT_STORE_NAME, id);
        });
    }
    /**
     *
     * @param queueName
     * @returns {Promise<QueueStoreEntry | undefined>}
     */
    getFirstEntryByQueueName(queueName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getEndEntryFromIndex(IDBKeyRange.only(queueName), 'next');
        });
    }
    /**
     *
     * @param queueName
     * @returns {Promise<QueueStoreEntry | undefined>}
     */
    getLastEntryByQueueName(queueName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getEndEntryFromIndex(IDBKeyRange.only(queueName), 'prev');
        });
    }
    /**
     * Returns either the first or the last entries, depending on direction.
     * Filtered by index.
     *
     * @param {IDBCursorDirection} direction
     * @param {IDBKeyRange} query
     * @return {Promise<QueueStoreEntry | undefined>}
     * @private
     */
    getEndEntryFromIndex(query, direction) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            const cursor = yield db
                .transaction(REQUEST_OBJECT_STORE_NAME)
                .store.index(QUEUE_NAME_INDEX)
                .openCursor(query, direction);
            return cursor === null || cursor === void 0 ? void 0 : cursor.value;
        });
    }
    /**
     * Returns an open connection to the database.
     *
     * @private
     */
    getDb() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._db) {
                this._db = yield openDB(DB_NAME, DB_VERSION, {
                    upgrade: this._upgradeDb,
                });
            }
            return this._db;
        });
    }
    /**
     * Upgrades QueueDB
     *
     * @param {IDBPDatabase<QueueDBSchema>} db
     * @param {number} oldVersion
     * @private
     */
    _upgradeDb(db, oldVersion) {
        if (oldVersion > 0 && oldVersion < DB_VERSION) {
            if (db.objectStoreNames.contains(REQUEST_OBJECT_STORE_NAME)) {
                db.deleteObjectStore(REQUEST_OBJECT_STORE_NAME);
            }
        }
        const objStore = db.createObjectStore(REQUEST_OBJECT_STORE_NAME, {
            autoIncrement: true,
            keyPath: 'id',
        });
        objStore.createIndex(QUEUE_NAME_INDEX, QUEUE_NAME_INDEX, { unique: false });
    }
}
