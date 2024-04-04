import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HtmlService } from '../../services/html.service';
import { Router, RouterLink } from '@angular/router';
import { UtilFuncService } from "../../services/util-func.service";
import { NgOptimizedImage } from "@angular/common";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators as vl } from '@angular/forms';
import { FormInputComponent } from "../../utils/components/form-input/form-input.component";
import { FormSelectComponent } from "../../utils/components/form-select/form-select.component";
import { FormValidatorsService } from "../../services/form-validators.service";
import { FormDatePickerComponent } from "../../utils/components/form-date-picker/form-date-picker.component";
import { FormSubmitButtonComponent } from "../../utils/components/form-submit-button/form-submit-button.component";
import { HTTPService } from '../../services/http.service';
import { AuthRegisS1Response } from "../../interfaces/api-response-interfaces";
import { toast } from "ngx-sonner";

@Component({
    selector: 'app-regis',
    standalone: true,
    imports: [
        RouterLink, NgOptimizedImage, ReactiveFormsModule, FormInputComponent, FormSelectComponent,
        FormDatePickerComponent, FormSubmitButtonComponent, FormsModule
    ],
    templateUrl: './regis.component.html',
    styleUrl: './regis.component.scss',
})
export class RegisComponent implements AfterViewInit {
    @ViewChild('dobInput') dobInput!: ElementRef<HTMLDivElement>;
    
    userTypeOptions: { value: string, label: string, isDisabled?: boolean }[] = [
        { value: '-', label: 'Select User Type', isDisabled: true },
        { value: 'p', label: 'Patient' },
        { value: 'd', label: 'Doctor' },
    ];
    
    regisForm = {
        fg: this._fb.group({
            userType: ['', this._fvs.customRequired({ ignoreValues: () => ['-'] })],
            name: [
                '', vl.compose([
                    vl.required, this._fvs.leadingSpaces(), this._fvs.name(), vl.minLength(3), vl.maxLength(32)
                ])
            ],
            dob: [
                '', vl.compose([
                    vl.required, this._fvs.date(), this._fvs.dateMustBeBefore({ years: 18 })
                ])
            ],
            whatsappNumber: [
                '', vl.compose([
                    vl.required,
                    vl.minLength(10),
                    vl.maxLength(15),
                ]),
                vl.composeAsync([
                    this._fvs.whatsappNumberMustNotExist()
                ]),
            ],
            email: [
                '', vl.compose([
                    vl.required,
                    this._fvs.email()
                ]),
                vl.composeAsync([
                    this._fvs.emailMustNotExist()
                ])
            ],
            password: [
                '', vl.compose([
                    vl.required,
                    vl.minLength(8),
                    vl.maxLength(32),
                    this._fvs.atLeastMustContainAlphaNumeric(),
                    this._fvs.atLeastOneLowercaseAndOneUppercase(),
                    this._fvs.noSpecialCharactersOtherThanDefinedForPassword()
                ])
            ],
            confirmPassword: [
                '', vl.compose([
                    vl.required,
                    this._fvs.matchWith('password')
                ])
            ],
            agreement: [false, vl.requiredTrue],
        }),
        errors: {
            userType: {
                required: 'User Type is required',
            },
            name: {
                required: 'Name is required',
                leadingSpaces: 'Name cannot start or end with spaces',
                name: 'Name must contain only alphabets and spaces',
                minlength: 'Name must be at least 3 characters long',
                maxlength: 'Name must be at most 32 characters long',
            },
            dob: {
                required: 'Date of Birth is required',
                date: 'Invalid date format. Please use the date picker to select a date.',
                dateMustBeBefore: 'You must be at least 18 years old to register',
            },
            whatsappNumber: {
                required: 'Whatsapp Number is required',
                minlength: 'Whatsapp Number must be at least 10 characters long',
                maxlength: 'Whatsapp Number must be at most 15 characters long',
                whatsappNumberMustNotExist: 'Whatsapp Number has already taken',
            },
            email: {
                required: 'Email is required',
                email: 'Invalid email format',
                emailMustNotExist: 'Email has already taken',
                tryAgain: 'Something went wrong. Please try again later.',
            },
            password: {
                required: 'Password is required',
                minlength: 'Password must be at least 8 characters long',
                maxlength: 'Password must be at most 32 characters long',
                atLeastMustContainAlphaNumeric: 'Password must contain at least 1 alphabet and 1 number',
                atLeastOneLowercaseAndOneUppercase: 'Password must contain at least 1 lowercase and 1 uppercase alphabet',
                noSpecialCharactersOtherThanDefinedForPassword: 'Password must not contain any special characters other than !, @, $, %, &, *, _ and _',
            },
            confirmPassword: {
                required: 'Confirm Password is required',
                matchWithPassword: 'Passwords do not match',
            },
        },
        waiting: false,
        agreementChecked: false,
        submit: async () => {
            this.utils.markAllFormControlsAsTouched(this.regisForm.fg);
            if (this.regisForm.fg.invalid) {
                toast.error('Please fill in the form correctly');
                return;
            }
            let formData: Record<string, any> = this.regisForm.fg.value;
            
            this.regisForm.waiting = true;
            let res = await this.http.sendRequest({
                url: '/auth/regis/s1',
                jsonData: formData,
                method: 'POST'
            }) as AuthRegisS1Response | false;
            this.regisForm.waiting = false;
            
            if (res === false) {
                toast.error('Something went wrong. Please try again later.');
                console.error('Error occurred while sending request to /auth/regis/s1', formData, res);
                return;
            }
            
            if (res.emailAlreadyExists) {
                this.regisForm.fg.controls.email.setErrors({ emailMustNotExist: true });
                toast.error('Email has already taken');
                return;
            }
            
            if (res.whatsappNumberAlreadyExists) {
                this.regisForm.fg.controls.whatsappNumber.setErrors({ whatsappNumberMustNotExist: true });
                toast.error('Whatsapp Number has already taken');
                return;
            }
            
            if (!res.registrationCompleted) {
                toast.error('Something went wrong. Please try again later.');
                console.error('Registration is not completed', formData, res);
                return;
            }
            
            this.utils.setAuthorizationToken(res.token);
            this.utils.setCurrentUser(res.userType);
            
            await this.router.navigate(['regis', 'mail']);
        }
    }
    
    
    constructor(
        private htmlService: HtmlService,
        private utils: UtilFuncService,
        private _fb: FormBuilder,
        private _fvs: FormValidatorsService,
        private router: Router,
        private http: HTTPService,
    ) {
        // initTE({ Input, Ripple });
    }
    
    
    ngAfterViewInit(): void {
        this.htmlService.scrollToTop();
        this.htmlService.initTailwindElements();
    }
    
}
