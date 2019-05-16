render(
    <div class="header">
        Hello
        <span class="selected">
            My name is <b>Alex</b>
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
    </div>,
    'root',
);

// unmount('root');
console.log(getCommandList());
