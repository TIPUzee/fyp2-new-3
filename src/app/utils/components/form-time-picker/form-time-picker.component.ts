import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgClass, NgForOf, NgIf } from "@angular/common";

@Component({
    selector: 'form-time-picker', standalone: true, imports: [
        FormsModule, NgForOf, NgIf, NgClass, ReactiveFormsModule
    ], templateUrl: './form-time-picker.component.html', styleUrl: './form-time-picker.component.scss'
})
export class FormTimePickerComponent implements AfterViewInit, OnInit {
    private static uuid = 0;
    static interactionStatuses = { 'idle': 0, 'focusedIn': 1, 'changed': 2, 'focusedOut': 3 };
    protected uuid: number;
    
    protected readonly document = document;
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
    
    @Input({ required: true }) controlName: string = '';
    @Input({ required: true }) errors!: Record<any, string>;
    
    @Input({ required: false }) showErrorOn: 'idle' | 'focusedIn' | 'changed' | 'focusedOut' = 'focusedOut';
    @ViewChild('timePickerEle') timePickerEle!: ElementRef<HTMLInputElement>;
    
    formGroup!: FormGroup;
    @Input({ required: false })
    formGroupName!: string | number;
    
    valueTime?: string;
    currentError: string = '';
    currentInteractionState: 0 | 1 | 2 | 3 = 0;
    
    
    constructor(private rootFormGroup: FormGroupDirective) {
        FormTimePickerComponent.uuid++;
        this.uuid = FormTimePickerComponent.uuid;
    }
    
    
    ngOnInit() {
        this.formGroup = this.rootFormGroup.control;
    }
    
    
    ngAfterViewInit() {
        this.initTimePickerInitialValue();
        this.initDefaultValue();
    }
    
    
    initDefaultValue(): void {
        if (this.defaultValue !== undefined) {
            this.formGroup.get(this.controlName)?.setValue(this.defaultValue);
        }
    }
    
    
    initTimePickerInitialValue(): void {
        if (this.formGroup.get(this.controlName)?.value === undefined ||
            this.formGroup.get(this.controlName)?.value === '') {
            return;
        }
        this.valueTime = this.formGroup.get(this.controlName)?.value;
    }
    
    
    markAsTouched(): void {
        this.formGroup.get(this.controlName)?.markAsTouched();
    }
    
    
    toShowError(): boolean | undefined {
        if (this.formGroup.get(this.controlName)?.touched ||
            this.currentInteractionState >=
            FormTimePickerComponent.interactionStatuses[this.showErrorOn]) {
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
}
