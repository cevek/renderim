import {createElement, Suspense, ErrorBoundary} from 'renderim';
import {createLoadData, render} from '../base';

function FallbackWithError(props: {error: any}) {
    return props.error.message.a.b.c.d;
}
function Errored() {
    var x = {} as {a: {b: {c: JSX.Element}}};
    return x.a.b.c;
}

test('Error in fallback with parent boundary ', () => {
    const result = render(
        <div>
            Hello
            <ErrorBoundary fallback={err => err.message}>
                <ErrorBoundary
                    fallback={err => {
                        throw new Error('foo');
                    }}>
                    <Errored />
                </ErrorBoundary>
            </ErrorBoundary>
        </div>,
    );
    expect(result.tree).toMatchSnapshot('1.root');
    expect(result.getNextRestartedComponent()).toMatchSnapshot('2.Inner ErrorBoundary');
    expect(result.getNextRestartedComponent()).toMatchSnapshot('3.Outer ErrorBoundary');
    expect(result.getNextRestartedComponent()).toBeUndefined();
});

test('Error in inner fallback component with parent boundary', () => {
    const result = render(
        <div>
            Hello
            <ErrorBoundary fallback={err => err.message}>
                <ErrorBoundary fallback={err => <FallbackWithError error={err} />}>
                    <Errored />
                </ErrorBoundary>
            </ErrorBoundary>
        </div>,
    );
    expect(result.tree).toMatchSnapshot('1.root');
    expect(result.getNextRestartedComponent()).toMatchSnapshot('2.Inner ErrorBoundary');
    expect(result.getNextRestartedComponent()).toMatchSnapshot('3.Outer ErrorBoundary');
    expect(result.getNextRestartedComponent()).toBeUndefined();
});

test('Error in fallback without parent boundary', () => {
    const consoleError = jest.fn();
    console.error = consoleError;
    const result = render(
        <div>
            Hello
            <ErrorBoundary fallback={err => <FallbackWithError error={err} />}>
                <Errored />
            </ErrorBoundary>
        </div>,
    );
    expect(result.tree).toBeUndefined();
    expect(result.getNextRestartedComponent()).toMatchSnapshot('1.ErrorBoundary');
    expect(result.getNextRestartedComponent()).toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
});

test('no parent boundary', () => {
    const consoleError = jest.fn();
    console.error = consoleError;
    const result = render(
        <div>
            Hello
            <Errored />
        </div>,
    );
    expect(result.tree).toBeUndefined();
    expect(result.getNextRestartedComponent()).toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
});
