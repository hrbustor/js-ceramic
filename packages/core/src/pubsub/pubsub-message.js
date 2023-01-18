"use strict";
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
exports.__esModule = true;
exports.deserialize = exports.serialize = exports.buildQueryMessage = exports.MsgType = void 0;
var streamid_1 = require("@ceramicnetwork/streamid");
var common_1 = require("@ceramicnetwork/common");
var observability_1 = require("@ceramicnetwork/observability");
var dagCBOR = require("@ipld/dag-cbor");
var digest_1 = require("multiformats/hashes/digest");
var sha256 = require("@stablelib/sha256");
var uint8arrays = require("uint8arrays");
/**
 * Ceramic Pub/Sub message type.
 */
var MsgType;
(function (MsgType) {
    MsgType[MsgType["UPDATE"] = 0] = "UPDATE";
    MsgType[MsgType["QUERY"] = 1] = "QUERY";
    MsgType[MsgType["RESPONSE"] = 2] = "RESPONSE";
    MsgType[MsgType["KEEPALIVE"] = 3] = "KEEPALIVE";
})(MsgType = exports.MsgType || (exports.MsgType = {}));
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder('utf-8');
var PUBSUB_PUBLISHED = 'pubsub_published';
var PUBSUB_RECEIVED = 'pubsub_received';
function messageHash(message) {
    // DAG-CBOR encoding
    var encoded = dagCBOR.encode(message);
    // SHA-256 hash
    var id = sha256.hash(encoded);
    // Multihash encoding
    return uint8arrays.toString((0, digest_1.create)(0x12, id).bytes, 'base64url');
}
function buildQueryMessage(streamId) {
    var payload = {
        typ: MsgType.QUERY,
        stream: streamId
    };
    var id = messageHash(__assign(__assign({}, payload), { stream: streamId.toString() }));
    return __assign(__assign({}, payload), { id: id });
}
exports.buildQueryMessage = buildQueryMessage;
function serialize(message) {
    observability_1.ServiceMetrics.count(PUBSUB_PUBLISHED, 1, { typ: message.typ }); // really attempted to publish...
    switch (message.typ) {
        case MsgType.QUERY: {
            return textEncoder.encode(JSON.stringify(__assign(__assign({}, message), { doc: message.stream.toString(), stream: message.stream.toString() })));
        }
        case MsgType.RESPONSE: {
            var tips_1 = {};
            message.tips.forEach(function (value, key) { return (tips_1[key] = value.toString()); });
            var payload = __assign(__assign({}, message), { tips: tips_1 });
            return textEncoder.encode(JSON.stringify(payload));
        }
        case MsgType.UPDATE: {
            // todo remove 'doc' once we no longer support interop with nodes older than v1.0.0
            var payload = __assign({ typ: MsgType.UPDATE, doc: message.stream.toString(), stream: message.stream.toString(), tip: message.tip.toString() }, (message.model && { model: message.model.toString() }));
            return textEncoder.encode(JSON.stringify(payload));
        }
        case MsgType.KEEPALIVE: {
            var payload = {
                typ: MsgType.KEEPALIVE,
                ts: message.ts,
                ver: message.ver
            };
            return textEncoder.encode(JSON.stringify(payload));
        }
        default:
            throw new common_1.UnreachableCaseError(message, 'Unknown message type');
    }
}
exports.serialize = serialize;
function deserialize(message) {
    var asString = textDecoder.decode(message.data);
    var parsed = JSON.parse(asString);
    var typ = parsed.typ;
    observability_1.ServiceMetrics.count(PUBSUB_RECEIVED, 1, { typ: typ });
    switch (typ) {
        case MsgType.UPDATE: {
            // TODO don't take streamid from 'doc' once we no longer interop with nodes older than v1.0.0
            var stream = streamid_1.StreamID.fromString(parsed.stream || parsed.doc);
            return __assign({ typ: MsgType.UPDATE, stream: stream, tip: (0, common_1.toCID)(parsed.tip) }, (parsed.model && { model: streamid_1.StreamID.fromString(parsed.model) }));
        }
        case MsgType.RESPONSE: {
            var tips_2 = new Map();
            Object.entries(parsed.tips).forEach(function (_a) {
                var key = _a[0], value = _a[1];
                return tips_2.set(key, (0, common_1.toCID)(value));
            });
            return {
                typ: MsgType.RESPONSE,
                id: parsed.id,
                tips: tips_2
            };
        }
        case MsgType.QUERY: {
            // TODO don't take streamid from 'doc' once we no longer interop with nodes older than v1.0.0
            var stream = streamid_1.StreamID.fromString(parsed.stream || parsed.doc);
            return {
                typ: MsgType.QUERY,
                id: parsed.id,
                stream: stream
            };
        }
        case MsgType.KEEPALIVE: {
            return {
                typ: MsgType.KEEPALIVE,
                ts: parsed.ts,
                ver: parsed.ver
            };
        }
        default:
            throw new common_1.UnreachableCaseError(typ, 'Unknown message type');
    }
}
exports.deserialize = deserialize;
