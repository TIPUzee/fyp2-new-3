import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dob',
    standalone: true
})
export class DobPipe implements PipeTransform {
    
    transform(value: Date | undefined): number | string {
        if (value === undefined) {
            return 'Not Available';
        }
        let dob = new Date(value);
        let today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        let m = today.getMonth() - dob.getMonth();
        if (m <
            0 ||
            (
                m === 0 && today.getDate() < dob.getDate()
            )) {
            age--;
        }
        return age;
    }
    
}
