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
exports.PubsubRateLimit = void 0;
var p_queue_1 = require("p-queue");
var rxjs_1 = require("rxjs");
var pubsub_message_js_1 = require("./pubsub-message.js");
var when_subscription_done_util_js_1 = require("../__tests__/when-subscription-done.util.js");
// Warnings about rate-limiting appear once per:
var DEFAULT_WARNINGS_INTERVAL = 30 * 60 * 1000; // 30 minutes
/**
 * Wraps an instance of Pubsub and rate limits how often QUERY messages can be sent.  There are two
 * main configuration parameters: 'queriesPerSecond' and 'maxQueuedQueries'. 'queriesPerSecond'
 * controls how many QUERY pubsub messages can be published per second.  If more than that number
 * of query messages are attempted to be published, additional messages will queue up and will be
 * published when doing so will no longer put us over 'queriesPerSecond'.  'maxQueuedQueries'
 * controls how many queries are allowed to queue up before further attempts to publish query
 * messages just start failing outright.
 *
 * Note that other types of pubsub messages that are not QUERY messages are allowed to be published
 * without limit.
 */
var PubsubRateLimit = /** @class */ (function (_super) {
    __extends(PubsubRateLimit, _super);
    /**
     * Constructs a new instance of PubsubRateLimit.
     * @param pubsub - the underlying Pubsub instance to publish messages to.
     * @param logger
     * @param queriesPerSecond - Max number of query messages that can be published per second
     *   before they start to queue up.
     * @param rateLimitWarningsIntervalMs - How much time should pass between two warnings about rate-limiting
     */
    function PubsubRateLimit(pubsub, logger, queriesPerSecond, rateLimitWarningsIntervalMs) {
        if (rateLimitWarningsIntervalMs === void 0) { rateLimitWarningsIntervalMs = DEFAULT_WARNINGS_INTERVAL; }
        var _this = _super.call(this, function (subscriber) {
            pubsub.subscribe(subscriber);
        }) || this;
        _this.pubsub = pubsub;
        _this.logger = logger;
        _this.queriesPerSecond = queriesPerSecond;
        _this.rateLimitWarningsIntervalMs = rateLimitWarningsIntervalMs;
        // Limit number of executions by +intervalCap+ in +interval+ milliseconds.
        // Here it is +queriesPerSecond+ per 1000ms = 1 second.
        _this.queue = new p_queue_1["default"]({ interval: 1000, intervalCap: queriesPerSecond });
        var lastWarning = 0;
        _this.queue.on('add', function () {
            // If there is a publishing task over the queriesPerSecond limit
            // And longer than this.rateLimitWarningsIntervalMs has passed since the last warning
            if (_this.queue.size > 0 && Date.now() - lastWarning >= _this.rateLimitWarningsIntervalMs) {
                _this.logger.warn("More than ".concat(_this.queriesPerSecond, " query messages published in less than a second. Query messages will be rate limited"));
                lastWarning = Date.now();
            }
        });
        _this.maxQueuedQueries = queriesPerSecond * 10;
        _this.logger.debug("Configuring pubsub to rate limit query messages to ".concat(queriesPerSecond, " per second"));
        return _this;
    }
    /**
     * For non-query messages simply passes the message directly through to pubsub. For query messages,
     * queues the messages up to be published so long as we aren't exceeding the rate limit.
     * @param message
     */
    PubsubRateLimit.prototype.next = function (message) {
        var _this = this;
        if (message.typ === pubsub_message_js_1.MsgType.QUERY) {
            if (this.queue.size >= this.maxQueuedQueries) {
                this.logger.err("Cannot publish query message to pubsub because we have exceeded the maximum allowed rate. Cannot have more than ".concat(this.maxQueuedQueries, " queued queries."));
                return (0, rxjs_1.empty)().subscribe();
            }
            return (0, rxjs_1.from)(this.queue.add(function () { return (0, when_subscription_done_util_js_1.whenSubscriptionDone)(_this.pubsub.next(message)); })).subscribe();
        }
        else {
            return this.pubsub.next(message);
        }
    };
    return PubsubRateLimit;
}(rxjs_1.Observable));
exports.PubsubRateLimit = PubsubRateLimit;
