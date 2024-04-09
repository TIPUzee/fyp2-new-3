import { CommonModule, NgOptimizedImage } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { RatingStarsComponent } from '../../compo/rating-stars/rating-stars.component';
import { HtmlService } from '../../../services/html.service';
import { PatientProfileService } from '../../../services/patient-profile.service';
import { ModalComponent } from '../../../utils/components/modal/modal.component';
import { FormInputComponent } from "../../../utils/components/form-input/form-input.component";
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators as vl } from "@angular/forms";
import { FormValidatorsService } from "../../../services/form-validators.service";
import { FormDatePickerComponent } from "../../../utils/components/form-date-picker/form-date-picker.component";
import { FormSelectComponent } from "../../../utils/components/form-select/form-select.component";
import { FormSubmitButtonComponent } from "../../../utils/components/form-submit-button/form-submit-button.component";
import { HTTPService } from "../../../services/http.service";
import { PatientProfileUpdateResponse } from "../../../interfaces/api-response-interfaces";
import { toast } from "ngx-sonner";

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        CommonModule, RatingStarsComponent, ModalComponent, NgOptimizedImage, FormInputComponent,
        ReactiveFormsModule, FormDatePickerComponent, FormSelectComponent, FormSubmitButtonComponent
    ],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss',
})
export class ProfileComponent implements AfterViewInit {
    //
    // Modals
    @ViewChild('updateProfileModal') updateProfileModal!: ModalComponent;
    //
    // Custom Validator
    customValidators = {
        confirmPasswordRequireCondition: (control: AbstractControl) => {
            return control.parent?.get('password')?.value.length > 0;
        },
        
        oldPasswordRequireCondition: (control: AbstractControl) => {
            if (control.parent?.get('email')?.value !== this.profile.email) {
                return true;
            }
            
            if (control.parent?.get('whatsappNumber')?.value !== this.profile.whatsappNumber) {
                return true;
            }
            
            return !!control.parent?.get('password')?.value;
        }
    }
    //
    // Forms
    //
    // Profile Reload
    profileReloadForm = {
        waiting: false,
        submit: async () => {
            this.profileReloadForm.waiting = true;
            await this.profile.loadFromServer();
            this.profileReloadForm.waiting = false;
            toast.info('Profile reloaded');
        }
    }
    //
    // Profile Update
    profileUpdateForm = {
        fg: this._fb.group({
            name: [
                '', vl.compose([
                    vl.required, this._fvs.leadingSpaces(), this._fvs.name(), vl.minLength(3), vl.maxLength(32)
                ])
            ],
            dob: [
                '', vl.compose([
                    vl.required, this._fvs.date()
                ])
            ],
            whatsappNumber: [
                '', vl.compose([
                    vl.required,
                    vl.minLength(10),
                    vl.maxLength(15),
                ]),
                vl.composeAsync([
                    this._fvs.whatsappNumberMustNotExist(() => [this.profile.whatsappNumber])
                ]),
            ],
            email: [
                '', vl.compose([
                    vl.required,
                    this._fvs.email()
                ]),
                vl.composeAsync([
                    this._fvs.emailMustNotExist(() => [this.profile.email])
                ])
            ],
            password: [
                '', vl.compose([
                    vl.minLength(8),
                    vl.maxLength(32),
                    this._fvs.atLeastMustContainAlphaNumeric(),
                    this._fvs.atLeastOneLowercaseAndOneUppercase(),
                    this._fvs.noSpecialCharactersOtherThanDefinedForPassword()
                ])
            ],
            confirmPassword: [
                '', vl.compose([
                    this._fvs.customRequired({
                        requireCondition: this.customValidators.confirmPasswordRequireCondition.bind(this)
                    }),
                    this._fvs.matchWith('password')
                ])
            ],
            oldPassword: [
                '', vl.compose([
                    this._fvs.customRequired({
                        requireCondition: this.customValidators.oldPasswordRequireCondition.bind(this)
                    }),
                ])
            ],
        }),
        errors: {
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
            oldPassword: {
                required: 'Old Password is required',
            },
        },
        waiting: false,
        submit: async () => {
            if (!this.profileUpdateForm.ValidateAndNotify()) return;
            
            let data = this.profileUpdateForm.fg.value;
            
            this.profileUpdateForm.waiting = true;
            let res = await this.http.sendRequest({
                url: '/p/profile',
                method: 'PUT',
                jsonData: data,
            }) as PatientProfileUpdateResponse | false;
            this.profileUpdateForm.waiting = false;
            
            if (res === false) {
                return;
            }
            
            if (res.emailExists) {
                this.profileUpdateForm.fg.controls.email.setErrors({ emailMustNotExist: true });
                toast.error('Email has already taken');
                return;
            }
            
            if (res.whatsappNumberExists) {
                this.profileUpdateForm.fg.controls.whatsappNumber.setErrors({ whatsappNumberMustNotExist: true });
                toast.error('Whatsapp Number has already taken');
                return;
            }
            
            if (res.invalidOldPassword) {
                this.profileUpdateForm.fg.controls.oldPassword.setErrors({ invalidOldPassword: true });
                toast.error('Wrong old password', {
                    description: 'Please enter the correct old password to update your profile'
                });
                return;
            }
            
            if (!res.profileUpdated) {
                toast.error('Profile update failed', {
                    description: 'Please try again later',
                });
                return;
            }
            
            toast.success('Profile updated');
            this.updateProfileModal.close();
            await this.profile.loadFromServer();
        },
        ValidateAndNotify: () => {
            this.profileUpdateForm.fg.markAllAsTouched();
            if (this.profileUpdateForm.fg.invalid) {
                toast.error('Please fill all the required fields correctly');
                return false;
            }
            return true;
        },
        refreshValues: () => {
            this.profileUpdateForm.fg.setValue({
                name: this.profile.name,
                dob: this.profile.dob,
                whatsappNumber: this.profile.whatsappNumber,
                email: this.profile.email,
                password: '',
                confirmPassword: '',
                oldPassword: '',
            });
        },
        sensitiveFieldsChangeEvent: () => {
            // if email changes
            this.profileUpdateForm.fg.controls.email.statusChanges.subscribe(() => {
                this.profileUpdateForm.fg.controls.oldPassword.updateValueAndValidity();
                this.profileUpdateForm.fg.controls.oldPassword.markAsTouched();
            })
            // if whatsapp number changes
            this.profileUpdateForm.fg.controls.whatsappNumber.statusChanges.subscribe(() => {
                this.profileUpdateForm.fg.controls.oldPassword.updateValueAndValidity();
                this.profileUpdateForm.fg.controls.oldPassword.markAsTouched();
            })
            // if new password changes
            this.profileUpdateForm.fg.controls.password.statusChanges.subscribe(() => {
                this.profileUpdateForm.fg.controls.oldPassword.updateValueAndValidity();
                this.profileUpdateForm.fg.controls.oldPassword.markAsTouched();
            })
            // if confirm password changes
            this.profileUpdateForm.fg.controls.confirmPassword.statusChanges.subscribe(() => {
                this.profileUpdateForm.fg.controls.oldPassword.updateValueAndValidity();
                this.profileUpdateForm.fg.controls.oldPassword.markAsTouched();
                this.profileUpdateForm.fg.controls.password.updateValueAndValidity();
                this.profileUpdateForm.fg.controls.password.markAsTouched();
            })
        }
    }
    
    
    constructor(
        public commonService: CommonService,
        private html: HtmlService,
        public profile: PatientProfileService,
        private _fb: FormBuilder,
        private _fvs: FormValidatorsService,
        private http: HTTPService,
    ) {
        this.profileUpdateForm.refreshValues();
        this.profile.change$.subscribe(() => {
            this.profileUpdateForm.refreshValues();
        })
        this.profileUpdateForm.sensitiveFieldsChangeEvent();
        this.html.initTailwindElements();
    }
    
    
    ngAfterViewInit(): void {
    }
}
