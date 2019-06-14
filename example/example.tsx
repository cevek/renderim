import R, {
    Suspense,
    createContext,
    ErrorBoundary,
    Portal,
    Fragment,
    render,
    lazy,
    IntersectionObserverContainer,
    IntersectionObserverElement,
    withPreventDefault,
    withTargetValue,
} from 'renderim';
import './example.scss';
const MyLazy = lazy(() => import('./lazy'));
const MyContext = createContext('DefaultContext');

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
function MyError(props: {error: any}) {
    return props.error.message.a.b.c.d;
}
function F() {
    return x.a.b.c;
}
var x: any;
render(
    <Suspense timeout={0} fallback={<div>My Loading...</div>}>
        <div class="wrapper">
            Hello
            <Data ms={3000} />
        </div>
    </Suspense>,
    '#root',
);

render(
    <Suspense timeout={0} fallback={<div>My Loading...</div>}>
        <div class="wrapper">
            Hello
            <Data ms={3000} />
        </div>
    </Suspense>,
    '#root',
);

// render(
//     <Suspense timeout={1000} fallback={<div>My Loading...</div>}>
//         <div class="header">
//             123
//             <Data ms={200} />
//             <Data ms={3000} />
//         </div>
//     </Suspense>,
//     '#root',
// );

// render(
//     <Suspense timeout={1000} fallback={<div>My Loading...</div>}>
//         <div class="header">
//             Hello
//             <Data />
//             <span onClick={() => console.log('click1')} class="selected" style={{color: 'red', margin: '10px'}}>
//                 My name is <b>{'Alex'}</b>
//             </span>
//             <input type="text" defaultValue="hello" />
//             <input type="checkbox" defaultChecked onChange={() => {}} />
//             <input type="radio" defaultChecked onChange={() => {}} />
//             <textarea defaultValue="text" />
//             <Portal container="#modals">
//                 <div>Header</div>
//                 <div>Modal</div>
//                 <div>Footer</div>
//             </Portal>
//             {[0, 1, 2, 3, 4, 5].map(n => (
//                 <Fragment key={n}>
//                     {n}
//                     {n * 10}
//                 </Fragment>
//             ))}
//             {null}
//         </div>
//     </Suspense>,
//     '#root',
// );

// // debugger;
// render(
//     <Suspense timeout={1000} fallback={<div>My Loading...</div>}>
//         <div class="body" title="hello">
//             Hello
//             <Data />
//             <span
//                 onClick={() => console.log('click2')}
//                 class="selected"
//                 style={{color: 'blue', padding: '10px', display: 'block'}}>
//                 My name is <b>Brian</b>
//             </span>
//             <input type="text" defaultValue="hello man" />
//             <input type="checkbox" defaultChecked onChange={() => {}} />
//             <input type="radio" defaultChecked onChange={() => {}} />
//             <textarea defaultValue="some text" />
//             <Portal container="#modals">
//                 <div>Header</div>
//                 <content>Modal</content>
//                 <div>Footer</div>
//             </Portal>
//             {[0, 4, 3, 2, 1, 5].map(n => (
//                 <Fragment key={n}>
//                     {n}
//                     {n * 10}
//                 </Fragment>
//             ))}
//             {/* <Suspense timeout={500} fallback={<div>Loading...</div>}> */}
//             Hello Everybody
//             {/* <ErrorBoundary fallback={props => props.errors.map(err => <div>{err.message}</div>)}>
//                 1
//                 <Value value={2} />
//                 <Errored />
//                 <Value value={3} />4
//                 <Errored />
//             </ErrorBoundary> */}
//             <MyContext.Provider value="Context">
//                 <MyContext.Consumer>{value => value}</MyContext.Consumer>
//             </MyContext.Provider>
//             <MyContext.Consumer>{value => value}</MyContext.Consumer>
//             {/* </Suspense> */}
//             <svg width="100" height="100">
//                 <symbol id="my-icon" viewBox="0 0 100 100">
//                     <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
//                 </symbol>
//                 <use xlinkHref="#my-icon" x="10" y="10" />
//             </svg>
//             <select value="2">
//                 <option value="1">1</option>
//                 <option value="2">2</option>
//             </select>
//             <MyLazy name="hi" />
//             <form
//                 onSubmit={withPreventDefault(() => {
//                     console.log('Submit');
//                 })}>
//                 <input type="checkbox" defaultChecked onChange={() => {}} />
//                 <input type="checkbox" checked onChange={() => {}} />
//                 <input
//                     type="text"
//                     defaultValue=""
//                     onChange={withTargetValue(val => {
//                         console.log('input value', val);
//                     })}
//                 />
//                 <input
//                     type="text"
//                     value=""
//                     onInput={withTargetValue(val => {
//                         console.log('input value', val);
//                     })}
//                 />
//             </form>
//             <IntersectionObserverContainer>
//                 <div>
//                     <IntersectionObserverElement
//                         onVisible={params => {
//                             console.log('onVisible', params);
//                         }}
//                         onVisibleParams={{boundingClientRect: {x: 0, y: 0}}}
//                         onInvisible={() => {
//                             console.log('onInvisible');
//                         }}>
//                         <div>123</div>
//                     </IntersectionObserverElement>
//                 </div>
//             </IntersectionObserverContainer>
//             {/* <div customChild={{name: 'foo', data: {}, url: () => import('./@babel/core')}} /> */}
//         </div>
//     </Suspense>,
//     '#root',
// );
// debugger;

function Value(props: {value: number}) {
    return <span>{props.value}</span>;
}
function Errored(props: {}) {
    throw new Error('Some error');
}

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
