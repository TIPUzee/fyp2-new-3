import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { expandCollapseAnimation } from "../../../services/animations";

@Component({
    selector: 'form-error-box',
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NgClass,
        NgIf,
        NgForOf,
    ],
    templateUrl: './form-error-box.component.html',
    styleUrl: './form-error-box.component.scss',
    animations: [expandCollapseAnimation],
})
export class FormErrorBoxComponent implements AfterViewInit, OnInit {
    
    @Input({ required: false }) disabled: boolean = false;
    
    @Input({ required: true }) controlName: string = '';
    @Input({ required: true }) errors!: Record<any, string>;
    @Input({ required: false }) formGroup1!: FormGroup;
    
    formGroup!: FormGroup;
    currentError: string = '';
    
    
    constructor(private rootFormGroup: FormGroupDirective) {
    }
    
    
    ngOnInit() {
        this.formGroup = this.rootFormGroup.control;
    }
    
    
    ngAfterViewInit() {
    }
    
    
    toShowError(): boolean | undefined {
        if (this.formGroup.get(this.controlName)?.touched) {
            return this.formGroup.get(this.controlName)?.invalid;
        }
        return false;
    }
    
    
    updateError(): false {
        this.currentError = '';
        for (let [errorName, errorDesc] of Object.entries(this.errors)) {
            if (this.toShowError() && this.formGroup.get(this.controlName)?.hasError(errorName)) {
                this.currentError = errorDesc;
                return false;
            }
        }
        return false;
    }
    
}
