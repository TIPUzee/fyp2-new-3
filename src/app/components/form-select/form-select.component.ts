import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { MonoTypeOperatorFunction } from "rxjs";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

export interface FormSelectOption {
    value: string,
    label: string,
    isDisabled?: boolean,
    isSelected?: boolean,
    isHidden?: boolean
}

@Component({
    selector: 'form-select',
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NgForOf,
        NgIf,
        NgClass,
        FontAwesomeModule,
    ],
    templateUrl: './form-select.component.html',
    styleUrl: './form-select.component.scss'
})
export class FormSelectComponent implements AfterViewInit, OnInit, OnDestroy {
    //
    // icons
    faChevronDown = faChevronDown;
    faChevronUp = faChevronUp;
    //
    // state variables
    opened: boolean = false;
    takeUntilDestroyed: MonoTypeOperatorFunction<this>;
    
    @Input({ required: true })
    label: string = '';
    
    @Input({ required: false })
    placeholder: string = ' ';
    
    @Input({ required: false })
    disabled: boolean = false;
    
    @Input({ required: true })
    options: FormSelectOption[] = [];
    
    @Input({ required: true }) controlName: string = '';
    @Input({ required: true }) errors!: Record<any, string>;
    
    formGroup!: FormGroup;
    
    @ViewChild('inputEle') inputEle!: ElementRef<HTMLSelectElement>;
    @ViewChild('selectEleWrapper') selectEleWrapper!: ElementRef<HTMLDivElement>;
    @ViewChild('labelElement') labelElement!: ElementRef<HTMLLabelElement>;
    labelWidthChangeTimeout: any;
    control: AbstractControl | null = null;
    
    currentError: string = '';
    currentValue: string = '';
    
    
    constructor(private rootFormGroup: FormGroupDirective) {
        this.takeUntilDestroyed = takeUntilDestroyed();
        this.changeMiddleNotchWidth();
    }
    
    
    ngOnInit() {
        this.formGroup = this.rootFormGroup.control;
    }
    
    
    ngAfterViewInit() {
        this.control = this.formGroup.get(this.controlName);
        this.control?.valueChanges.subscribe(() => {
            this.updateError();
        })
        this.initTwSelect();
    }
    
    
    public ngOnDestroy(): void {
        if (this.labelWidthChangeTimeout) {
            clearTimeout(this.labelWidthChangeTimeout);
        }
    }
    
    
    changeMiddleNotchWidth(): void {
        let _ = () => {
            const middleNotch = (
                this.selectEleWrapper?.nativeElement?.querySelector('[data-te-input-notch-ref]' +
                    ' [data-te-input-notch-middle-ref]') as HTMLDivElement
            );
            if (middleNotch) {
                middleNotch.style.width = (
                    this.labelElement.nativeElement.clientWidth + 1
                ) + 'px';
            }
        }
        
        if (this.labelWidthChangeTimeout) {
            clearTimeout(this.labelWidthChangeTimeout);
            _();
        }
        
        this.labelWidthChangeTimeout = setTimeout(() => {
            _();
        }, 3000);
    }
    
    
    close() {
        setTimeout(() => {
            this.opened = false;
        }, 100);
        this.control?.markAsTouched();
    }
    
    
    initTwSelect(): void {
        this.inputEle.nativeElement?.addEventListener('close.te.select', (e) => {
            this.control?.markAsTouched();
        })
    }
    
    
    toggle() {
        this.opened = !this.opened;
        if (!this.opened) {
            this.control?.markAsTouched();
        }
    }
    
    
    updateError(): false {
        if (this.control?.value) {
            if (this.inputEle) {
                this.inputEle.nativeElement.value = this.options?.find((option) => option.value ===
                    this.control?.value)?.value || '';
                this.currentValue = this.control?.value;
            }
            this.selectEleWrapper?.nativeElement?.querySelector('[data-te-input-notch-ref]')?.setAttribute(
                'data-te-input-state-active',
                'true'
            );
            this.selectEleWrapper?.nativeElement?.querySelector('input')?.setAttribute(
                'data-te-input-state-active',
                'true'
            );
            const input = this.selectEleWrapper?.nativeElement?.querySelector('input') as HTMLInputElement;
            if (input) {
                input.value = this.options?.find((option) => option.value === this.control?.value)?.label || '';
            }
            
            this.changeMiddleNotchWidth();
        }
        
        this.currentError = '';
        if (this.control?.touched) {
            for (let [errorName, errorDesc] of Object.entries(this.errors)) {
                if (this.control?.hasError(errorName)) {
                    this.currentError = errorDesc;
                    return false;
                }
            }
        }
        return false;
    }
    
    
    updateValue(value: string): void {
        this.control?.setValue(value);
    }
}
