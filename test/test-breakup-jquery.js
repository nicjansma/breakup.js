//
// Tests jQuery $(selector).breakup() extension
//
(function(exports) {
    var breakup = require('../lib/breakup');
    var jQuery = require('jquery');

    //
    // iterator helpers
    //
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
    exports['breakup - jQuery extensions'] = {};

    exports['breakup - jQuery extensions']['$(selector).breakup() - hits threshold'] = function(test){
        var args = [];

        jQuery([1,2,3]).breakup(eachWaitLongTimeIterator.bind(this, test, args), function(err, yielded){
            test.same(args, [1,2,3], 'final array');
            test.ok(yielded, 'should have yielded');
            test.done();
        }, 1, 0);
    };

    exports['breakup - jQuery extensions']['$(selector).breakup() - does not hit threshold'] = function(test){
        var args = [];

        // theoretically this shouldn't take 100 seconds
        jQuery([1,2,3]).breakup(eachIterator.bind(this, test, args), function(err, yielded){
            test.same(args, [1,2,3], 'final array');
            test.ok(!yielded, 'should not have yielded');
            test.done();
        }, 100000, 0);
    };
})(exports);