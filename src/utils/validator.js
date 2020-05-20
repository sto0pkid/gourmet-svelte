/**
An extremely simple validator. 

We check that the type of object matches expected.

Arrays and Objects are handled recursively.

For more than type checking, we offer two convenience functions: is_in and is, which will offer === equality checking and indexOf equality checking.

**/
export let settings = {
    isChatty : true
}

function validate (obj, expected) {
    if (expected && expected.__isValidator) {
        expected(obj)
    }
    else if (expected===null) {
        if (obj) {
            settings.isChatty && console.log('Expected null (or at least falsey) value, but got',typeof obj);
            let e = new Error(`Expect null but got ${typeof obj}`);
            e.expected = expected
            e.actual = obj;
            throw e;
        }
    }
    else {
        if (typeof obj !== typeof expected) {
            settings.isChatty && console.log('Expected',typeof expected,'but got',typeof obj);
            let e = new Error(`Expect ${typeof expected} but got ${typeof obj}`);
            e.expected = expected
            e.actual = obj;
            throw e;
        }
        if (Array.isArray(expected)) {
            for (let n=0; n<expected.length; n++) {
                let item = expected[n];
                try {
                    validate(obj[n],expected[n])
                }
                catch (err) {
                    let e = new Error(`Error validating item ${n} of array`)
                    e.expectedArray = expected;
                    e.actualArray = obj;
                    e.error = err;
                    throw e;
                }
            }
        }
        if (typeof expected==='object') {
            for (let prop in expected) {
                try {
                    validate(obj[prop],expected[prop])
                }
                catch (err) {
                    settings.isChatty && console.log('Error in prop',prop,err);
                    let e = new Error(`Error in property ${prop}`);
                    e.expectedObject = expected;
                    e.actualObject = obj;
                    e.error = err;
                    throw e;
                }
            }
        }
    }
}

function Validator (name,f) {
    const v =  function (v) {
        if (!f(v)) {
            throw Error('Invalid value:',v,'according to validator',name)
        }
    }
    v.__isValidator = true
    return v;
}

export function is_in (arr) {
    return Validator(
        `is one of ${JSON.stringify(arr)}`,
        (v)=>arr.indexOf(v)>-1
    );
}

export function is (obj) {
    return Validator(
        `is ${JSON.stringify(obj)}`,
        (v)=>v===obj
    );
}

export default validate;