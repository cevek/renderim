import './base';
import {render, createElement, Suspense} from 'renderim';
test('', () => {
    render(
        <Suspense timeout={50} fallback={<div>My Loading...</div>}>
            <div class="wrapper">
                Hello
                <Data ms={20} />
            </div>
        </Suspense>,
        '#root',
    );

    // x(`
    // +Suspense
    //    +div
    //      +"Hello"
    //      +Data
    //        +""
    // `);

    // x(`
    // Data
    //   "Data"
    // `);

    // x(`
    // Suspense
    //    div
    //      "Hello"
    //      Data
    //        "Data"
    // `);
});

// var x: any;

const data: {[key: number]: string | Promise<void>} = {};
function Data({ms}: {ms: number}) {
    if (data[ms] === undefined) {
        data[ms] = new Promise(res => {
            return setTimeout(() => {
                data[ms] = 'DATA';
                res();
            }, ms);
        });
    }
    const val = data[ms];
    if (val instanceof Promise) throw val;
    return (val as {}) as JSX.Element;
}
