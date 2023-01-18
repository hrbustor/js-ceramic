"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.MessageBus = exports.MAX_RESPONSE_INTERVAL = void 0;
var pubsub_message_js_1 = require("./pubsub-message.js");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var outstanding_queries_js_1 = require("./outstanding-queries.js");
exports.MAX_RESPONSE_INTERVAL = 300; // milliseconds
/**
 * Stop emitting if +betweenMs+ passed since the last emitted value.
 *
 * @param betweenMs - max interval between the sequential values.
 */
function betweenTimeout(betweenMs) {
    var stop = new rxjs_1.Subject();
    var trigger = undefined;
    return (0, rxjs_1.pipe)((0, operators_1.tap)(function () {
        if (trigger)
            clearTimeout(trigger);
        trigger = setTimeout(function () {
            stop.next(true);
        }, betweenMs);
    }), (0, operators_1.takeUntil)(stop));
}
/**
 * Multiplexing IPFS Pubsub.
 */
var MessageBus = /** @class */ (function (_super) {
    __extends(MessageBus, _super);
    function MessageBus(pubsub) {
        var _this = _super.call(this, function (subscriber) {
            _this.feed$.subscribe(subscriber);
        }) || this;
        _this.pubsub = pubsub;
        _this.outstandingQueries = new outstanding_queries_js_1.OutstandingQueries();
        _this.feed$ = new rxjs_1.Subject();
        _this.pubsubSubscription = _this.pubsub.subscribe(_this.feed$);
        return _this;
    }
    Object.defineProperty(MessageBus.prototype, "closed", {
        /**
         * Return true if stopped. Necessary for SubscriptionLike interface.
         */
        get: function () {
            return this.feed$.isStopped;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Publish message to Pubsub. If closed, return empty subscription.
     */
    MessageBus.prototype.next = function (message) {
        if (this.closed) {
            return rxjs_1.Subscription.EMPTY;
        }
        else {
            return this.pubsub.next(message);
        }
    };
    /**
     * Query network for tips of a stream.
     *
     * Sends query message to a network, adding the message id to outstandingQueries.
     * Returns CID of the tip based on response message.
     */
    MessageBus.prototype.queryNetwork = function (streamId) {
        var queryMessage = (0, pubsub_message_js_1.buildQueryMessage)(streamId);
        this.next(queryMessage);
        var timeNow = Date.now();
        var query = new outstanding_queries_js_1.Query(timeNow, streamId, queryMessage.id);
        //add query to outstanding query set
        this.outstandingQueries.add(queryMessage.id, query);
        return this.pipe((0, operators_1.filter)(function (message) {
            return message.typ === pubsub_message_js_1.MsgType.RESPONSE && message.id === queryMessage.id;
        }), (0, operators_1.map)(function (message) { return message.tips.get(streamId.toString()); }), (0, operators_1.filter)(function (tip) { return !!tip; }), betweenTimeout(exports.MAX_RESPONSE_INTERVAL));
    };
    /**
     * Stop the message feed.
     */
    MessageBus.prototype.unsubscribe = function () {
        this.pubsubSubscription.unsubscribe();
        this.feed$.complete();
    };
    return MessageBus;
}(rxjs_1.Observable));
exports.MessageBus = MessageBus;
