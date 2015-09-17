/* eslint-env node,browser,amd */
/* global jQuery */

//
// breakup.js v0.1.1
//
// Copyright 2013 Nic Jansma
// http://nicj.net
//
// https://github.com/nicjansma/breakup.js
//
// Licensed under the MIT license
//
(function() {
    "use strict";

    var breakup = {};

    // save old breakup object for noConflict()
    var root;
    var previousBreakup;
    if (typeof window !== "undefined") {
        root = window;
        previousBreakup = root.breakup;
    }

    //
    // Constants
    //

    //
    // NOTE: These 'constants' are public so can be changed application-wide
    // if desired.
    //

    /**
     * By default, how much work to do before yielding
     */
    breakup.DEFAULT_WORK_TIME = 100;

    /**
     * By default, how much time to yield for
     */
    breakup.DEFAULT_YIELD_TIME = 4;

    //
    // Functions
    //
    /**
     * Changes the value of breakup back to its original value, returning
     * a reference to the breakup object.
     * @returns {object} breakup.js object
     */
    breakup.noConflict = function() {
        root.breakup = previousBreakup;
        return breakup;
    };

    /**
     * Serially enumerates over a collection, breaking up the elements into groups depending on
     * how long they take to iterate over, and yielding via process.nextTick/setImmediate/setTimeout
     * if enumeration passes the time threshold.
     *
     * @param {Array} arr Array (or Array-like object) to iterate over.
     * @param {function(item, callback)} iterator A function to apply to each item in the array.  The iterator
     *        is passed a callback(err) which must be called once it has completed. If no error has occured, the
     *        callback should be run without arguments or with an explicit null argument.
     * @param {function(err, yielded)} [callback] A function which is called after all the iterator functions have
     *        finished, or an error has occurred (optional).
     * @param {Number} [workTime] Work for this many milliseconds before yielding (optional, defaults to
     *        DEFAULT_WORK_TIME).
     * @param {Number} [yieldTime] Time (in milliseconds) to delay during yielding, if setImmediate is not available
     *        (optional, defaults to DEFAULT_YIELD_TIME).
     * @param {Boolean} [forceYield] Force yielding for the specified milliseconds instead of setImmedia/nextTick
     *        (optional)
     */
    breakup.forEachSeries = function(arr, iterator, callback, workTime, yieldTime, forceYield) {
        callback = callback || function() {};
        workTime = (typeof workTime !== "undefined") ? workTime : breakup.DEFAULT_WORK_TIME;
        yieldTime = (typeof yieldTime !== "undefined") ? yieldTime : breakup.DEFAULT_YIELD_TIME;

        // if the object is undefined or, it's not an array, or has no elements, trigger the complete
        if (!arr || !arr.length) {
            callback(null, false);
            return;
        }

        // keep track if we yielded for the completion callback
        var yielded = false;

        // time at which we should stop working
        var startTime = +(new Date());
        var endTime = startTime + workTime;

        // element index we're working on
        var current = 0;

        // try to find a setImmediate or similar API
        var immediate;
        if (!forceYield) {
            if (typeof window !== "undefined") {
                immediate = window.setImmediate ||
                            window.webkitSetImmediate ||
                            window.mozSetImmediate ||
                            window.oSetImmediate ||
                            window.msSetImmediate;
            } else if (typeof process !== "undefined") {
                immediate = process.nextTick;
            }
        }

        /**
         * Iteration loop function. Called once for each element
         */
        var iterate = function() {
            // run iterator for this item
            iterator(arr[current], function(err) {
                // check for any errors with this element
                if (err) {
                    callback(err, yielded);
                } else {
                    // move onto the next element
                    current++;

                    if (current === arr.length) {
                        // all done
                        callback(null, yielded);
                    } else {
                        var now = +(new Date());

                        // check if we need to take a break at all
                        if (now > endTime) {
                            // reset start and end time
                            startTime = now;
                            endTime = startTime + workTime;

                            yielded = true;

                            // prioritize setImmediate
                            if (immediate) {
                                immediate(function() {
                                    iterate();
                                });
                            } else {
                                // if we're not doing an immediate yield, also add yield time
                                endTime += yieldTime;

                                setTimeout(function() {
                                    iterate();
                                }, yieldTime);
                            }
                        } else {
                            // work on the next item immediately
                            iterate();
                        }
                    }
                }
            });
        };

        // start first iteration
        iterate();
    };

    /**
     * Serially enumerates over a collection, breaking up the elements into groups depending on
     * how long they take to iterate over, and yielding via process.nextTick/setImmediate/setTimeout
     * if enumeration passes the time threshold.
     *
     * .each() is different from forEachSeries() in that the iteration function calls back with (index, item)
     * instead of (item, callback).  i.e. - the iterator doesn't work with a callback, but simply waits for the
     * function to return.
     *
     * This function matches the function signature of jQuery.each(), but you will need to pass a completion-callback
     * function as the third argument if you want to wait for the enumeration to complete before continuing flow.
     *
     * @param {Array} arr Array (or Array-like object) to iterate over.
     * @param {function(index, item)} iterator A function to apply to each item in the array.
     * @param {function(err, yielded)} [callback] A function which is called after all the iterator functions have
     *        finished.
     * @param {Number} [workTime] Work for this many milliseconds before yielding (optional, defaults to
     *        DEFAULT_WORK_TIME).
     * @param {Number} [yieldTime] Time (in milliseconds) to delay during yielding, if setImmediate is not available
     *        (optional, defaults to DEFAULT_YIELD_TIME).
     * @param {Boolean} [forceYield] Force yielding for the specified milliseconds instead of setImmedia/nextTick
     *        (optional)
     */
    breakup.each = function(arr, iterator, callback, workTime, yieldTime, forceYield) {
        // keep track of the item's index since forEachSeries does not
        var index = -1;

        // call forEachSeries with a custom iterator function
        breakup.forEachSeries(
            arr,
            function(item, itemCallback) {
                ++index;
                iterator(index, item);
                itemCallback();
            },
            callback,
            workTime,
            yieldTime,
            forceYield);
    };

    //
    // Export breakup.js to the appropriate location
    //
    if (typeof define !== "undefined" && define.amd) {
        //
        // AMD / RequireJS
        //
        define([], function() {
            return breakup;
        });
    } else if (typeof module !== "undefined" && module.exports) {
        //
        // Node.js
        //
        module.exports = breakup;
    } else if (typeof root !== "undefined") {
        //
        // Included directly via a script tag
        //
        root.breakup = breakup;
    }

    //
    // If jQuery is loaded, add a $(selector).breakup() function
    //
    var _jQuery = null;
    if (typeof jQuery !== "undefined") {
        _jQuery = jQuery;
    }

    // possibly load jQuery in Node.js
    if (typeof jQuery === "undefined" && typeof require === "function") {
        _jQuery = require("jquery");
    }

    if (_jQuery && _jQuery.fn) {
        // jQuery selector function
        _jQuery.fn.breakup = function(iterator, callback, workTime, yieldTime) {
            breakup.each(this, iterator, callback, workTime, yieldTime);

            // NOTE: If you're chaining this call, you should realize it's
            // going to return right away.  The callback is fired when
            // iteration is complete.
            return this;
        };
    }
}());
