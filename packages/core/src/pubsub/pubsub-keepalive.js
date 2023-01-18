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
exports.PubsubKeepalive = void 0;
var rxjs_1 = require("rxjs");
var pubsub_message_js_1 = require("./pubsub-message.js");
var version_js_1 = require("../version.js");
/**
 * Wraps an instance of Pubsub and ensures that a pubsub message is generated with some minimum
 * frequency.
 */
var PubsubKeepalive = /** @class */ (function (_super) {
    __extends(PubsubKeepalive, _super);
    /**
     * Given a 'maxPubsubPublishInterval' specifying the max amount of time between pubsub messages,
     *   starts a background job that runs every maxPubsubPublishInterval/2 and publishes a keepalive
     *   message if no other pubsub messages have been sent within maxPubsubPublishInterval/2. Running
     *   the check in an interval half as long as the max limit, and publishing a message if we have
     *   less than half the max limit interval remaining, guarantees that even in the worst case we
     *   never pass 'maxPubsubPublishInterval' without publishing a message.
     * @param pubsub - Pubsub instances used to publish messages to the underlying libp2p pubsub topic.
     * @param maxPubsubPublishInterval - the max amount of time that is allowed to pass without
     *   generating a pubsub message.
     * @param maxIntervalWithoutKeepalive - the max amount of time that is allowed to pass without
     *   generating a keepalive message.
     */
    function PubsubKeepalive(pubsub, maxPubsubPublishInterval, maxIntervalWithoutKeepalive) {
        var _this = _super.call(this, function (subscriber) {
            pubsub.subscribe(subscriber);
            // Start background job to periodically send pubsub messages if no other messages have been
            // sent recently.
            // Run it with the minimum required interval
            var pubsubKeepaliveInterval = (0, rxjs_1.interval)(Math.min(_this.maxPubsubPublishInterval / 2, _this.maxIntervalWithoutKeepalive / 2)).subscribe(function () {
                _this.publishPubsubKeepaliveIfNeeded();
            });
            return function () {
                pubsubKeepaliveInterval.unsubscribe();
            };
        }) || this;
        _this.pubsub = pubsub;
        _this.maxPubsubPublishInterval = maxPubsubPublishInterval;
        _this.maxIntervalWithoutKeepalive = maxIntervalWithoutKeepalive;
        _this.lastPublishedMessageDate = Date.now() - _this.maxPubsubPublishInterval;
        // start at 0 so it always publishes once on startup
        _this.lastPublishedKeepAliveMessageDate = 0;
        return _this;
    }
    /**
     * Passes on the message to be published by the underlying Pubsub instance, while keeping
     * track of the fact that we sent a message and thus can reset our idea of when the next keepalive
     * message needs to be sent.
     */
    PubsubKeepalive.prototype.next = function (message) {
        var now = Date.now();
        this.lastPublishedMessageDate = now;
        if (message.typ === pubsub_message_js_1.MsgType.KEEPALIVE)
            this.lastPublishedKeepAliveMessageDate = now;
        return this.pubsub.next(message);
    };
    /**
     * Called periodically and ensures that if we haven't published a pubsub message in too long,
     * we'll publish one so that we never go longer than MAX_PUBSUB_PUBLISH_INTERVAL without
     * publishing a pubsub message.  This is to work around a bug in IPFS where peer connections
     * get dropped if they haven't had traffic in too long.
     */
    PubsubKeepalive.prototype.publishPubsubKeepaliveIfNeeded = function () {
        var now = Date.now();
        var needToPublishKeepaliveOnceADay = now - this.lastPublishedKeepAliveMessageDate > this.maxIntervalWithoutKeepalive;
        var needToPublishKeepaliveInactivity = now - this.lastPublishedMessageDate >= this.maxPubsubPublishInterval / 2;
        if (!needToPublishKeepaliveInactivity && !needToPublishKeepaliveOnceADay) {
            // We've published a message recently enough and sent a KeepAlive in the last 24 hours
            // no need to publish another
            return;
        }
        var message = { typ: pubsub_message_js_1.MsgType.KEEPALIVE, ts: now, ver: version_js_1.version };
        this.next(message);
    };
    return PubsubKeepalive;
}(rxjs_1.Observable));
exports.PubsubKeepalive = PubsubKeepalive;
