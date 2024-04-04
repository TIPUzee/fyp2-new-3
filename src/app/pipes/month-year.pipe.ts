import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
    name: 'monthYear',
    standalone: true
})
export class MonthYearPipe implements PipeTransform {
    
    transform(date: Date): string {
        if (!date) {
            return '';
        }
        
        return new DatePipe('en-US').transform(date, 'MMMM yyyy') || '';
    }
}
