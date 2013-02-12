//
// Tests yielding functionality of breakup.forEachSeries and breakup.each
//
(function(exports) {
    var breakup = require('../lib/breakup');

    //
    // iterator helpers
    //
    function forEachWaitLongTimeIterator(args, x, callback) {
        setTimeout(function(){
            args.push(x);
            callback();
        }, 10);
    }

    function eachIterator(test, args, index, x) {
        test.equal(index, x - 1, 'proper index for item');
        args.push(x);
    }

    function eachWaitLongTimeIterator(test, args, index, x) {
        test.equal(index, x - 1, 'proper index for item');

        // busy wait
        var startTime = +(new Date);
        var now = +(new Date);
        while (now - startTime < 10) {
            now = +(new Date);
        }

        args.push(x);
    }

    //
    // test group
    //
    exports['breakup'] = {};

    // specify
    exports['breakup']['forEachSeries() - hits threshold'] = function(test){
        var args = [];

        breakup.forEachSeries([1,2,3], forEachWaitLongTimeIterator.bind(this, args), function(err, yielded){
            test.same(args, [1,2,3], 'final array');
            test.ok(yielded, 'should have yielded');
            test.done();
        }, 0, 0);
    };

    exports['breakup']['forEachSeries() - does not hit threshold'] = function(test){
        var args = [];

        // theoretically this shouldn't take 100 seconds
        breakup.forEachSeries([1,2,3], forEachWaitLongTimeIterator.bind(this, args), function(err, yielded){
            test.same(args, [1,2,3], 'final array');
            test.ok(!yielded, 'should not have yielded');
            test.done();
        }, 100000, 0);
    };

    exports['breakup']['each() - hits threshold'] = function(test){
        var args = [];

        breakup.each([1,2,3], eachWaitLongTimeIterator.bind(this, test, args), function(err, yielded){
            test.same(args, [1,2,3], 'final array');
            test.ok(yielded, 'should have yielded');
            test.done();
        }, 1, 0);
    };

    exports['breakup']['each() - does not hit threshold'] = function(test){
        var args = [];

        // theoretically this shouldn't take 100 seconds
        breakup.each([1,2,3], eachIterator.bind(this, test, args), function(err, yielded){
            test.same(args, [1,2,3], 'final array');
            test.ok(!yielded, 'should not have yielded');
            test.done();
        }, 100000, 0);
    };
})(exports);