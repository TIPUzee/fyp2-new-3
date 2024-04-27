import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { Datepicker } from "tw-elements";

@Component({
    selector: 'form-date-picker', standalone: true, imports: [
        FormsModule, NgForOf, NgIf, NgClass, ReactiveFormsModule
    ], templateUrl: './form-date-picker.component.html', styleUrl: './form-date-picker.component.scss'
})
export class FormDatePickerComponent implements AfterViewInit, OnInit {
    static idCounter = 0;
    static interactionStatuses = { 'idle': 0, 'focusedIn': 1, 'changed': 2, 'focusedOut': 3 };
    protected id: number;
    @Input({ required: true }) label: string = '';
    @Input({ required: false }) placeholder: string = ' ';
    @Input({ required: false }) startDate?: `${ number }-${ number }-${ number }`;
    @Input({ required: false }) disabled: boolean = false;
    @Input({ required: false }) disableFuture: boolean = false;
    @Input({ required: false }) disablePast: boolean = false;
    @Input({ required: false }) minDate?: `${ number }-${ number }-${ number }`;
    @Input({ required: false }) maxDate?: `${ number }-${ number }-${ number }`;
    @Input({ required: false }) minDateFromNow?: {
        years?: number, months?: number, days?: number
    };
    @Input({ required: false }) maxDateFromNow?: {
        years?: number, months?: number, days?: number
    };
    @Input({ required: false }) defaultValue?: string;
    
    @Input({ required: false }) defaultView?: 'days' | 'months' | 'years';
    @Input({ required: true }) controlName: string = '';
    @Input({ required: true }) errors!: Record<any, string>;
    
    @Input({ required: false }) showErrorOn: 'idle' | 'focusedIn' | 'changed' | 'focusedOut' = 'focusedOut';
    @ViewChild('datePickerEle') datePickerEle!: ElementRef<HTMLInputElement>;
    
    formGroup!: FormGroup;
    
    datePickerTwInstance!: any;
    valueDate?: string;
    currentError: string = '';
    currentInteractionState: 0 | 1 | 2 | 3 = 0;
    
    
    constructor(private rootFormGroup: FormGroupDirective) {
        this.id = FormDatePickerComponent.idCounter++;
    }
    
    
    ngOnInit() {
        this.formGroup = this.rootFormGroup.control;
    }
    
    
    ngAfterViewInit() {
        this.initDatePickerInitialValue();
        this.initDatePicker();
        this.initDefaultValue();
    }
    
    
    calculateMaxDateFromNow(): string | undefined {
        if (!this.maxDateFromNow) {
            return this.maxDate;
        }
        
        const { years = 0, months = 0, days = 0 } = this.maxDateFromNow;
        const today = new Date();
        
        const maxDate = new Date(today.getFullYear() + years, today.getMonth() + months, today.getDate() + days);
        
        return maxDate.toISOString().split('T')[0];
    }
    
    
    calculateMinDateFromNow(): string | undefined {
        if (!this.minDateFromNow) {
            return this.minDate;
        }
        
        const { years = 0, months = 0, days = 0 } = this.minDateFromNow;
        const today = new Date();
        
        const minDate = new Date(today.getFullYear() + years, today.getMonth() + months, today.getDate() + days);
        
        return minDate.toISOString().split('T')[0];
    }
    
    
    getFinalDefaultView(): 'days' | 'months' | 'years' {
        if (this.defaultView !== undefined) {
            return this.defaultView;
        }
        
        return this.valueDate === undefined ? 'years' : 'days';
    }
    
    
    initDatePicker(): void {
        const _minDate = this.calculateMinDateFromNow();
        const _maxDate = this.calculateMaxDateFromNow();
        
        this.datePickerTwInstance = new Datepicker(this.datePickerEle.nativeElement, {
            format: 'yyyy-mm-dd',
            disableFuture: this.disableFuture,
            confirmDateOnSelect: true,
            disablePast: this.disablePast,
            min: _minDate === undefined ? null : _minDate,
            max: _maxDate === undefined ? null : _maxDate,
            startDate: this.startDate === undefined ? null : this.startDate,
            view: this.getFinalDefaultView(),
        });
    }
    
    
    initDatePickerInitialValue(): void {
        if (this.formGroup.get(this.controlName)?.value ===
            undefined ||
            this.formGroup.get(this.controlName)?.value ===
            '') {
            return;
        }
        this.valueDate = this.formGroup.get(this.controlName)?.value;
    }
    
    
    initDefaultValue(): void {
        if (this.defaultValue !== undefined) {
            this.formGroup.get(this.controlName)?.setValue(this.defaultValue);
        }
    }
    
    
    markAsTouched(): void {
        this.formGroup.get(this.controlName)?.markAsTouched();
    }
    
    
    toShowError(): boolean | undefined {
        if (this.formGroup.get(this.controlName)?.touched ||
            this.currentInteractionState >=
            FormDatePickerComponent.interactionStatuses[this.showErrorOn]) {
            return this.formGroup.get(this.controlName)?.invalid;
        }
        return false;
    }
    
    
    updateError(): false {
        this.currentError = '';
        for (let [errorName, errorDesc] of Object.entries(this.errors)) {
            if (this.formGroup.get(this.controlName)?.touched &&
                this.formGroup.get(this.controlName)?.hasError(errorName)
            ) {
                this.currentError = errorDesc;
                return false;
            }
        }
        return false;
    }
    
    
    updateInputStateActive() {
        if (!!this.defaultValue) {
            this.datePickerEle?.nativeElement.querySelector('[data-te-input-notch-ref]')?.setAttribute(
                'data-te-input-state-active',
                'true'
            );
        }
        return null;
    }
}
