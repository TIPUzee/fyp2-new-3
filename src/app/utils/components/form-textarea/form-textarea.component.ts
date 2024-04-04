import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HtmlService } from "../../../services/html.service";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { expandCollapseAnimation } from "../../../services/animations";

@Component({
    selector: 'form-textarea',
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NgClass,
        NgIf,
        NgForOf,
    ],
    templateUrl: './form-textarea.component.html',
    styleUrl: './form-textarea.component.scss',
    animations: [expandCollapseAnimation],
})
export class FormTextareaComponent implements AfterViewInit, OnInit {
    static idCounter: number = 0;
    protected id: number;
    @Input({ required: true }) label: string = '';
    @Input({ required: false }) placeholder: string = ' ';
    @Input({ required: false }) disabled: boolean = false;
    @Input({ required: false }) helperText: string = '';
    @Input({ required: false }) defaultValue?: string;
    @Input({ required: false }) rows: number = 5;
    @Input({ required: false }) showCounter: boolean = false;
    @Input({ required: false }) maxLength: number = 1000000;
    
    @Input({ required: true }) controlName: string = '';
    @Input({ required: true }) errors!: Record<any, string>;
    @Input({ required: false }) inputEleClasses: string = '';
    formGroup!: FormGroup;
    currentError: string = '';
    @ViewChild('textInputEle') textInputEle!: ElementRef<HTMLInputElement>;
    @ViewChild('textInputEleWrapper') textInputEleWrapper!: ElementRef<HTMLDivElement>;
    
    
    constructor(private rootFormGroup: FormGroupDirective, protected htmlService: HtmlService) {
        this.id = FormTextareaComponent.idCounter++;
    }
    
    
    ngOnInit() {
        this.formGroup = this.rootFormGroup.control;
    }
    
    
    ngAfterViewInit() {
        this.updateErrorEvent();
    }
    
    
    updateErrorEvent() {
        setInterval(() => {
            if (this.formGroup.get(this.controlName)?.value) {
                this.textInputEleWrapper?.nativeElement?.querySelector('[data-te-input-notch-ref]')?.setAttribute(
                    'data-te-input-state-active',
                    'true'
                );
                this.textInputEleWrapper?.nativeElement?.querySelector('input')?.setAttribute(
                    'data-te-input-state-active',
                    'true'
                );
            }
            
            if (this.formGroup.get(this.controlName)?.touched || this.formGroup.get(this.controlName)?.dirty) {
                for (let [errorName, errorDesc] of Object.entries(this.errors)) {
                    if (this.formGroup.get(this.controlName)?.hasError(errorName)) {
                        this.currentError = errorDesc;
                        return;
                    }
                }
                this.currentError = '';
            }
        }, 1500);
    }
    
}
