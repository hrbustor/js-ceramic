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
exports.filterExternal = exports.IncomingChannel = exports.PubsubIncoming = void 0;
var rxjs_1 = require("rxjs");
var rxjs_2 = require("rxjs");
var operators_1 = require("rxjs/operators");
var task_queue_js_1 = require("./task-queue.js");
/**
 * Subscription attempts must be sequential, in FIFO order.
 * Last call to unsubscribe must execute after all the attempts are done,
 * and all the attempts yet inactive are cleared. Serialized via TaskQueue.
 */
var PubsubIncoming = /** @class */ (function (_super) {
    __extends(PubsubIncoming, _super);
    function PubsubIncoming(ipfs, topic, pubsubLogger, logger, tasks) {
        var _this = _super.call(this, function (subscriber) {
            var onMessage = function (message) { return subscriber.next(message); };
            var onError = function (error) { return subscriber.error(error); };
            // For some reason ipfs.id() throws an error directly if the
            // ipfs node can't be reached, while pubsub.subscribe stalls
            // for an unknown amount of time. We therefor run ipfs.id()
            // first to determine if the ipfs node is reachable.
            _this.tasks
                .run(function () { return __awaiter(_this, void 0, void 0, function () {
                var ipfsId, peerId;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.ipfs.id()];
                        case 1:
                            ipfsId = _a.sent();
                            peerId = ipfsId.id;
                            return [4 /*yield*/, ipfs.pubsub.subscribe(topic, onMessage, { onError: onError })];
                        case 2:
                            _a.sent();
                            pubsubLogger.log({ peer: peerId, event: 'subscribed', topic: topic });
                            return [2 /*return*/];
                    }
                });
            }); })["catch"](onError);
            return function () {
                _this.tasks.clear();
                _this.tasks.add(function () { return __awaiter(_this, void 0, void 0, function () {
                    var _this = this;
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, ((_a = ipfs.pubsub) === null || _a === void 0 ? void 0 : _a.unsubscribe(topic, onMessage)["catch"](function (err) {
                                    _this.logger.warn(err);
                                }))];
                            case 1:
                                _b.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
            };
        }) || this;
        _this.ipfs = ipfs;
        _this.topic = topic;
        _this.pubsubLogger = pubsubLogger;
        _this.logger = logger;
        _this.tasks = tasks;
        _this.tasks = new task_queue_js_1.TaskQueue();
        return _this;
    }
    return PubsubIncoming;
}(rxjs_1.Observable));
exports.PubsubIncoming = PubsubIncoming;
/**
 * Incoming IPFS PubSub message stream as Observable.  Adds retry logic on top of base PubsubIncoming.
 */
var IncomingChannel = /** @class */ (function (_super) {
    __extends(IncomingChannel, _super);
    function IncomingChannel(ipfs, topic, resubscribeEvery, pubsubLogger, logger, tasks) {
        if (tasks === void 0) { tasks = new task_queue_js_1.TaskQueue(); }
        var _this = _super.call(this, function (subscriber) {
            new PubsubIncoming(ipfs, topic, pubsubLogger, logger, _this.tasks)
                .pipe((0, operators_1.retryWhen)(function (errors) {
                return errors.pipe((0, operators_1.tap)(function (e) { return logger.err(e); }), (0, operators_1.delay)(resubscribeEvery));
            }))
                .subscribe(subscriber);
        }) || this;
        _this.ipfs = ipfs;
        _this.topic = topic;
        _this.resubscribeEvery = resubscribeEvery;
        _this.pubsubLogger = pubsubLogger;
        _this.logger = logger;
        _this.tasks = tasks;
        return _this;
    }
    return IncomingChannel;
}(rxjs_1.Observable));
exports.IncomingChannel = IncomingChannel;
/**
 * Pass only messages from other IPFS nodes.
 * @param ownPeerId$ - Own peer id.
 */
function filterExternal(ownPeerId$) {
    return (0, rxjs_2.pipe)((0, operators_1.concatMap)(function (data) {
        return ownPeerId$.pipe((0, operators_1.map)(function (peerId) { return ({ isOuter: data.from !== peerId, entry: data }); }));
    }), 
    // Filter the container object synchronously for the value in each data container object
    (0, operators_1.filter)(function (data) { return data.isOuter; }), 
    // remove the data container object from the observable chain
    (0, operators_1.map)(function (data) { return data.entry; }));
}
exports.filterExternal = filterExternal;
