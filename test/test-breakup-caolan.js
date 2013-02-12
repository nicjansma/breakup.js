//
// Replicates all of the forEachSeries() tests of caolan's async Node.js module
//
(function(exports) {
    var breakup = require('../lib/breakup');

    //
    // iterator helpers
    //
    function forEachIterator(args, x, callback) {
        setTimeout(function(){
            args.push(x);
            callback();
        }, x * 25);
    }

    function forEachNoCallbackIterator(test, x, callback) {
        test.equal(x, 1, 'should only be called once');
        callback();
        test.done();
    }

    //
    // test group
    //
    exports['caolan-async'] = {};

    exports['caolan-async']['forEachSeries()'] = function(test){
        var args = [];

        test.expect(1);

        breakup.forEachSeries([1,3,2], forEachIterator.bind(this, args), function(err){
            test.same(args, [1,3,2], 'final array');
            test.done();
        });
    };

    exports['caolan-async']['forEachSeries() - empty array'] = function(test){
        test.expect(1);

        breakup.forEachSeries([], function(x, callback){
            test.ok(false, 'iterator should not be called');
            callback();
        }, function(err){
            test.ok(true, 'should call callback');
        });

        setTimeout(test.done, 25);
    };

    exports['caolan-async']['forEachSeries() - error'] = function(test){
        test.expect(2);

        var call_order = [];

        breakup.forEachSeries([1,3,2], function(x, callback){
            call_order.push(x);
            callback('error');
        }, function(err){
            test.same(call_order, [1]);
            test.equals(err, 'error');
        });

        setTimeout(test.done, 50);
    };

    exports['caolan-async']['forEachSeries() - no callback'] = function(test){
        breakup.forEachSeries([1], forEachNoCallbackIterator.bind(this, test));
    };
})(exports);