import {createElement, ErrorBoundary, getCurrentComponent, restartComponent, ComponentInstance} from 'renderim';
import {render} from '../base';

test('Dedup component restarts', () => {
    let foo!: ComponentInstance;
    let bar!: ComponentInstance;
    function Foo(props: {}) {
        foo = getCurrentComponent();
        return (
            <span>
                <Bar />
            </span>
        );
    }
    function Bar(props: {}) {
        bar = getCurrentComponent();
        return <span>123</span>;
    }

    const result = render(
        <div>
            <Foo />
        </div>,
    );
    restartComponent(foo);
    restartComponent(bar);
    expect(result.tree).toMatchSnapshot('1.root');
    // expect(result.getNextRestartedComponent()).toMatchSnapshot('2.Inner ErrorBoundary');
    // expect(result.getNextRestartedComponent()).toMatchSnapshot('3.Outer ErrorBoundary');
    expect(result.getNextRestartedComponent()).toBeUndefined();
});
