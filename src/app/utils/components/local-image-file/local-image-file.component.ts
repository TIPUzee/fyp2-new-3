import { Component, Input } from '@angular/core';

@Component({
    selector: 'dynamic-image-file',
    standalone: true,
    imports: [],
    templateUrl: './local-image-file.component.html',
    styleUrl: './local-image-file.component.scss'
})
export class LocalImageFileComponent {
    protected imageObjectURL: string = '';
    @Input() alt: string = '';
    @Input({ required: false }) class: string | undefined;
    
    
    constructor() {}
    
    
    loadLocalImageFile(file: File | null) {
        if (!file) return;
        this.imageObjectURL = URL.createObjectURL(file);
    }
    
    
    public loadURLImageFile(url: string | null) {
        if (!url) return;
        this.imageObjectURL = url;
    }
}
