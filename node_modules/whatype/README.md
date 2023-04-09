# whatype [![Build status](https://travis-ci.com/alcidesqueiroz/whatype.svg?branch=master)](https://travis-ci.com/alcidesqueiroz/whatype)

> 🕵 No more headaches to find the type of a value in JavaScript. Whatype is a tiny module that saves you from some annoying type-related WTFJSes.

<img src="https://gist.githubusercontent.com/alcidesqueiroz/c3d6c6edc559194bc37a2c464a21768d/raw/10b3f54010355c3bedfa3dbe7a1fb30ab0709c11/whatype.png" width="300" />

What is a type? Well, this is surely one of the most debated topics in computer science. This four-letter word means one thing in static type systems and something else, completely different, in dynamic type systems. **I won't dwell on that.** This module focus on the **practical/mundane/non-academic meaning of "type"**, with what we deal with everyday at work, more specifically in JavaScript (which isn't an example when it comes to type systems). =)

## Install

With npm:
```
$ npm install --save whatype
```

With Yarn:

```
$ yarn add whatype
```

## Usage
Whatype has two possible usages:
1. By calling the `whatype` function itself, which returns a string with the detected type.
2. By calling the `whatype.is` method, which checks if a value is of a specific type. For some needs, this form is way more versatile, since it allows checking for things like "pure-object", "literal-object",  "empty-array", "empty-object", "falsy", "truthy" and other possibilities.

### whatype(value)

Returns a string with the type of the passed value.

```javascript
const whatype = require('whatype');

// String primitives
whatype('whatever'); // => 'string'

// String objects are different from string primitives. Their typeof is "object".
// Whatype will normalize this, treating them in the same way as primitives
// If you want to differentiate between string objects and primitives, use whatype.is method instead
whatype(new String('foo')); // => 'string'

// No more typeof null === "object"... =)
whatype(null); // => 'null'

whatype(undefined); // => 'undefined'

// No more typeof NaN === "number"... =)
// Differently from what IEEE 754-1985 (and its 2008 revision) specifies,
// Whatype will not consider NaN as a number
whatype(NaN); // => 'not-a-number'

// Number primitives
whatype(0); // => 'number'
whatype(42); // => 'number'
whatype(30.5); // => 'number'
whatype(-17); // => 'number'

// Number objects are different from number primitives. Their typeof is "object".
// Whatype will normalize this, treating them in the same way as primitives
// If you want to differentiate between number objects and primitives, use whatype.is method instead
whatype(new Number('12')); // => 'number'

// Boolean primitives
whatype(true); // => 'boolean'
whatype(false); // => 'boolean'

// Boolean objects are different from boolean primitives. Their typeof is "object".
// Whatype will normalize this, treating them in the same way as primitives
// If you want to differentiate between boolean objects and primitives, use whatype.is method
whatype(new Boolean(1)); // => 'boolean'

// Differently from what IEEE 754-1985 (and its 2008 revision) specifies,
// Whatype will not consider Number.POSITIVE_INFINITY and Number.NEGATIVE_INFINITY as numbers
whatype(Infinity); // => 'infinity'
whatype(-Infinity); // => '-infinity'

whatype(function() { return arguments; }()); // => 'arguments'
whatype({}); // => 'object'
whatype(Object.create(null)); // => 'object'
whatype(new function(){}); // => 'object'
whatype({ a: 123 }); // => 'object'
whatype(/\d/); // => 'regexp'

// No more typeof [] === "object"... =)
// P.S: I know that arrays ARE objects. But in 99% of cases, you'll want to differentiate them
whatype([]); // => 'array'
whatype([ 11, 22 ]); // => 'array'

whatype(new Promise(() => {})); // => 'promise'
whatype(function(){}); // => 'function'
whatype(async function (){}); // => 'async-function'
whatype(function *(){}); // => 'generator-function'
whatype(() => {}); // => 'function'
whatype(Symbol('foo')); // => 'symbol'
whatype(new Date()); // => 'date'

// The returned type for every kind of error is simply "error", not "object"
// If you want to test for a specific type of error, use the whatype.is method instead
whatype(new Error()); // => 'error'
whatype(new ReferenceError()); // => 'error'
whatype(new EvalError()); // => 'error'
whatype(new TypeError()); // => 'error'
whatype(new URIError()); // => 'error'
whatype(new RangeError()); // => 'error'
whatype(new SyntaxError()); // => 'error'

// Maps
whatype(new Map()); // => 'map'
whatype(new WeakMap()); // => 'weak-map'

// Sets
whatype(new Set()); // => 'set'
whatype(new WeakSet()); // => 'weak-set'

// The returned type for every kind of typed array is simply "typed-array", not "object"
// If you want to test for a specific type of typed array, use the whatype.is method instead
whatype(new Float32Array()); // => 'typed-array'
whatype(new Float64Array()); // => 'typed-array'
whatype(new Int16Array()); // => 'typed-array'
whatype(new Int32Array()); // => 'typed-array'
whatype(new Int8Array()); // => 'typed-array'
whatype(new Uint16Array()); // => 'typed-array'
whatype(new Uint32Array()); // => 'typed-array'
whatype(new Uint8Array()); // => 'typed-array'
whatype(new ArrayBuffer(10)); // => 'array-buffer'

whatype(new DataView(new ArrayBuffer())); // => 'data-view'
```

