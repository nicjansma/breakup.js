# breakup.js

v0.1.2

Copyright 2015 Nic Jansma
http://nicj.net

Licensed under the MIT license

## Introduction

Serially enumerating over a collection (such as using [async.js](https://github.com/caolan/async)'s 
`async.forEachSeries()` in Node.js or jQuery's `$.each()` in the browser) can lead to performance and
responsiveness issues if processing or looping through the collection takes
too long. In some browsers, enumerating over a large number of elements (or
doing a lot of work on each element) may cause the browser to become unresponsive,
and possibly prompt the user to stop running the script.

breakup.js helps solve this problem by breaking up the enumeration into
time-based chunks, and yielding to the environment if a threshold of time
has passed before continuing.  This will help avoid a Long Running Script
dialog in browsers as they are given a chance to update their UI.  It is meant
to be a simple, drop-in replacement for `async.forEachSeries()`.  It also provides
`breakup.each()` as a replacement for `jQuery.each()` (though the developer may
have to modify code-flow to deal with the asynchronous nature of breakup.js).

breakup.js does this by keeping track of how much time the enumeration has taken
after processing each item.  If the enumeration time has passed a threshold (the
default is 50ms, but this can be customized), the enumeration will yield before
resuming.  Yielding can be done immediately in environments that support it (such
as `process.nextTick()` in Node.js and `setImmediate()` in modern browsers), and
will fallback to a `setTimeout(..., 4)` in older browsers.  This yield will allow
the environment to do any UI and other processing work it wants to do.  In browsers,
this will help reduce the chance of a Long Running Script dialog.

breakup.js is primarily meant to be used in a browser environment, as Node.js code is
already asynchronously driven. You won't see a Long Running Script dialog in Node.js. However,
you're welcome to use the breakup Node.js module if you want have more control over how much 
time your enumerations take.  For example, if you have thousands of items to enumerate
and you want to process them lazily, you could set the threshold to 100ms with a 10000ms
wait time and specify the `forceYield` parameter, so other work is prioritized.

Changing `async.forEachSeries()` to `breakup.forEachSeries()` is as simple as
changing the module name.  You may add two additional parameters to fine-tune
the wait time and yield time if you prefer (see [Documentation](#Documentation) for details).

Changing `jQuery.each()` to `breakup.each()` requires a bit more work as you
will need to change from waiting for the function to return to waiting for a callback
to fire.  See the [`breakup.each()`](#each) for details.

## Download

Releases are available for download from [GitHub](https://github.com/nicjansma/breakup.js).

__Development:__ [breakup.js](https://github.com/nicjansma/breakup.js/raw/master/lib/breakup.js)
    - 8.1kb

__Production:__ [breakup.min.js](https://github.com/nicjansma/breakup.js/raw/master/dist/breakup.min.js)
    - 829b (minified / gzipped)

breakup.js is also available as the [npm breakup module](https://npmjs.org/package/breakup). You can install using 
Node Package Manager (npm):

    npm install breakup

breakup.js is also available via [bower](http://bower.io/). You can install using:

    bower install breakup.js

## Node.js / async.js

breakup.js can be used as a drop-in replacement for the `async.forEachSeries()` function in the
[async.js](https://github.com/caolan/async) Node.js module (which can also be used in browsers).

For example, instead of using `async.forEachSeries()`:

```js
var async = require('async');
async.forEachSeries(objs, function(i, item, callback) {}, function(err) {});
```

You can use breakup.js's version:

```js
var breakup = require('breakup');
breakup.forEachSeries(objs, function(i, item, callback) {}, function(err) {});
```

Additional parameters are available for `breakup.forEachSeries()` to control
the yielding behavior, see the [Documentation](#Documentation) for details.

## In The Browser

To use any of the breakup.js [functions](#Documentation), simply add a `<script>` tag:

```html
<script type="text/javascript" src="breakup.js"></script>
<script type="text/javascript">
    breakup.forEachSeries(data, iterateFn, function(err){
        // done
    });
</script>
```

## jQuery
breakup.js can be used as a replacement for jQuery's `jQuery.each()` as `breakup.each()`,
or as a replacement for the jQuery selector `jQuery(selector).each()` as `jQuery(selector).breakup()`.

However, breakup.js may require some changes to existing jQuery code so it will
know how to handle the asynchronous nature of breakup.js.  For example, when
you're using `jQuery.each()`, the operation will block until the enumeration
is complete.  Since breakup.js relies on callback events so it can yield to the browser,
existing jQuery code will need to pass in a callback-complete function parameter so it knows
when the enumeration has completed.  If you don't do this, the code that follows may
break on the assumption that all of the enumeration in `jQuery.each()` has
completed.  Essentially, you will need to change your code to handle callback-driven
flow control.

In addition, this type of change may require you to change any code calling
the function that the original `jQuery.each()` call was in if it returned a value
that depended on that work, as the new `breakup.each()`'s callback-complete function is
what will drive the new code flow.  If you need the return value of a function that is calling
`jQuery.each()` you will have to have `breakup.each()`'s callback-complete fire a
new callback with the return values instead of simply returning it in the original function call.

An example may help illustrate this better. You may be using `jQuery.each()` like this:

```js
function doIteration() {
    var a = [];

    $.each(
        objs,
        function(i, item) { a.push(item.something()); });

    return a.length;
}

var b = doIteration();
// 'b' has your work
```

Here's how you should adjust the above code for `breakup.each()`:

1. Change `jQuery.each()` (or `$.each()`) to `breakup.each()`
2. Add a third parameter to `breakup.each()`, which is the callback-complete function
3. Wrap any subsequent code that depended on work done in `$.each()` into
   your new callback-complete function (eg `return a.length` above)
4. Change any callers of this code to take a new completion callback instead of a return value

Sample:

```js
function doIteration(callback) {
    var a = [];

    breakup.each(
        objs,
        function(i, item)  { a.push(item.something()); },
        function(err) {
            callback(a.length);
        });
}

doIteration(function(b) {
    // 'b' has your work

    // the code calling this might need to be changed to be callback-driven as well
});
```

## Documentation

<a name="forEachSeries" />
### forEachSeries(arr, iterator, callback, workTime, yieldTime, forceYield)

This function should be a drop-in replacement for `async.forEachSeries()`.

Applies an iterator function to each item in an array, in series.
The iterator is called with an item from the list and a callback for when it
has finished. If the iterator passes an error to this callback, the main
callback for the forEachSeries function is immediately called with the error.

__Arguments__

* `arr` - An array to iterate over.
* `iterator(item, callback)` - A function to apply to each item in the array.
  The iterator is passed a `callback(err)` which must be called once it has completed.
  If no error has occurred, the callback should be run without arguments or
  with an explicit null argument.
* `callback(err)` - A callback which is called after all the iterator functions
  have finished, or an error has occurred.
* `workTime` - Work for this many milliseconds before yielding (optional, defaults
    to [`breakup.DEFAULT_WORK_TIME`](#DEFAULT_WORK_TIME)).
* `yieldTime` - Time (in milliseconds) to delay during yielding, if setImmediate is
    not available (optional, defaults to [`breakup.DEFAULT_YIELD_TIME`](#DEFAULT_YIELD_TIME)).
* `forceYield` - Force yielding for the specified milliseconds instead of setImmediate/nextTick (optional).

__Example__

```js
// Node.js
var breakup = require('breakup');

var arr = [];
breakup.forEachSeries(
    [1,2,3],
    function(item, callback) {
        arr.push(item);
        callback();
    },
    function(err) {
    }
);
```

You may set the `yieldTime` and `forceYield` parameters in a Node.js environment to force a yield of the
specified time instead of using Node's `process.nextTick()`.

<a name="each" />
### each(arr, iterator, callback, workTime, yieldTime, forceYield)

This function is meant to be a replacement for `jQuery.each()` or `jQuery(selector).each()`.

`jQuery.each()` can be replaced by `breakup.each()` (per [**NOTE**](#eachNote) below).

If jQuery is defined before breakup.js is included, jQuery will also be extended by
adding the `jQuery(selector).breakup()` function.

`each()` applies an iterator function to each item in an array, in series.
The iterator is called with the item's index, the item, and a callback for when it
has finished. If the iterator passes an error to this callback, the main
callback for the each function is immediately called with the error.

__Arguments__

* `arr` - An array to iterate over.
* `iterator(index, item, callback)` - A function to apply to each item in the array.
  The iterator is passed a `callback(err)` which must be called once it has completed.
  If no error has occured, the callback should be run without arguments or
  with an explicit null argument.
* `callback(err)` - A callback which is called after all the iterator functions
  have finished, or an error has occurred.
* `workTime` - Work for this many milliseconds before yielding (optional, defaults
    to [`breakup.DEFAULT_WORK_TIME`](#DEFAULT_WORK_TIME)).
* `yieldTime` - Time (in milliseconds) to delay during yielding, if setImmediate is
    not available (optional, defaults to [`breakup.DEFAULT_YIELD_TIME`](#DEFAULT_YIELD_TIME)).
* `forceYield` - Force yielding for the specified milliseconds instead of setImmediate/nextTick (optional).

__Example__

```js
var arr = [];
breakup.each(
    [1,2,3],
    function(index, item, callback) {
        arr.push(item);
        callback();
    },
    function(err) {
    }
);

// OR
$([1,2,3]).breakup(
    function(index, item, callback) {
        arr.push(item);
        callback();
    },
    function(err) {
    }
);
```
<a name="eachNote" />
**NOTE**: The difference between `breakup.forEachSeries()` and `breakup.each()`
is the iterator signature: `forEachSeries()` iterates with `function(item, callback)` and
requires the callback to indicate work is done.  This matches the `async.forEachSeries()`
signature.  On the other hand, `each()` matches the jQuery signature by using the iterator
`function(index, item, callback)`, and waiting on the return of the function to move to the next
item. If you need to switch from `jQuery.each()` to `breakup.forEachSeries()`, you will need
to change the signature, and thus your code flow, to handle the callback instead of the function return.

### DEFAULT_WORK_TIME

Default for how many milliseconds to enumerate for prior to yielding.

By default, this value is set to `50` (ms).

If not specified as the fourth parameter of `forEachSeries()` or `each()`, this value will be used.

You may overwrite this value to change the global default.

This will be a best-case scenario.  If a single item takes longer than the `DEFAULT_WORK_TIME`
to process, the yield won't occur until after that item fires its callback.  In other words,
enumeration won't yield mid-item: the time-check is performed only at each item's callback.

### DEFAULT_YIELD_TIME

How much time to yield for if `process.nextTick()` or `setImmediate()` is not available.

By default, this value is set to `4` (ms).

If not specified as the fifth parameter of `forEachSeries()` or `each()`, this value will be used.

You may overwrite this value to change the global default.

<a name="noConflict" />

### noConflict()

Changes the value of breakup back to its original value, returning a reference to the
breakup object.

## Tests

Tests are located under the `test/` directory.

You can run them in three ways:

1. Via `test/index.html` in your browser
2. Via `grunt mochaTest`, which runs the tests using Mocha in the NodeJS console
3. Via `grunt karma`, which runs the tests using Mocha/Karma in a headless PhantomJS instance

`grunt test` runs #2 and #3.

## Version History

* v0.1.0 - 2013-02-11 Initial version
* v0.1.1 - 2013-02-11 Added `forceYield` parameter
* v0.1.2 - 2015-02-08 Added `forceYield` parameter

## Thanks

This module (and documentation, tests, etc) were inspired by
[caolan's async.js module](https://github.com/caolan/async).