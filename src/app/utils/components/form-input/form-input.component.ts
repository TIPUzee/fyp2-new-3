import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { expandCollapseAnimation } from "../../../services/animations";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faEye as faEyeSolid } from "@fortawesome/free-solid-svg-icons";
import { faEye as faEyeRegular } from "@fortawesome/free-regular-svg-icons";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MonoTypeOperatorFunction } from "rxjs";

@Component({
    selector: 'form-input',
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NgClass,
        NgIf,
        NgForOf,
        FontAwesomeModule,
    ],
    templateUrl: './form-input.component.html',
    styleUrl: './form-input.component.scss',
    animations: [expandCollapseAnimation],
})
export class FormInputComponent implements AfterViewInit, OnInit {
    takeUntilDestroyed: MonoTypeOperatorFunction<this>;

    static idCounter: number = 0;
    protected id: number;
    faEyeSolidIcon = faEyeSolid;
    faEyeRegularIcon = faEyeRegular;
    @Input({ required: false }) label: string = '';
    @Input({ required: true }) type: string = 'text';
    @Input({ required: false }) placeholder: string = ' ';
    @Input({ required: false }) disabled: boolean = false;
    @Input({ required: false }) helperText: string = '';
    @Input({ required: false }) allowOnlyNumbers: boolean = false;
    @Input({ required: false }) autoComplete: 'on' | 'off' = 'on';
    @Input({ required: false }) defaultValue?: string;
    
    @Input({ required: true }) controlName: string = '';
    @Input({ required: true }) errors!: Record<any, string>;
    @Input({ required: false }) inputEleClasses: string = '';
    formGroup!: FormGroup;
    currentError: string = '';
    @ViewChild('textInputEle') textInputEle!: ElementRef<HTMLInputElement>;
    @ViewChild('textInputEleWrapper') textInputEleWrapper!: ElementRef<HTMLDivElement>;
    
    
    
    constructor(private rootFormGroup: FormGroupDirective) {
        this.id = FormInputComponent.idCounter++;
        this.takeUntilDestroyed = takeUntilDestroyed();
    }
    
    
    ngOnInit() {
        this.formGroup = this.rootFormGroup.control;
        this.formGroup.get(this.controlName)?.valueChanges.pipe(this.takeUntilDestroyed).subscribe(() => {
            this.updateErrorEvent();
        })
    }
    
    
    ngAfterViewInit() {
    }
    
    
    updateErrorEvent() {
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
    }
    
}
