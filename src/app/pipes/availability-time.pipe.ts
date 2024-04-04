import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'availabilityTime',
    standalone: true
})
export class AvailabilityTimePipe implements PipeTransform {
    
    transform(times: number[]): string {
        if (!times || times.length !== 2) {
            return '';
        }
        
        const fromTime = this.formatTime(times[0]);
        
        const toTime = this.formatTime(times[1]);
        
        return `${ fromTime } - ${ toTime }`;
    }
    
    
    private formatTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = (
            hours % 12 === 0 ? 12 : hours % 12
        ).toString().padStart(2, '0');
        const formattedMinutes = mins.toString().padStart(2, '0');
        return `${ formattedHours }:${ formattedMinutes }${ ampm }`;
    }
}