### whatype.is(value, type)

Returns a boolean indicating if the value is of the supplied type.

```javascript
const whatype = require('whatype');

// Primitives
whatype.is('foo', 'string-primitive'); //=> true
whatype.is(new String('foo'), 'string-primitive'); //=> false
whatype.is(42, 'number-primitive'); //=> true
whatype.is(new Number('12'), 'number-primitive'); //=> false
whatype.is(false, 'boolean-primitive'); //=> true
whatype.is(new Boolean(1), 'boolean-primitive'); //=> false

// String, Number and Boolean objects
whatype.is(new String('foo'), 'string-object'); //=> true
whatype.is('foo', 'string-object'); //=> false
whatype.is(new Number('12'), 'number-object'); //=> true
whatype.is(12, 'number-object'); //=> false
whatype.is(new Boolean(1), 'boolean-object'); //=> true
whatype.is(true, 'boolean-object'); //=> false

// Falsy values
whatype.is('', 'falsy'); //=> true
whatype.is(new String(''), 'falsy'); //=> true
whatype.is(undefined, 'falsy'); //=> true
whatype.is(null, 'falsy'); //=> true
whatype.is(undefined, 'falsy'); //=> true
whatype.is(NaN, 'falsy'); //=> true
whatype.is(0, 'falsy'); //=> true
whatype.is(false, 'falsy'); //=> true
whatype.is(new Boolean(0), 'falsy'); //=> true

// Truthy values
whatype.is(42, 'truthy'); //=> true
whatype.is('whatever', 'truthy'); //=> true
whatype.is({}, 'truthy'); //=> true
whatype.is([], 'truthy'); //=> true
whatype.is(true, 'truthy'); //=> true
whatype.is(new Boolean(1), 'truthy'); //=> true

// Strings in general
whatype.is('whatever', 'string'); //=> true
whatype.is(new String('foo'), 'string'); //=> true

whatype.is(null, 'null'); //=> true
whatype.is(undefined, 'undefined'); //=> true

// 'nil' stands for null or undefined
whatype.is(null, 'nil'); //=> true
whatype.is(undefined, 'nil'); //=> true

whatype.is(NaN, 'not-a-number'); //=> true

// Differently from what IEEE 754-1985 (and its 2008 revision) specifies, Whatype will not consider
// NaN as a number, but it IS considered a SORT OF numeric value.
whatype.is(NaN, 'number'); //=> false
whatype.is(NaN, 'numeric'); //=> true

whatype.is(Infinity, 'infinity'); //=> true
whatype.is(-Infinity, '-infinity'); //=> true

// Differently from what IEEE 754-1985 (and its 2008 revision) specifies, Whatype will not consider
// Number.POSITIVE_INFINITY and Number.NEGATIVE_INFINITY as numbers, but these values are considered
// a sort of numeric value.
whatype.is(Infinity, 'number'); //=> false
whatype.is(-Infinity, 'number'); //=> false
whatype.is(Infinity, 'numeric'); //=> true
whatype.is(-Infinity, 'numeric'); //=> true

// Numbers in general
whatype.is(42, 'number'); //=> true
whatype.is(42, 'numeric'); //=> true
whatype.is(new Number('12'), 'number'); //=> true
whatype.is(new Number('12'), 'numeric'); //=> true

// Booleans in general
whatype.is(true, 'boolean'); //=> true
whatype.is(false, 'boolean'); //=> true
whatype.is(new Boolean(1), 'boolean'); //=> true

// Arguments objects
whatype.is(function() { return arguments; }(), 'arguments'); //=> true
whatype.is(function() { return arguments; }(), 'object'); //=> true

whatype.is({}, 'object'); //=> true
whatype.is(new function A(){}, 'object'); //=> true

// A literal object are those whose constructor is Object
whatype.is({ a: 123 }, 'literal-object'); //=> true
whatype.is(new function A(){}, 'literal-object'); //=> false

// Any literal object without own properties
whatype.is({}, 'empty-literal-object'); //=> true
whatype.is(new function A(){}, 'empty-literal-object'); //=> false

whatype.is(Object.create(null), 'object'); //=> true

// A pure object is an object created with Object.create(null).
// It neither has a constructor, nor inherits methods from the Object prototype.
whatype.is(Object.create(null), 'pure-object'); //=> true
whatype.is({}, 'pure-object'); //=> false

whatype.is(/\d/, 'regexp'); //=> true

// Arrays
whatype.is([], 'array'); //=> true
whatype.is([], 'empty-array'); //=> true
whatype.is([ 11, 22 ], 'empty-array'); //=> false

// Functions
whatype.is(function(){}, 'function'); //=> true
whatype.is(() => {}, 'function'); //=> true
whatype.is(async function (){}, 'function'); //=> true
whatype.is(function *(){}, 'function'); //=> true

// Specific types of function
whatype.is(function(){}, 'common-function'); //=> true
whatype.is(async function (){}, 'async-function'); //=> true
whatype.is(function *(){}, 'generator-function'); //=> true

whatype.is(Symbol('foo'), 'symbol'); //=> true
whatype.is(new Promise(() => {}), 'promise'); //=> true
whatype.is(new Promise(() => {}), 'object'); //=> true
whatype.is(new Date(), 'date'); //=> true
whatype.is(new Date(), 'object'); //=> true
whatype.is(new Error(), 'error'); //=> true
whatype.is(new Error(), 'object'); //=> true

// Errors
whatype.is(new ReferenceError(), 'error'); //=> true
whatype.is(new EvalError(), 'error'); //=> true
whatype.is(new TypeError(), 'error'); //=> true
whatype.is(new URIError(), 'error'); //=> true
whatype.is(new RangeError(), 'error'); //=> true
whatype.is(new SyntaxError(), 'error'); //=> true

// Specific types of error
whatype.is(new ReferenceError(), 'reference-error'); //=> true
whatype.is(new EvalError(), 'eval-error'); //=> true
whatype.is(new TypeError(), 'type-error'); //=> true
whatype.is(new URIError(), 'uri-error'); //=> true
whatype.is(new RangeError(), 'range-error'); //=> true
whatype.is(new SyntaxError(), 'syntax-error'); //=> true

// Maps
whatype.is(new Map(), 'map'); //=> true
whatype.is(new WeakMap(), 'weak-map'); //=> true

// Sets
whatype.is(new Set(), 'set'); //=> true
whatype.is(new WeakSet(), 'weak-set'); //=> true

// Typed arrays
whatype.is(new Float32Array(), 'typed-array'); //=> true
whatype.is(new Float64Array(), 'typed-array'); //=> true
whatype.is(new Int16Array(), 'typed-array'); //=> true
whatype.is(new Int32Array(), 'typed-array'); //=> true
whatype.is(new Int8Array(), 'typed-array'); //=> true
whatype.is(new Uint16Array(), 'typed-array'); //=> true
whatype.is(new Uint32Array(), 'typed-array'); //=> true
whatype.is(new Uint8Array(), 'typed-array'); //=> true

// Specific types of typed arrays
whatype.is(new Float32Array(), 'float32-array'); //=> true
whatype.is(new Float64Array(), 'float64-array'); //=> true
whatype.is(new Int16Array(), 'int16-array'); //=> true
whatype.is(new Int32Array(), 'int32-array'); //=> true
whatype.is(new Int8Array(), 'int8-array'); //=> true
whatype.is(new Uint16Array(), 'uint16-array'); //=> true
whatype.is(new Uint32Array(), 'uint32-array'); //=> true
whatype.is(new Uint8Array(), 'uint8-array'); //=> true
whatype.is(new ArrayBuffer(10), 'array-buffer'); //=> true

whatype.is(new DataView(new ArrayBuffer()), 'data-view'); //=> true
```

## Author

Alcides Queiroz Aguiar

- Website: [www.alcidesqueiroz.com](https://www.alcidesqueiroz.com)
- Medium: [@alcidesqueiroz](https://medium.com/@alcidesqueiroz)
- Twitter: [alcidesqueiroz](https://twitter.com/alcidesqueiroz)
- Behance [alcidesqueiroz](https://behance.net/alcidesqueiroz)
- Stack Overflow: [http://is.gd/aqanso](http://stackoverflow.com/users/1295666/alcides-queiroz-aguiar)
- E-mail: alcidesqueiroz &lt;at&gt; gmail

## License

This code is free to use under the terms of the [MIT License](LICENSE.md).
