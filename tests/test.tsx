import {createElement, Suspense} from 'renderim';
import {createLoadData, render, getNextRestartedComponent} from './base';

test('Suspense mount', done => {
    const LoadData = createLoadData();
    const rootNode = render(
        <Suspense timeout={50} fallback={<div>Loading...</div>}>
            <div class="wrapper">
                <LoadData ms={20} />
                Hello
            </div>
        </Suspense>,
    );
    expect(rootNode).toMatchSnapshot('root');
    setTimeout(() => {
        expect(getNextRestartedComponent()).toMatchSnapshot('Suspense');
        expect(getNextRestartedComponent()).toMatchSnapshot('Data');
        done();
    }, 100);
});
