import * as Highcharts from 'highcharts';

export default function(dom: HTMLElement, props: Highcharts.Options) {
    const chart = Highcharts.chart(dom, props);
    return {
        update(newProps: typeof props) {
            chart.update(newProps);
        },
        destroy() {
            chart.destroy();
        },
    };
}
