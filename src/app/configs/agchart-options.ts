import { AgChartBackground, AgChartOptions } from "ag-charts-community";

export const agChartBackgroundConfig = {
    background: {
        visible: false,
    } as AgChartBackground,
}

export const agChartAnimationConfig = {
    animation: {
        enabled: true,
        duration: 2000,
    } as AgChartOptions['animation'],
}
