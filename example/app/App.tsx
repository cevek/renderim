import {createElement, client} from 'renderim';
import {GoogleMaps} from '../GoogleMaps';
const Chart = client(() => import('../chart/ChartClient'));

export function App(props: {}) {
    return (
        <div>
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
            />
            <GoogleMaps
                apiKey="AIzaSyD6X_qD5BBQqZWHlWwSxlPh4lN-swQ2RAw"
                width="200px"
                height="200px"
                center={{lat: -34.397, lng: 150.644}}
                zoom={8}
            />
        </div>
    );
}
