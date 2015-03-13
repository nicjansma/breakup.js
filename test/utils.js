//
// Function.bind shim (via caolan-async)
//
(function() {
    "use strict";

    if (!Function.prototype.bind) {
        /*eslint no-extend-native:0*/
        Function.prototype.bind = function (thisArg) {
            var args = Array.prototype.slice.call(arguments, 1);
            var that = this;
            return function () {
                that.apply(thisArg, args.concat(Array.prototype.slice.call(arguments)));
            };
        };
    }
}());
