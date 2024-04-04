import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'appointmentDuration',
    standalone: true
})
export class AppointmentDurationPipe implements PipeTransform {
    
    transform(dates: Date[]): string {
        // Ensure dates array has two elements
        if (dates.length !== 2 || !dates[0] || !dates[1]) {
            return '';
        }
        
        // Extract day, time, and date components
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = days[dates[0].getDay()];
        const timeFrom = this.formatTime(dates[0]);
        const timeTo = this.formatTime(dates[1]);
        const date = this.formatDate(dates[0]);
        
        // Construct the final string
        return `${ dayOfWeek } - ${ timeFrom } to ${ timeTo } - ${ date }`;
    }
    
    
    // Helper method to format date as "MM/DD/YYYY"
    private formatDate(date: Date): string {
        const month = (
            date.getMonth() + 1
        ).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${ month }/${ day }/${ year }`;
    }
    
    
    // Helper method to format time in 12-hour format with AM/PM
    private formatTime(date: Date): string {
        console.info("date", date);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 12-hour clock, so 0 is 12
        return `${ hours }:${ minutes.toString().padStart(2, '0') } ${ ampm }`;
    }
    
}
