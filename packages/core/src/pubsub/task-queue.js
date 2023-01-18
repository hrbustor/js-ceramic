"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _TaskQueue_pq;
exports.__esModule = true;
exports.TaskQueue = exports.noop = void 0;
var p_queue_1 = require("p-queue");
var noop = function () {
    // Do Nothing
};
exports.noop = noop;
/**
 * PQueue with synchronous `add` and a common error-handler.
 */
var TaskQueue = /** @class */ (function () {
    /**
     * Construct the queue.
     *
     * @param onError - Common error handler for all the tasks, it is called whenever a task errors.
     *   The first parameter is an error object.
     *   The second parameter, if called, would re-add the task to the queue again.
     *   Useful if you know an error indicates another attempt to execute the task is necessary.
     */
    function TaskQueue(onError) {
        if (onError === void 0) { onError = exports.noop; }
        this.onError = onError;
        _TaskQueue_pq.set(this, new p_queue_1["default"]({ concurrency: 1 })
        /**
         * Construct the queue.
         *
         * @param onError - Common error handler for all the tasks, it is called whenever a task errors.
         *   The first parameter is an error object.
         *   The second parameter, if called, would re-add the task to the queue again.
         *   Useful if you know an error indicates another attempt to execute the task is necessary.
         */
        );
    }
    Object.defineProperty(TaskQueue.prototype, "size", {
        /**
         * Size of the queue. Counts both deferred and currently running tasks.
         */
        get: function () {
            return __classPrivateFieldGet(this, _TaskQueue_pq, "f").size + __classPrivateFieldGet(this, _TaskQueue_pq, "f").pending;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Add task to queue. Fire-and-forget semantics.
     */
    TaskQueue.prototype.add = function (task, onFinally) {
        var _this = this;
        this.run(task)["catch"](function (error) {
            var retry = function () { return _this.add(task, onFinally); };
            _this.onError(error, retry);
        })["finally"](function () { return onFinally === null || onFinally === void 0 ? void 0 : onFinally(); });
    };
    /**
     * Add task and wait till it is completed.
     * The point of `run` (as opposed to `add`) is to pass an error to the caller if it is throw inside a task.
     * Note "fire-and-forget" comment for the `add` method.
     */
    TaskQueue.prototype.run = function (task) {
        return __classPrivateFieldGet(this, _TaskQueue_pq, "f").add(task);
    };
    /**
     * Wait till all the tasks are completed.
     */
    TaskQueue.prototype.onIdle = function () {
        return __classPrivateFieldGet(this, _TaskQueue_pq, "f").onIdle();
    };
    /**
     * Clear the queue.
     */
    TaskQueue.prototype.clear = function () {
        __classPrivateFieldGet(this, _TaskQueue_pq, "f").clear();
    };
    TaskQueue.prototype.pause = function () {
        __classPrivateFieldGet(this, _TaskQueue_pq, "f").pause();
    };
    return TaskQueue;
}());
exports.TaskQueue = TaskQueue;
_TaskQueue_pq = new WeakMap();
