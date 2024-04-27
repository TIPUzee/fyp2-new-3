import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { NgClass, NgIf } from "@angular/common";

@Component({
    selector: 'form-submit-button',
    standalone: true,
    imports: [
        NgClass,
        NgIf
    ],
    templateUrl: './form-submit-button.component.html',
    styleUrl: './form-submit-button.component.scss'
})
export class FormSubmitButtonComponent implements OnInit {
    @Input({ required: true }) label: string = '';
    @Input({ required: false }) type: string = 'submit';
    @Input({ required: false }) waiting: boolean = false;
    @Input({ required: false }) disabled: boolean = false;
    @Input({ required: false }) disableOnStart: boolean = false;
    @Input({ required: false }) btnStyle: string = 'btn-blue';
    @Input({ required: false }) shadow: boolean = false;
    @Input({ required: false }) countDown: number = 0;
    
    @ViewChild('loader') loader!: HTMLDivElement;
    
    countDownInterval: any;
    currentCountDown: number = 0;
    
    
    constructor() {
    
    }
    
    
    ngOnInit() {
        this.disabled = this.disableOnStart;
        this.initCountDown();
    }
    
    
    initCountDown() {
        this.currentCountDown = this.countDown;
        if (this.countDownInterval) {
            clearInterval(this.countDownInterval);
        }
        if (this.countDown > 0) {
            this.countDownInterval = setInterval(() => {
                this.currentCountDown--;
                if (this.currentCountDown === 0) {
                    clearInterval(this.countDownInterval);
                }
            }, 1000);
        }
    }
}
