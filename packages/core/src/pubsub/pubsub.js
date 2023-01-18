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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.Pubsub = void 0;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var pubsub_message_js_1 = require("./pubsub-message.js");
var uint8arrays_1 = require("uint8arrays");
var incoming_channel_js_1 = require("./incoming-channel.js");
var task_queue_js_1 = require("./task-queue.js");
var textDecoder = new TextDecoder('utf-8');
/**
 * Deserialize incoming message in an internal observable that does not emit if error happens.
 * Log a successfully deserialized message.
 *
 * @param peerId$ - own IPFS node peer id
 * @param pubsubLogger - logger that dumps a successfully deserialized message
 * @param topic - IPFS pubsub topic we listen
 */
function ipfsToPubsub(peerId$, pubsubLogger, topic) {
    return (0, rxjs_1.pipe)((0, operators_1.withLatestFrom)(peerId$), (0, operators_1.mergeMap)(function (_a) {
        var incoming = _a[0], peerId = _a[1];
        return (0, rxjs_1.of)(incoming).pipe((0, operators_1.map)(function (incoming) {
            var message = (0, pubsub_message_js_1.deserialize)(incoming);
            var serializedMessage = (0, pubsub_message_js_1.serialize)(message);
            var logMessage = __assign(__assign({}, incoming), JSON.parse(textDecoder.decode(serializedMessage)));
            logMessage.seqno = (0, uint8arrays_1.toString)(logMessage.seqno, 'base16');
            delete logMessage.data; // Already included in serialized message
            delete logMessage.key;
            delete logMessage.signature;
            pubsubLogger.log({ peer: peerId, event: 'received', topic: topic, message: logMessage });
            return message;
        }), (0, operators_1.catchError)(function () { return rxjs_1.EMPTY; }));
    }));
}
/**
 * Receive and publish messages to IPFS pubsub.
 */
var Pubsub = /** @class */ (function (_super) {
    __extends(Pubsub, _super);
    function Pubsub(ipfs, topic, resubscribeEvery, pubsubLogger, logger, tasks) {
        if (tasks === void 0) { tasks = new task_queue_js_1.TaskQueue(); }
        var _this = _super.call(this, function (subscriber) {
            var incoming$ = new incoming_channel_js_1.IncomingChannel(ipfs, topic, resubscribeEvery, pubsubLogger, logger, tasks);
            incoming$
                .pipe((0, incoming_channel_js_1.filterExternal)(_this.peerId$), ipfsToPubsub(_this.peerId$, pubsubLogger, topic))
                .subscribe(subscriber);
        }) || this;
        _this.ipfs = ipfs;
        _this.topic = topic;
        _this.resubscribeEvery = resubscribeEvery;
        _this.pubsubLogger = pubsubLogger;
        _this.logger = logger;
        _this.tasks = tasks;
        // Textually, `this.peerId$` appears after it is called.
        // Really, subscription is lazy, so `this.peerId$` is populated before the actual subscription act.
        _this.peerId$ = (0, rxjs_1.from)(_this.ipfs.id().then(function (_) { return _.id; }));
        return _this;
    }
    /**
     * Publish message to IPFS Pubsub as a "fire and forget" command.
     *
     * You could use returned Subscription to react when the operation is finished.
     * Feel free to disregard it though.
     */
    Pubsub.prototype.next = function (message) {
        var _this = this;
        return this.peerId$
            .pipe((0, operators_1.mergeMap)(function (peerId) { return __awaiter(_this, void 0, void 0, function () {
            var serializedMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        serializedMessage = (0, pubsub_message_js_1.serialize)(message);
                        return [4 /*yield*/, this.ipfs.pubsub.publish(this.topic, serializedMessage)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { peerId: peerId, serializedMessage: serializedMessage }];
                }
            });
        }); }))
            .subscribe({
            next: function (_a) {
                var peerId = _a.peerId, serializedMessage = _a.serializedMessage;
                var logMessage = __assign(__assign({}, message), JSON.parse(textDecoder.decode(serializedMessage)));
                _this.pubsubLogger.log({
                    peer: peerId,
                    event: 'published',
                    topic: _this.topic,
                    message: logMessage
                });
            },
            error: function (error) {
                _this.logger.err(error);
            }
        });
    };
    return Pubsub;
}(rxjs_1.Observable));
exports.Pubsub = Pubsub;
