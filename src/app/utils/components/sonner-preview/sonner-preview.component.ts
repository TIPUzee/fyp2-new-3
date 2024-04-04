import { Component } from '@angular/core';
import { toast } from 'ngx-sonner';

@Component({
    selector: 'spartan-sonner-preview',
    standalone: true,
    imports: [],
    templateUrl: './sonner-preview.component.html',
    styleUrl: './sonner-preview.component.scss'
})
export class SonnerPreviewComponent {
    
    showToast() {
        toast('Event has been created', {
            description: 'Sunday, December 03, 2024 at 9:00 AM',
            action: {
                label: 'Undo',
                onClick: () => console.log('Undo'),
            }
        })
    }
}
