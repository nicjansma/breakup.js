//
// Tests yielding functionality of breakup.forEachSeries and breakup.each
//
(function(root) {
    "use strict";

    //
    // Run in either Mocha, Karma or Browser environments
    //
    if (typeof root === "undefined") {
        root = {};
    }

    var breakup = root.breakup ? root.breakup : require("../lib/breakup");
    var expect = root.expect ? root.expect : require("expect.js");

    //
    // Iterator helpers
    //
    /**
     * Iterator for forEachSeries that waits 10ms between iteration
     *
     * @param {Array} args Result array
     * @param {object} x Item
     * @param {function} callback Callback
     */
    function forEachWaitLongTimeIterator(args, x, callback) {
        setTimeout(function() {
            args.push(x);
            callback();
        }, 10);
    }

    /**
     * Iterator that goes over each item, validating each iteration
     * @param {Array} args Result array
     * @param {number} index Item index
     * @param {object} x Item
     */
    function eachIterator(args, index, x) {
        expect(index).to.be.eql(x - 1);
        args.push(x);
    }

    /**
     * Iterator that goes over each item, waiting 10ms for each iteration
     * @param {Array} args Result array
     * @param {number} index Item index
     * @param {object} x Item
     */
    function eachWaitLongTimeIterator(args, index, x) {
        expect(index).to.be.eql(x - 1);

        // busy wait
        var startTime = +(new Date());
        var now = +(new Date());
        while (now - startTime < 10) {
            now = +(new Date());
        }

        args.push(x);
    }

    //
    // Constants
    //
    var SIMPLE_ARRAY = [1, 2, 3];

    //
    // Tests
    //
    describe("breakup.js tests", function() {
        describe("forEachSeries()", function() {
            it("should be a function", function() {
                expect(breakup.forEachSeries).to.be.a("function");
            });
            
            it("should yield when workTime = 0 and we have work that takes at least 10ms", function(done) {
                var args = [];

                breakup.forEachSeries(SIMPLE_ARRAY, forEachWaitLongTimeIterator.bind(this, args), function(err, yielded) {
                    expect(args).to.be.an("array");
                    expect(args).to.eql(SIMPLE_ARRAY);
                    expect(err).to.eql(null);
                    expect(yielded).to.be.ok("should have yielded");
                    done();
                }, 0, 0);
            });

            it("should not yield when workTime = 100000", function(done) {
                var args = [];

                breakup.forEachSeries(SIMPLE_ARRAY, forEachWaitLongTimeIterator.bind(this, args), function(err, yielded) {
                    expect(args).to.be.an("array");
                    expect(args).to.eql(SIMPLE_ARRAY);
                    expect(err).to.eql(null);
                    expect(yielded).to.not.be.ok("should not have yielded");
                    done();
                }, 100000, 0);
            });
        });

        describe("each()", function() {
            it("should be a function", function() {
                expect(breakup.each).to.be.a("function");
            });
            
            it("should yield when workTime = 1 and we have work that takes at least 10ms", function(done) {
                var args = [];

                breakup.each(SIMPLE_ARRAY, eachWaitLongTimeIterator.bind(this, args), function(err, yielded) {
                    expect(args).to.be.an("array");
                    expect(args).to.eql(SIMPLE_ARRAY);
                    expect(err).to.eql(null);
                    expect(yielded).to.be.ok("should have yielded");
                    done();
                }, 1, 0);
            });

            it("should not yield when workTime = 100000", function(done) {
                var args = [];

                breakup.each(SIMPLE_ARRAY, eachIterator.bind(this, args), function(err, yielded) {
                    expect(args).to.be.an("array");
                    expect(args).to.eql(SIMPLE_ARRAY);
                    expect(err).to.eql(null);
                    expect(yielded).to.not.be.ok("should not have yielded");
                    done();
                }, 100000, 0);
            });
        });
    });

})(typeof window !== "undefined" ? window : undefined);
