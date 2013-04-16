//
// Function.bind shim (via caolan-async)
//
(function() {
    'use strict';

    if (!Function.prototype.bind) {
        Function.prototype.bind = function (thisArg) {
            var args = Array.prototype.slice.call(arguments, 1);
            var self = this;
            return function () {
                self.apply(thisArg, args.concat(Array.prototype.slice.call(arguments)));
            };
        };
    }
})();