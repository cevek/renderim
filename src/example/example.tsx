render(
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
    </div>,
    'root',
);
render(
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
        <svg width="100" height="100">
            <symbol id="my-icon" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
            </symbol>
            <use xlinkHref="#my-icon" x="10" y="10" />
        </svg>
    </div>,
    'root',
);

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
renderCommands(getCommandList());
console.log(getCommandList());
