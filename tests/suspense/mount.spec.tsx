import {createElement, Suspense} from 'renderim';
import {createLoadData, render} from '../base';

test('fast load', done => {
    const LoadData = createLoadData();
    const result = render(
        <Suspense timeout={50} fallback={<div>Loading...</div>}>
            <div class="wrapper">
                <LoadData ms={20} />
                Hello
            </div>
        </Suspense>,
    );
    expect(result.tree).toMatchSnapshot('1.root');
    setTimeout(() => {
        expect(result.getNextRestartedComponent()).toMatchSnapshot('2.Suspense result');
        expect(result.getNextRestartedComponent()).toMatchSnapshot('3.Data');
        expect(result.getNextRestartedComponent()).toMatchSnapshot('4.Suspense result');
        expect(result.getNextRestartedComponent()).toBeUndefined();
        done();
    }, 100);
});

test('zero timeout', done => {
    const LoadData = createLoadData();
    const result = render(
        <Suspense timeout={0} fallback={<div>Loading...</div>}>
            <div class="wrapper">
                <LoadData ms={20} />
                Hello
            </div>
        </Suspense>,
    );
    expect(result.tree).toMatchSnapshot('1.root');
    setTimeout(() => {
        expect(result.getNextRestartedComponent()).toMatchSnapshot('2.Suspense with loading');
        expect(result.getNextRestartedComponent()).toMatchSnapshot('3.Suspense with loading2');
        expect(result.getNextRestartedComponent()).toMatchSnapshot('4.Data');
        expect(result.getNextRestartedComponent()).toBeUndefined();
        done();
    }, 100);
});

test('slow load', done => {
    const LoadData = createLoadData();
    const result = render(
        <Suspense timeout={20} fallback={<div>Loading...</div>}>
            <div class="wrapper">
                <LoadData ms={50} />
                Hello
            </div>
        </Suspense>,
    );
    expect(result.tree).toMatchSnapshot('1.root');
    setTimeout(() => {
        expect(result.getNextRestartedComponent()).toMatchSnapshot('2.Suspense with loading');
        expect(result.getNextRestartedComponent()).toMatchSnapshot('3.Suspense with loading2');
        expect(result.getNextRestartedComponent()).toMatchSnapshot('4.Data');
        expect(result.getNextRestartedComponent()).toMatchSnapshot('5.Suspense result');
        expect(result.getNextRestartedComponent()).toBeUndefined();
        done();
    }, 100);
});
