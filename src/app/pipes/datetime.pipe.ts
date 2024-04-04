import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'datetime',
    standalone: true
})
export class DatetimePipe implements PipeTransform {
    
    transform(date: Date): string {
        if (!date) {
            return '';
        }
        
        // Extract day, time, and date components
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = days[date.getDay()];
        const formattedTime = this.formatTime(date);
        const formattedDate = this.formatDate(date);
        
        // Construct the final string
        return `${ dayOfWeek } - ${ formattedTime } - ${ formattedDate }`;
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
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 12-hour clock, so 0 is 12
        return `${ hours }:${ minutes.toString().padStart(2, '0') } ${ ampm }`;
    }
}
