/*eslint-env node,browser,amd,mocha*/
//
// Replicates all of the forEachSeries() tests of caolan's async Node.js module
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
    function forEachIterator(args, x, callback) {
        setTimeout(function() {
            args.push(x);
            callback();
        }, x * 25);
    }

    function forEachNoCallbackIterator(done, x, callback) {
        expect(x).to.eql(1, "should only be called once");
        callback();
        done();
    }

    //
    // Constants
    //
    var SIMPLE_ARRAY = [1, 3, 2];

    //
    // Tests
    //
    describe("caolan/async.js tests", function() {
        describe("forEachSeries()", function() {
            it("should work on a simple iterator", function() {
                var args = [];

                breakup.forEachSeries(SIMPLE_ARRAY, forEachIterator.bind(this, args), function(err) {
                    expect(args).to.be.an("array");
                    expect(args).to.eql(SIMPLE_ARRAY);
                    expect(err).to.eql(null);
                });
            });

            it("should work on an empty array", function(done) {
                breakup.forEachSeries([], function(x, callback) {
                    expect.fail("iterator should not be called");
                    callback();
                }, function(err) {
                    expect(err).to.eql(null);
                    done();
                });
            });

            it("should work when an error is passed to the callback", function(done) {
                var callOrder = [];

                breakup.forEachSeries(SIMPLE_ARRAY, function(x, callback) {
                    callOrder.push(x);
                    callback("error");
                }, function(err) {
                    expect(callOrder).to.eql([1]);
                    expect(err).to.eql("error");
                    done();
                });
            });

            it("should work when called without a callback", function(done) {
                breakup.forEachSeries([1], forEachNoCallbackIterator.bind(this, done));
            });
        });
    });

}(typeof window !== "undefined" ? window : undefined));
