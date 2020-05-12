/*
    ~ JSONSlick ~

    A non-blocking / asynchronous, multi-thread javascript 
        library for formatting only in-spec JSON.

    -------------------------------------------------------

    Async / Await Usage (no error-checking, for deployment):

    const result = 
        await JSONSlick(
            json: string,
            tab: unset | string,
            codesLineLength: unset | ( int > 0 )
        )

    -------------------------------------------------------

    Async / Await Usage (with error-checking, for development):

    let result;
    try {
        result = await JSONSlick(
            json: string,
            tab: unset | string,
            codesLineLength: unset | ( int > 0 )
        )
    } catch( message ) {
        const {
            result,
            error
        } = message;
        console.error( result );
        throw error;
    }

    -------------------------------------------------------

    Promise Chaining Usage:

    JSONSlick(
        json: string,
        tab: unset | string,
        codesLineLength: unset | ( int > 0 )
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

    -------------------------------------------------------

    Parameters:
    
    json: string 
        - If string - The JSON string to format.
            - Note: Library behavior is undefined for malformed JSON.
        - Else - throws "Type Error"

    Example:
    -------------------------------------------------------
    |	await JSONSlick( `{"a":1}` )
    |		===
    |	{
    |	 "a": 1,
    |	}
    -------------------------------------------------------


    tab: unset | string
        - If string - the character used as white-space while formatting.
            - Note: Any string is valid, including non-JSON white-space and non-white-space.
        - Else If unset - defaults to 1 space " " (ASCII code 0x20).
        - Else - throws "Type Error"

    Example:
    -------------------------------------------------------
    |	await JSONSlick( `{"a":1}`, "	" )
    |		===
    |	{
    |		"a": 1,
    |	}
    -------------------------------------------------------

    codesLineLength: unset | ( int > 0 )
        - If int > 2 - arrays containing only numbers will be formatted with a break-line after codesLineLength entries.
        - Else If 1 or unset - arrays containing only numbers will break-line after every entry.
        - Else - throws "Type Error"

    Example:
    -------------------------------------------------------
    |	await JSONSlick( `[0,1,2,3,4,5,6,7,8,9,10,11]`, " ", 4 )
    |		===
    |	"[
    |	 0, 1, 2, 3,
    |	 4, 5, 6, 7,
    |	 8, 9, 10, 11
    |	]"
    -------------------------------------------------------

    
    -------------------------------------------------------
    MIT License

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
*/

