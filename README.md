# JSONSlick

A non-blocking, asynchronous, multi-thread javascript library for formatting in-spec JSON.

```javascript
import JSONSlick from "./JSONSlick.module.min.js";

const formatted_json = await JSONSlick( json_string );
```

```html
<script src="JSONSlick.min.js"></script>
<script>
const formatted_json = await JSONSlick( json_string );
</script>
```

## Basic Syntax & Parameters
```
await JSONSlick( json_string, [ tab_string, [ codesLineLength_int ] ] )
```
- json_string: `string` - JSON text to format.
- tab_string: `string` - Optional. Formatting whitespace. Default " ".
- codesLineLength_int: `int` - Optional. Must be greater than 0.  
	Arrays of numbers split into rows of this many elements.

See [parameters](#usage) for details and examples.

## Tiny, Fast, & Multi-Thread - Worry-Free

With 1 simple function call, all your JSON formatting happens off-thread without blocking or slowing your UI.

- *Tiny*: JSONSlick is only 4 KB. Its entire source code (including documentation, usage examples, and in-line algorithm comments) is under 400 lines.
- *Simple*: JSONSlick handles worker creation and messaging invisibly. It encapsulates multi-threading complexity in a simple Promise.  
- *Flexible*: Because it builds the worker's source in-line, JSONSlick can run multi-threading under the `file://` protocol.  
- *Memory Efficient*: Importing JSONSlick creates 1 worker that handles all calls. It never wastes memory on unused or redundant threads.
- *Memory Managing*: JSONSlick never leaves blobs or resources in memory. Only the worker and the function call exist. Everything else is meticulously garbage collected.

## Only In-Spec JSON

JSONSlick omits JSON validation in exchange for size and performance, a very worthy trade-off.

Because of this, it works only when paired with code that generates valid JSON, such as JavaScript's `JSON.stringify()`.

The only validation JSONSlick performs is the type-enforcement of its [parameters](#parameters).

-------------------------------------------------------

# Index

- [Usage](#usage)
	- [With Async Await (No Errors)](#with-async-await-no-errors)
	- [With Async Await (Errors)](#with-async-await-errors)
	- [With Modules](#with-modules)
	- [With Promise Chaining](#with-promise-chaining)
- [Parameters](#parameters)
	- [json](#json)
	- [tab](#tab)
	- [codesLineLength](#codesLineLength)
- [MIT License](#mit-license)

-------------------------------------------------------

# Usage

## With Async Await No Errors

No error-checking, for deployment.  
```javascript
const result = 
	await JSONSlick(
		json_string
	)
```
-------------------------------------------------------

## With Async Await Errors

With error-checking, for development.

Use errors to prevent passing the wrong parameters to JSONSlick.  
Once you have verified that your code is passing the correct parameters to JSONSlick, there is no need to catch errors.

```javascript
let result;
try {
	result = await JSONSlick(
		json_string,
		tab_string,
		codesLineLength_int
	)
} catch( message ) {
	console.error( 
		message.result, //reason for error
		message.error //error name
	);
}
```
-------------------------------------------------------

## With Modules

```javascript
import JSONSlick from "./JSONSlick.module.min.mjs";

const result = await JSONSlick( json_string );
```

Be sure your server is configured to serve ".mjs"
	files with MIME type `"application/javascript"`.

-------------------------------------------------------

## With Promise Chaining

```javascript
JSONSlick(
	json_string,
	tab_string,
	codesLineLength_int
).then( 
	formattedJSONString => {
		console.log(
			formattedJSONString
		)
	} 
).catch( 
	errorMessage => {
		console.error(
			errorMessage.error,
			errorMessage.result
		);
	} 
)
```

-------------------------------------------------------

# Parameters

## json

`json: string` 
- If `string` - The JSON string to format.
	- Note: Library behavior is undefined for malformed JSON.
- Else - throws `"Type Error"`

Example:
```javascript
await JSONSlick( `{"a":1}` );
```
```json
{
 "a": 1,
}
```

## tab

`tab: unset | string`
- If `string` - the character used as white-space while formatting.
	- Note: Any string is valid, including non-JSON white-space and non-white-space.
- Else If `unset` - defaults to 1 space " " (ASCII code 0x20).
- Else - throws `"Type Error"`

Example:
```javascript
await JSONSlick( `{"a":1}`, "	" )
```
```json
{
	"a": 1,
}
```

## codesLineLength

`codesLineLength: unset | ( int > 0 )`
- If `int > 2` - arrays containing only numbers will be formatted with a break-line after codesLineLength entries.
- Else If `1` or `unset` - arrays containing only numbers will break-line after every entry.
- Else - throws `"Type Error"`

Example:
```javascript
await JSONSlick( `[0,1,2,3,4,5,6,7,8,9,10,11]`, " ", 4 )
```
```json
[
 0, 1, 2, 3,
 4, 5, 6, 7,
 8, 9, 10, 11
]
```

-------------------------------------------------------

# MIT License

Copyright 2020 Jon Michael Galindo

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to 
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies 
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
