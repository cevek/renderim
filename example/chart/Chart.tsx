// export default class {
//     constructor(public dom: Node) {}
//     onMount() {}
//     onUpdate() {}
//     onUnmount() {}
// }

import {createElement, client} from 'renderim';
import {GoogleMaps} from 'GoogleMaps';
const Chart = client(() => import('./ChartClient'));
<Chart
    {...{
        chart: {
            type: 'bar',
        },
        title: {
            text: 'Fruit Consumption',
        },
        xAxis: {
            categories: ['Apples', 'Bananas', 'Oranges'],
        },
        yAxis: {
            title: {
                text: 'Fruit eaten',
            },
        },
        series: [
            {
                name: 'Jane',
                data: [1, 0, 4],
                type: 'bar',
            },
            {
                name: 'John',
                data: [5, 7, 3],
                type: 'bar',
            },
        ],
    }}
/>;