const JSONSlick = ( () => {
    const workerFunction = ( message ) => {
        let [
            json, //string
            tab = " ", //string
            codesLineLength = 1, //int
        ] = message.data;
    
        if( message.data.length === 0 ) {
            self.postMessage( {
                result: `Error calling formatJSON( json:string, tab:unset|string, codesLineLength:unset|(int>0) )\n` +
                `json:string was of type <unset> but was expected to be of type <string>.`,
                error: "Type Error"
            } );
            return;
        }
        if( typeof json !== "string" ) {
            self.postMessage( {
                result: `Error calling formatJSON( json:string, tab:unset|string, codesLineLength:unset|(int>0) )\n` +
                `json:string was of type <${typeof json}> but was expected to be of type <string>.`,
                error: "Type Error"
            } );
            return;
        }
        if( message.data.length >= 2 &&
            typeof tab !== "string" ) {
            self.postMessage( {
                result: `Error calling formatJSON( json:string, tab:unset|string, codesLineLength:unset|(int>0) )\n` +
                `tab:unset|string was of type <${typeof tab}> but was expected to be of type <unset> or of type <string>.`,
                error: "Type Error"
            } );
            return;
        }
        if( message.data.length >= 3 &&
            typeof codesLineLength !== "number" ) {
            self.postMessage( {
                result: `Error calling formatJSON( json:string, tab:unset|string, codesLineLength:unset|(int>0) )\n` +
                `codesLineLength:unset|(int>0) was of type <${typeof codesLineLength}> but was expected to be of type <unset> or of type <(int>0)>.`,
                error: "Type Error"
            } );
            return;
        }
        if( message.data.length >= 3 &&
            typeof codesLineLength === "number" &&
            parseInt( codesLineLength ) !== codesLineLength ) {
            self.postMessage( {
                result: `Error calling formatJSON( json:string, tab:unset|string, codesLineLength:unset|(int>0) )\n` +
                `codesLineLength:unset|(int>0) was of type <float> but was expected to be of type <unset> or of type <(int>0)>.`,
                error: "Type Error"
            } );
            return;
        }
        if( message.data.length >= 3 &&
            typeof codesLineLength === "number" &&
            parseInt( codesLineLength ) === codesLineLength &&
            codesLineLength <= 0 ) {
            self.postMessage( {
                result: `Error calling formatJSON( json:string, tab:unset|string, codesLineLength:unset|(int>0) )\n` +
                `codesLineLength:unset|(int>0) was of type <(int<=0)> but was expected to be of type <unset> or of type <(int>0)>.`,
                error: "Type Error"
            } );
            return;
        }
    
        //remove prior formatting
        json = json.replace( /\s/gm, "" );
    
        //non-code characters
        const nonCodeCharacters = /["[{]]/gm;
    
        let i = 0, //json pointer
            formattedJSON = "", //accumulated result
            inString = false, //string parser
            inCodeArray = false, //code array parser
            codeArrayDepth = 0, //code array length tracker
            escapeNextChar = false, //1-length escape sequence parser
            tabDepth = ""; //indent tracker
    
        while( i < json.length ) {
            const ch = json.charAt( i ),
                peek = ( i < json.length - 1 ) ?
                    json.charAt( i + 1 ) : null,
                recall = ( i > 0 ) ?
                    json.charAt( i - 1 ) : null;
    
            //only apply formatting outside of strings
            if( inString === false ) {
                //enter string
                if( ch === '"' ) {
                    inString = true;
                    formattedJSON += ch;
                }
                //break line and increase tab depth
                else if( ch === "{" ||
                    ch === "[" ) {
                    if( peek === "}" ||
                        peek === "]" ) {
                        formattedJSON += ch;
                    }
                    else {
                        formattedJSON += ch;
                        formattedJSON += "\n";
                        tabDepth += tab;
                        formattedJSON += tabDepth;
                        if( codesLineLength &&
                            ch === "[" ) {
                            //scan array for all nums
                            const arrayEnd = 
                                    json.indexOf( "]", i ),
                                arrayChars =
                                    json.substring( i, arrayEnd ),
                                nonCodeEntries =
                                    arrayChars.match(
                                        nonCodeCharacters
                                    );
                            if( nonCodeEntries === null )
                                inCodeArray = true;
                        }
                    }
                }
                //break line
                else if( ch === "," ) {
                    formattedJSON += ch;
                    if( inCodeArray === true ) {
                        ++codeArrayDepth;
                        if( codeArrayDepth === 
                            codesLineLength ) {
                            formattedJSON += "\n";
                            formattedJSON += tabDepth;
                            codeArrayDepth = 0;
                        }
                        else formattedJSON += tab;
                    }
                    else {
                        formattedJSON += "\n";
                        formattedJSON += tabDepth;
                    }
                }
                //space keys
                else if( ch === ":" ) {
                    formattedJSON += ch;
                    formattedJSON += tab;
                }
                //break line and decrease tab depth
                else if( ch === "}" ||
                    ch === "]" ) {
                    if( recall === "{" ||
                        recall === "[" ) {
                        formattedJSON += ch;
                    }
                    else {
                        formattedJSON += "\n";
                        tabDepth = tabDepth.replace( tab, "" );
                        formattedJSON += tabDepth;
                        formattedJSON += ch;
                        if( inCodeArray === true &&
                            ch === "]" ) {
                            inCodeArray = false;
                        }
                    }
                }
                else formattedJSON += ch;
            }
            else {
                //only escaped " matter, so 1-char only
                //enter escape sequence
                if( escapeNextChar === false &&
                    ch === '\\' ) {
                    escapeNextChar = true;
                    formattedJSON += ch;
                }
                //exit escape sequence
                else if( escapeNextChar === true &&
                    ch === '\\' ) {
                    escapeNextChar = false;
                    formattedJSON += ch;
                }
                //exit string
                else if( escapeNextChar === false &&
                    ch === '"' ) {
                    inString = false;
                    formattedJSON += ch;
                }
                else formattedJSON += ch;
            }
    
            //advance pointer
            ++i;
        }
        self.postMessage( {
            result: formattedJSON
        } )
    }

    const workerSource = `
            "use strict";
            onmessage = 
                ${workerFunction.
                    toLocaleString()}
            `,
        sourceFile = new Blob(
            [ workerSource ],
            { type: "text/javascript" }
        ),
        sourceURL = 
            URL.createObjectURL(
                sourceFile
            ),
        worker = new Worker(
                sourceURL
            );

    //revoke our URL
    URL.revokeObjectURL( sourceURL );

    /*	
        No way to revoke our sourceFile:blob.

        Instead, we'll access our worker from 
        the global scope so our sourceFile:blob 
        doesn't get trapped in scope and become 
        a memory leak.
    */
    const useWorkerFunction = ( ...parameters ) => {
            return new Promise(
                ( finish, fail ) => {
                    worker.onmessage =
                        message => {
                            const {
                                result,
                                error
                            } = message.data;

                            if( error ) fail( message.data )
                            else finish( result )
                        }
                    worker.postMessage( 
                        parameters 
                    )
                }
            )
        },
        userSource = `
            "use strict";
            return (
                ${useWorkerFunction.
                    toLocaleString()}
            )`,
        useScoper = Function( 
            "worker", //parameter name
            userSource //function code
        ),
        use = useScoper(
            worker //only worker is in use's scope
        );

    return use;
} )();