import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HtmlService } from "../../services/html.service";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { expandCollapseAnimation } from "../../services/animations";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@Component({
    selector: 'form-file-input',
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NgClass,
        NgIf,
        NgForOf,
        FontAwesomeModule,
    ],
    templateUrl: './form-file-input.component.html',
    styleUrl: './form-file-input.component.scss',
    animations: [expandCollapseAnimation],
})
export class FormFileInputComponent implements AfterViewInit, OnInit {
    static idCounter: number = 0;
    protected id: number;
    @Input({ required: true }) label: string = '';
    @Input({ required: false }) placeholder: string = ' ';
    @Input({ required: false }) disabled: boolean = false;
    @Input({ required: false }) helperText: string = '';
    @Input({ required: false }) multiple: boolean = false;
    @Input({ required: false }) accept: string = '*/*';
    
    @Input({ required: true }) controlName: string = '';
    @Input({ required: true }) errors!: Record<any, string>;
    
    formGroup!: FormGroup;
    currentError: string = '';
    
    @ViewChild('fileInputEle') fileInputEle!: ElementRef;
    
    
    constructor(private rootFormGroup: FormGroupDirective, protected htmlService: HtmlService) {
        this.id = FormFileInputComponent.idCounter++;
    }
    
    
    ngOnInit() {
        this.formGroup = this.rootFormGroup.control;
    }
    
    
    ngAfterViewInit() {
    }
    
    
    onFileSelect(event: Event): void {
        this.formGroup.get(this.controlName)?.markAsTouched();
        let files = (
            event.target as HTMLInputElement
        ).files;
        if (!files || files.length === 0) {
            if (this.multiple) {
                this.formGroup.get(this.controlName)?.setValue([]);
            } else {
                this.formGroup.get(this.controlName)?.setValue(new File([], ''));
            }
            return;
        }
        if (this.multiple) {
            this.formGroup.get(this.controlName)?.setValue(files);
        } else {
            this.formGroup.get(this.controlName)?.setValue(files?.[0]);
        }
    }
    
    
    toShowError(): boolean {
        if (this.formGroup.get(this.controlName)?.touched) {
            return !!(
                this.formGroup.get(this.controlName)?.invalid
            );
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
