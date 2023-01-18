"use strict";
exports.__esModule = true;
exports.whenSubscriptionDone = void 0;
/**
 * The returned Promise resolves when the +subscription+ is done.
 */
function whenSubscriptionDone(subscription) {
    return new Promise(function (resolve) { return subscription.add(resolve); });
}
exports.whenSubscriptionDone = whenSubscriptionDone;
