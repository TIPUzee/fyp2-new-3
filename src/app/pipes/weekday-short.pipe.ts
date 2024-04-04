import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'weekdayShort',
    standalone: true
})
export class WeekdayShortPipe implements PipeTransform {
    
    transform(value: number): unknown {
        switch (value) {
            case 0:
                return 'Mon';
            case 1:
                return 'Tue';
            case 2:
                return 'Wed';
            case 3:
                return 'Thu';
            case 4:
                return 'Fri';
            case 5:
                return 'Sat';
            case 6:
                return 'Sun';
        }
        
        return '';
    }
    
}
