"use strict";
exports.__esModule = true;
exports.OutstandingQueries = exports.Query = void 0;
var priority_queue_1 = require("@datastructures-js/priority-queue");
/**
 * Query abstraction with a timestamp, streamID, and queryID
 */
var Query = /** @class */ (function () {
    function Query(timestamp, streamID, queryID) {
        this.timestamp = timestamp;
        this.streamID = streamID;
        this.queryID = queryID;
    }
    return Query;
}());
exports.Query = Query;
/**
 * Comparator for Query Set
 * @param a: implements IQuery (LHS)
 * @param b: implements IQuery (RHS)
 * @public
 */
var compareQueryTimestamps = function (a, b) {
    //if LHS timestamp is greater than RHS, return RHS (right is earlier)
    if (a.timestamp > b.timestamp) {
        return 1;
    }
    //if LHS timestamp is less than RHS, return LHS (left is earlier)
    if (a.timestamp < b.timestamp) {
        return -1;
    }
    //otherwise they are equal, return RHS
    return -1;
};
/**
 * OutstandingQueries tracks a set of all query messages that have been
 * sent to pubsub, for which we are still waiting on a response pubsub
 * message. It also takes care of garbage collecting old queries that
 * have been outstanding for more than 1 minute.
 */
var OutstandingQueries = /** @class */ (function () {
    function OutstandingQueries() {
        this.queryQueue = new priority_queue_1.PriorityQueue(compareQueryTimestamps);
        this.queryMap = new Map();
        //set the time in minutes we want to allow outstanding requests to be considered
        this._minutesThreshold = 1;
    }
    OutstandingQueries.prototype.add = function (id, query) {
        //enforce no duplicate outstanding queries
        this._cleanUpExpiredQueries();
        if (this.queryMap.get(id) == undefined) {
            // add to map
            this.queryMap.set(id, query);
            // add to queue
            this.queryQueue.enqueue(query);
        }
        else {
            //replace query
            this.remove(query);
            this.queryMap.set(id, query);
            this.queryQueue.enqueue(query);
        }
    };
    OutstandingQueries.prototype.remove = function (topQuery) {
        //remove queryId key for top query
        this.queryMap["delete"](topQuery.queryID);
        //dequeue top query
        this.queryQueue.dequeue();
    };
    OutstandingQueries.prototype._isExpired = function (query) {
        var diffMs = Date.now() - (query === null || query === void 0 ? void 0 : query.timestamp); // milliseconds
        var differenceInMinutes = Math.floor(diffMs / 1000 / 60);
        return differenceInMinutes > this._minutesThreshold;
    };
    /**
     * Event-driven method to clean up outdated outstanding queries
     * @param
     * @private
     */
    OutstandingQueries.prototype._cleanUpExpiredQueries = function () {
        while (this._isExpired(this.queryQueue.front())) {
            this.remove(this.queryQueue.front());
        }
    };
    return OutstandingQueries;
}());
exports.OutstandingQueries = OutstandingQueries;
