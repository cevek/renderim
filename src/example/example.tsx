render(
    <Suspense timeout={5000} fallback={<div>Loading...</div>}>
        <div class="header">
            Hello
            <span class="selected">
                My name is <b>{'Alex'}</b>
            </span>
            {[0, 1, 2, 3, 4, 5].map(n => (
                <Fragment key={n}>
                    {n}
                    {n * 10}
                </Fragment>
            ))}
            {null}
        </div>
    </Suspense>,
    'root',
);

let data: any;
function Data() {
    if (data === undefined) {
        throw new Promise(res => {
            return setTimeout(() => {
                data = 'DATA';
                res();
            }, 1000);
        });
    }
    return data;
}

debugger;
render(
    <Suspense timeout={5000} fallback={<div>Loading...</div>}>
        <div class="body" title="hello">
            Hello
            <span class="selected">
                My name is <b>Brian</b>
            </span>
            {[0, 4, 3, 2, 1, 5].map(n => (
                <Fragment key={n}>
                    {n}
                    {n * 10}
                </Fragment>
            ))}
            {/* <Suspense timeout={500} fallback={<div>Loading...</div>}> */}
            Hello
            <Data />
            Everybody
            {/* </Suspense> */}
            <svg width="100" height="100">
                <symbol id="my-icon" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
                </symbol>
                <use xlinkHref="#my-icon" x="10" y="10" />
            </svg>
        </div>
    </Suspense>,
    'root',
);
debugger;

// declare var worker: Worker;
// let k = 0;
// console.time('perf');
// worker.postMessage(getCommandList());
// worker.onmessage = e => {
//     // console.log(e.data);
//     k++;
//     if (k === 10000) {
//         console.timeEnd('perf');
//     } else {
//         worker.postMessage(getCommandList());
//     }
// };

// unmount('root');
