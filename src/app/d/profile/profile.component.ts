import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HtmlService } from '../../services/html.service';
import { DoctorProfileService } from '../../services/doctor-profile.service';
import { FileDragNDropDirective } from '../../directives/file-drag-n-drop.directive';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCirclePlus, faCircleQuestion, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { RouterLink } from '@angular/router';
import {
    AbstractControl,
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    ValidatorFn,
    Validators as vl
} from '@angular/forms';
import { UtilFuncService } from "../../services/util-func.service";
import { FormInputComponent } from "../../components/form-input/form-input.component";
import { FormValidatorsService } from "../../services/form-validators.service";
import { FormDatePickerComponent } from "../../components/form-date-picker/form-date-picker.component";
import { HTTPService } from "../../services/http.service";
import { LanguageService } from "../../services/language.service";
import { FormSubmitButtonComponent } from "../../components/form-submit-button/form-submit-button.component";
import { FormTextareaComponent } from "../../components/form-textarea/form-textarea.component";
import { FormSelectComponent, FormSelectOption } from "../../components/form-select/form-select.component";
import { FormTimePickerComponent } from "../../components/form-time-picker/form-time-picker.component";
import { FormErrorBoxComponent } from "../../components/form-error-box/form-error-box.component";
import { ModalComponent } from "../../components/modal/modal.component";
import { LocalImageFileComponent } from "../../components/local-image-file/local-image-file.component";
import { FormFileInputComponent } from "../../components/form-file-input/form-file-input.component";
import { SpecializationCategoriesService } from "../../services/specialization-categories.service";
import { DoctorProfileUpdateResponse } from "../../interfaces/api-response-interfaces";
import { SonnerPreviewComponent } from "../../components/sonner-preview/sonner-preview.component";
import { toast } from 'ngx-sonner';
import { DoctorAccountStatus } from "../../interfaces/interfaces";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        CommonModule, FileDragNDropDirective, FontAwesomeModule, RouterLink,
        ReactiveFormsModule, FormInputComponent, FormDatePickerComponent, FormSubmitButtonComponent,
        FormTextareaComponent, FormSelectComponent, FormTimePickerComponent, FormErrorBoxComponent, ModalComponent,
        LocalImageFileComponent, FormFileInputComponent, SonnerPreviewComponent
    ],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss',
})
export class ProfileComponent implements AfterViewInit {
    //
    // Icons
    faXmark = faXmark;
    faCirclePlus = faCirclePlus;
    faTrash = faTrash;
    faCircleQuestion = faCircleQuestion;
    //
    // State variables
    specCatOptions!: FormSelectOption[];
    accountStatus: DoctorAccountStatus = 'NEW_ACCOUNT';
    takeUntilDestroyed: any;
    //
    // HTML Elements
    @ViewChild('dobInput') dobInput!: ElementRef<HTMLDivElement>;
    @ViewChild('languageSelectorInputHolder') languageSelectorInputHolder!: ElementRef<HTMLDivElement>;
    @ViewChild('profileUpdateFormEle') profileUpdateFormEle!: ElementRef<HTMLFormElement>;
    @ViewChild('coverPicImage') coverPicImage!: LocalImageFileComponent;
    @ViewChild('profilePicImage') profilePicImage!: LocalImageFileComponent;
    //
    // Popup Modals
    @ViewChild('accountApprovalRequestModal') accountApprovalRequestModal!: ModalComponent;
    @ViewChild('profileUpdateValidationFailedModal') profileUpdateValidationFailedModal!: ModalComponent;
    @ViewChild('oldPasswordRequirementModal') oldPasswordRequirementModal!: ModalComponent;
    //
    // Validators
    customValidator = {
        confirmPasswordRequireCondition: (control: AbstractControl) => {
            return control.parent?.get('password')?.value.length > 0;
        },
        
        oldPasswordRequireCondition: (control: AbstractControl) => {
            if (control.parent?.get('email')?.value !== this.profile.details.email) {
                return true;
            }
            
            return !!control.parent?.get('password')?.value;
        },
        
        toDateMustBeAfterFromDateValidator: (): ValidatorFn => {
            return (control: AbstractControl) => {
                if (control.parent?.get('dateFrom')?.value &&
                    control.parent?.get('dateTo')?.value) {
                    let from = new Date(control.parent?.get('dateFrom')?.value);
                    let to = new Date(control.parent?.get('dateTo')?.value);
                    if (from >= to) {
                        return { toDateMustBeAfterFromDate: true };
                    }
                }
                
                return null;
            }
        },
        
        toTimeLessThanFromTimeValidator: (): ValidatorFn => {
            return (control: AbstractControl) => {
                // "from" time: 08:00 AM and "to" time: 12:00 AM - Error
                // "from" time: 08:00 AM and "to" time: 08:00 AM - Error
                // "from" time: 08:00 AM and "to" time: 07:00 AM - Error
                // "from" time: 08:00 PM and "to" time: 12:59 AM - No Error
                // "from" time: 08:00 PM and "to" time: 00:00 AM - Error
                // "from" time: 08:00 AM and "to" time: 08:15 AM - No Error
                if (control.parent?.get('from')?.value && control.parent?.get('to')?.value) {
                    let from = this.utils.getTimeInMinutes(control.parent?.get('from')?.value);
                    let to = this.utils.getTimeInMinutes(control.parent?.get('to')?.value);
                    console.log(
                        'from',
                        control.parent?.get('from')?.value,
                        from,
                        'to',
                        control.parent?.get('to')?.value,
                        to
                    );
                    if (from >= to) {
                        return { toTimeLessThanFromTime: true };
                    }
                    
                    return null;
                }
                
                return null;
            }
        },
    }
    //
    // Forms
    //
    // Account Approval Request Form
    accountApprovalRequestForm = {
        fg: this._fb.group({
            pdfs: [
                new File([], ''), vl.compose([
                    vl.required, this._fvs.filesExtension(['pdf']),
                ])
            ]
        }),
        errors: {
            pdfs: {
                required: 'PDFs are required',
                filesExtension: 'Only PDF files are allowed',
            }
        },
        waiting: false,
        submit: async () => {
            this.accountApprovalRequestForm.fg.markAsTouched();
            
            let files = {
                pdfs: this.accountApprovalRequestForm.fg.controls.pdfs.value as File,
            }
            
            this.accountApprovalRequestForm.waiting = true;
            let _res = await this.http.sendMultipartRequest({
                url: '/d/account/request-approval',
                method: 'POST',
                jsonData: {},
                files: files
            })
            this.accountApprovalRequestForm.waiting = false;
            
            if (_res === false) {
                toast.error('Failed to submit approval request');
                toast.error('Please try again');
                return;
            }
            
            let res = this.utils.transformJsonSnakeCaseToCamelCaseDeep(_res) as {
                alreadyApproved: boolean,
                noFilesUploaded: boolean,
                approvalRequested: boolean,
            };
            
            if (res.alreadyApproved) {
                toast.error('Your account is already approved');
                await this.profile.load();
                
            } else if (res.noFilesUploaded) {
                toast.error('Please upload PDFs');
                
            } else if (res.approvalRequested) {
                toast.success('Approval request submitted');
                this.accountApprovalRequestModal.close();
                this.accountApprovalRequestForm.fg.reset();
                await this.profile.load();
            }
        }
    }
    //
    // Profile Update Form
    profileUpdateForm = {
        fg: this._fb.group({
            profilePic: [new File([], '')],
            coverPic: [new File([], '')],
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
                    this._fvs.phoneNumberFormat(),
                ]),
                vl.composeAsync([
                    this._fvs.whatsappNumberMustNotExist(() => [this.profile.details.whatsappNumber])
                ]),
            ],
            email: [
                '', vl.compose([
                    vl.required,
                    this._fvs.email()
                ]),
                vl.composeAsync([
                    this._fvs.emailMustNotExist(() => [this.profile.details.email])
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
                        requireCondition: this.customValidator.confirmPasswordRequireCondition.bind(this)
                    }),
                    this._fvs.matchWith('password')
                ])
            ],
            oldPassword: [
                '', vl.compose([
                    this._fvs.customRequired({
                        requireCondition: this.customValidator.oldPasswordRequireCondition.bind(this)
                    }),
                ])
            ],
            specializationCategoryId: [0, vl.compose([vl.required, vl.min(1)])],
            maxMeetingDuration: [0, vl.compose([vl.required, vl.min(15), vl.max(120)])],
            appointmentCharges: [0, vl.compose([vl.required, vl.min(500), vl.max(20000)])],
            specialization: ['', vl.compose([vl.required, this._fvs.leadingSpaces(), vl.maxLength(44)])],
            availabilityDurations: this._fb.array([
                this._fb.group({
                    from: [
                        '08:00 AM', vl.compose([vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes()])
                    ],
                    to: [
                        '05:00 PM', vl.compose([
                            vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes(),
                            this.customValidator.toTimeLessThanFromTimeValidator()
                        ])
                    ],
                    enabled: [false],
                }),
                this._fb.group({
                    from: [
                        '08:00 AM', vl.compose([vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes()])
                    ],
                    to: [
                        '05:00 PM', vl.compose([
                            vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes(),
                            this.customValidator.toTimeLessThanFromTimeValidator()
                        ])
                    ],
                    enabled: [false],
                }),
                this._fb.group({
                    from: [
                        '08:00 AM', vl.compose([vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes()])
                    ],
                    to: [
                        '05:00 PM', vl.compose([
                            vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes(),
                            this.customValidator.toTimeLessThanFromTimeValidator()
                        ])
                    ],
                    enabled: [false],
                }),
                this._fb.group({
                    from: [
                        '08:00 AM', vl.compose([vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes()])
                    ],
                    to: [
                        '05:00 PM', vl.compose([
                            vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes(),
                            this.customValidator.toTimeLessThanFromTimeValidator()
                        ])
                    ],
                    enabled: [false],
                }),
                this._fb.group({
                    from: [
                        '08:00 AM', vl.compose([vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes()])
                    ],
                    to: [
                        '05:00 PM', vl.compose([
                            vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes(),
                            this.customValidator.toTimeLessThanFromTimeValidator()
                        ])
                    ],
                    enabled: [false],
                }),
                this._fb.group({
                    from: [
                        '08:00 AM', vl.compose([vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes()])
                    ],
                    to: [
                        '05:00 PM', vl.compose([
                            vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes(),
                            this.customValidator.toTimeLessThanFromTimeValidator()
                        ])
                    ],
                    enabled: [false],
                }),
                this._fb.group({
                    from: [
                        '08:00 AM', vl.compose([vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes()])
                    ],
                    to: [
                        '05:00 PM', vl.compose([
                            vl.required, this._fvs.time(), this._fvs.timeMultipleOf15Minutes(),
                            this.customValidator.toTimeLessThanFromTimeValidator()
                        ])
                    ],
                    enabled: [false],
                }),
            ]),
            languages: this._fb.array(
                [],
                vl.compose([
                    vl.required,
                ])
            ) as FormArray<FormControl<number>>,
            experiences: this._fb.array([
                this.createNewExperienceFormGroup('', '', '', ''),
            ]) as FormArray<FormGroup<{
                title: FormControl<string | null>,
                description: FormControl<string | null>,
                dateFrom: FormControl<string | null>,
                dateTo: FormControl<string | null>
            }>>,
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
                dateMustBeBefore: 'You must be at least 18 years old to be a verified doctor-details.',
            },
            whatsappNumber: {
                required: 'Whatsapp Number is required',
                minlength: 'Whatsapp Number must be at least 10 characters long',
                maxlength: 'Whatsapp Number must be at most 15 characters long',
                phoneNumberFormat: 'Invalid phone number format, e.g., +923001234567',
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
                required: 'Old Password is required to change confidential information',
            },
            specializationCategoryId: {
                required: 'Specialization category is required',
                min: 'Specialization category is required',
            },
            maxMeetingDuration: {
                required: 'Max Meeting Duration is required',
                min: 'Max Meeting Duration must be at least 15 minutes',
                max: 'Max Meeting Duration must be at most 120 minutes',
            },
            appointmentCharges: {
                required: 'Appointment Charges is required',
                min: 'Appointment Charges must be at least 500',
                max: 'Appointment Charges must be at most 20000',
            },
            specialization: {
                required: 'Specialization is required',
                leadingSpaces: 'Specialization cannot start or end with spaces',
                maxlength: 'Specialization must be at most 44 characters long',
            },
            availabilityDurations: {
                from: {
                    required: 'Starting time is required',
                    time: 'Please pick a time from the time picker',
                    timeMultipleOf15Minutes: 'Please pick a time multiple of 15 minutes. e.g., 08:00 AM, 08:15 AM, 08:30 AM, ...'
                },
                to: {
                    required: 'Starting time is required',
                    time: 'Please pick a time from the time picker',
                    timeMultipleOf15Minutes: 'Please pick a time multiple of 15 minutes. e.g., 08:00 AM, 08:15 AM,' +
                        ' 08:30 AM, ...',
                    toTimeLessThanFromTime: 'End time must be greater than start time',
                },
            },
            languages: {
                required: 'At least one language is required',
            },
            experiences: {
                title: {
                    required: 'Title is required',
                    leadingSpaces: 'Title cannot start or end with spaces',
                    maxlength: 'Title must be at most 64 characters long',
                },
                description: {
                    required: 'Description is required',
                    leadingSpaces: 'Description cannot start or end with spaces',
                    maxlength: 'Description must be at most 512 characters long',
                },
                dateFrom: {
                    required: 'Date From is required',
                    date: 'Invalid date format. Please use the date picker to select a date.',
                },
                dateTo: {
                    date: 'Invalid date format. Please use the date picker to select a date.',
                    toDateMustBeAfterFromDate: 'End date must be after start date',
                },
            },
        },
        waiting: false,
        submit: async () => {
            // mark as touched, loop through all experiences and mark them as touched
            this.profileUpdateForm.fg.controls.experiences.controls.forEach((exp) => {
                this.utils.markAllFormControlsAsTouched(exp);
            });
            
            // mark as touched, loop through all availabilityDurations and mark them as touched
            this.profileUpdateForm.fg.controls.availabilityDurations.controls.forEach((ad) => {
                this.utils.markAllFormControlsAsTouched(ad);
            });
            
            // update validity of every 'to' time in availabilityDurations
            this.profileUpdateForm.fg.controls.availabilityDurations.controls.forEach((ad) => {
                ad.controls.to.updateValueAndValidity();
            });
            
            // update validity of confirmPassword
            this.profileUpdateForm.fg.controls.confirmPassword.updateValueAndValidity();
            
            if (this.profileUpdateForm.fg.invalid) {
                this.profileUpdateValidationFailedModal.open();
                this.utils.markAllFormControlsAsTouched(this.profileUpdateForm.fg);
                return;
            }
            
            // check if old password is required
            if (
                this.profileUpdateForm.fg.controls.password.value?.length !== 0
                && this.profileUpdateForm.fg.controls.oldPassword.value?.length === 0
            ) {
                this.oldPasswordRequirementModal.open();
                return;
            }
            
            // data type conversion
            this.profileUpdateForm.fg.controls.maxMeetingDuration.setValue(Number(this.profileUpdateForm.fg.controls.maxMeetingDuration.value));
            this.profileUpdateForm.fg.controls.appointmentCharges.setValue(Number(this.profileUpdateForm.fg.controls.appointmentCharges.value));
            this.profileUpdateForm.fg.controls.specializationCategoryId.setValue(Number(this.profileUpdateForm.fg.controls.specializationCategoryId.value));
            
            let data = this.profileUpdateForm.fg.value;
            // @ts-ignore
            data.availabilityDurations = data.availabilityDurations.map((ad: any) => {
                return {
                    from: this.utils.getTimeInMinutes(ad.from),
                    to: this.utils.getTimeInMinutes(ad.to),
                    enabled: ad.enabled,
                }
            });
            
            let files = {
                profilePic: this.profileUpdateForm.fg.controls.profilePic.value as File,
                coverPic: this.profileUpdateForm.fg.controls.coverPic.value as File,
            }
            
            this.profileUpdateForm.waiting = true;
            let res = await this.http.sendMultipartRequest({
                url: '/d/profile',
                method: 'PUT',
                jsonData: data,
                files: files,
            }) as DoctorProfileUpdateResponse | false;
            this.profileUpdateForm.waiting = false;
            
            if (!res) {
                return;
            }
            
            if (res.emailAlreadyExists) {
                toast.error('Email already exists');
            } else if (res.whatsappNumberAlreadyExists) {
                toast.error('Whatsapp number already exists');
            } else if (res.invalidOldPassword) {
                toast.error('Please enter the correct old password');
            } else if (res.invalidSpecializationCategoryId) {
                toast.error('Please your specialization category again');
                await this.specCategories.load();
            } else if (res.invalidLanguages) {
                toast.error('Please select your languages again');
            } else if (res.profileUpdated) {
                toast.success('Profile updated');
                await this.profile.load();
            } else {
                toast.error('Failed to update profile, please try again');
            }
        },
        refreshValues: () => {
            this.profileUpdateForm.fg.patchValue({
                profilePic: new File([], ''),
                coverPic: new File([], ''),
                name: this.profile.details.name,
                dob: this.utils.convertGMTDate(this.profile.details.dob),
                whatsappNumber: this.profile.details.whatsappNumber,
                email: this.profile.details.email,
                password: '',
                confirmPassword: '',
                oldPassword: '',
                specializationCategoryId: this.profile.details.specializationCategoryId,
                maxMeetingDuration: this.profile.details.maxMeetingDuration,
                appointmentCharges: this.profile.details.appointmentCharges,
                specialization: this.profile.details.specialization,
                availabilityDurations: [
                    {
                        from: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[0]?.from }),
                        to: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[0]?.to }),
                        enabled: this.profile.details.availabilityDurations[0]?.enabled,
                    },
                    {
                        from: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[1]?.from }),
                        to: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[1]?.to }),
                        enabled: this.profile.details.availabilityDurations[1]?.enabled,
                    },
                    {
                        from: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[2]?.from }),
                        to: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[2]?.to }),
                        enabled: this.profile.details.availabilityDurations[2]?.enabled,
                    },
                    {
                        from: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[3]?.from }),
                        to: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[3]?.to }),
                        enabled: this.profile.details.availabilityDurations[3]?.enabled,
                    },
                    {
                        from: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[4]?.from }),
                        to: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[4]?.to }),
                        enabled: this.profile.details.availabilityDurations[4]?.enabled,
                    },
                    {
                        from: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[5]?.from }),
                        to: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[5]?.to }),
                        enabled: this.profile.details.availabilityDurations[5]?.enabled,
                    },
                    {
                        from: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[6]?.from }),
                        to: this.utils.getTime({ minutes: this.profile.details.availabilityDurations[6]?.to }),
                        enabled: this.profile.details.availabilityDurations[6]?.enabled,
                    },
                ],
            });
            this.profileUpdateForm.fg.controls.name.setValue(this.profile.details.name);
            this.profileUpdateForm.fg.controls.languages.clear();
            this.profile.details.languages.forEach((lang) => {
                this.profileUpdateForm.fg.controls.languages.push(this._fb.control(lang.languageId) as FormControl<number>);
            });
            
            this.profileUpdateForm.fg.controls.experiences.clear();
            this.profile.details.experiences.forEach((exp) => {
                this.profileUpdateForm.fg.controls.experiences.push(
                    this.createNewExperienceFormGroup(
                        exp.title,
                        exp.description,
                        this.utils.convertGMTDate(exp.dateFrom),
                        this.utils.convertGMTDate(exp.dateTo)
                    )
                );
            });
            
            this.accountStatus = this.profile.details.status;
            this.initProfileExperiencesDateChangeEvent();
            this.initSpecializationCategoryOptions();
        },
    }
    //
    // Profile Refresh Form
    profileRefreshForm = {
        waiting: false,
        submit: async () => {
            this.profileRefreshForm.waiting = true;
            let res = await this.profile.load();
            this.profileRefreshForm.waiting = false;
            if (!res) {
                toast.error('Failed to fetch profile');
            } else {
                toast.info('Profile reloaded');
            }
        }
    }
    //
    // Utils Functions
    changePic = {
        coverPicByDragNDrop: (files: File[]) => {
            if (files.length === 0) {
                return;
            }
            let allowedFileTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
            if (!allowedFileTypes.includes(files[0].type)) {
                toast.error('Only PNG, JPG, JPEG and GIF files are allowed');
                return;
            }
            this.profileUpdateForm.fg.controls.coverPic.setValue(files[0]);
        },
        
        coverPicByClick: (event: Event) => {
            let target: HTMLInputElement = event.target as HTMLInputElement;
            if (target.files?.length) {
                let allowedFileTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
                if (!allowedFileTypes.includes(target.files?.[0].type)) {
                    toast.error('Only PNG, JPG, JPEG and GIF files are allowed');
                    return;
                }
                this.profileUpdateForm.fg.controls.coverPic.setValue(target.files?.[0]);
            }
        },
        
        profilePicByDragNDrop: (files: File[]) => {
            if (files.length === 0) {
                return;
            }
            let allowedFileTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
            if (!allowedFileTypes.includes(files[0].type)) {
                toast.error('Only PNG, JPG, JPEG and GIF files are allowed');
                return;
            }
            this.profileUpdateForm.fg.controls.profilePic.setValue(files[0]);
        },
        
        profilePicByClick: (event: Event) => {
            let target: HTMLInputElement = event.target as HTMLInputElement;
            if (target.files?.length) {
                let allowedFileTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
                if (!allowedFileTypes.includes(target.files?.[0].type)) {
                    toast.error('Only PNG, JPG, JPEG and GIF files are allowed');
                    return;
                }
                this.profileUpdateForm.fg.controls.profilePic.setValue(target.files?.[0]);
            }
        }
    }
    
    
    constructor(
        protected languages: LanguageService,
        private html: HtmlService,
        public profile: DoctorProfileService,
        private _fb: FormBuilder,
        private _fvs: FormValidatorsService,
        protected utils: UtilFuncService,
        protected http: HTTPService,
        protected specCategories: SpecializationCategoriesService,
    ) {
        this.takeUntilDestroyed = takeUntilDestroyed();
        
        this.clearAllExperiences();
        
        this.profileUpdateForm.refreshValues();
        this.profile.change$.pipe(takeUntilDestroyed()).subscribe(async () => {
            this.profileUpdateForm.refreshValues();
            this.html.initTailwindElements();
        })
        
        this.initSpecializationCategoryOptions();
        this.specCategories.change$.pipe(this.takeUntilDestroyed).subscribe(() => {
            this.initSpecializationCategoryOptions();
        })
        
        if (this.profile.details.id === -1) {
            this.removeExperienceFromProfile(0);
        }
        
        this.initProfileAvailabilityDurationsDateChangeEvent();
        
        this.initDynamicImageFileComponents();
        
        this.html.initTailwindElements();
    }
    
    
    ngAfterViewInit(): void {
        this.profile.load();
        this.loadDynamicImagesFromServer();
    }
    
    
    addNewExperience() {
        this.profileUpdateForm.fg.controls.experiences.push(
            this.createNewExperienceFormGroup('', '', '', '')
        )
        this.html.initTailwindElements();
    }
    
    
    addNewLanguage(event: Event) {
        event.preventDefault();
        const target = event.target as HTMLSelectElement;
        const value = Number(target.value)
        if (value === -1 || value === null) {
            return;
        }
        let newLanguage = this._fb.control(value) as FormControl<number>;
        this.profileUpdateForm.fg.controls.languages.push(newLanguage);
        target.value = '-1';
    }
    
    
    clearAllExperiences() {
        this.profileUpdateForm.fg.controls.experiences.clear();
    }
    
    
    createNewExperienceFormGroup(title: string, description: string, dateFrom: string, dateTo: string)
        : FormGroup<{
        title: FormControl<string | null>,
        description: FormControl<string | null>,
        dateFrom: FormControl<string | null>,
        dateTo: FormControl<string | null>
    }> {
        return this._fb.group({
            title: [title, vl.compose([vl.required, this._fvs.leadingSpaces(), vl.maxLength(64)])],
            description: [description, vl.compose([vl.required, this._fvs.leadingSpaces(), vl.maxLength(512)])],
            dateFrom: [dateFrom, vl.compose([vl.required, this._fvs.date()])],
            dateTo: [
                dateTo, vl.compose([this._fvs.date(), this.customValidator.toDateMustBeAfterFromDateValidator()])
            ],
        });
    }
    
    
    initDynamicImageFileComponents() {
        this.profileUpdateForm.fg.controls.coverPic.valueChanges.pipe(this.takeUntilDestroyed).subscribe(() => {
            if (this.profileUpdateForm.fg.controls.coverPic.value) {
                this.coverPicImage?.loadLocalImageFile(this.profileUpdateForm.fg.controls.coverPic.value);
            } else {
                this.coverPicImage?.loadURLImageFile(this.utils.makeOwnServerUrl('/api/file/' +
                    this.profile.details.coverPicFilename));
            }
        })
        this.profileUpdateForm.fg.controls.profilePic.valueChanges.pipe(this.takeUntilDestroyed)
            .pipe(this.takeUntilDestroyed)
            .subscribe(() => {
                if (this.profileUpdateForm.fg.controls.profilePic.value) {
                    this.profilePicImage?.loadLocalImageFile(this.profileUpdateForm.fg.controls.profilePic.value);
                } else {
                    this.profilePicImage?.loadURLImageFile(this.utils.makeOwnServerUrl('/api/file/' +
                        this.profile.details.profilePicFilename));
                }
            })
    }
    
    
    initProfileAvailabilityDurationsDateChangeEvent() {
        this.profileUpdateForm.fg.controls.availabilityDurations.controls.forEach((ad: any) => {
            ad.controls.from.valueChanges.pipe(this.takeUntilDestroyed).subscribe(() => {
                ad.controls.to.updateValueAndValidity();
                if (ad.controls.to.untouched) {
                    ad.controls.to.markAsTouched();
                }
            });
        })
    }
    
    
    initProfileExperiencesDateChangeEvent() {
        for (let i = 0; i < this.profileUpdateForm.fg.controls.experiences.controls.length; i++) {
            let exp = this.profileUpdateForm.fg.controls.experiences.controls[i];
            exp.controls.dateFrom.valueChanges.pipe(this.takeUntilDestroyed).subscribe(() => {
                exp.controls.dateTo.updateValueAndValidity();
                if (exp.controls.dateTo.untouched) {
                    exp.controls.dateTo.markAsTouched();
                }
            });
        }
    }
    
    
    initSpecializationCategoryOptions() {
        let options = this.specCategories.list.map((cat) => {
            return {
                value: cat.id.toString(),
                label: cat.title,
            }
        });
        this.specCatOptions = [];
        if (
            this.profileUpdateForm.fg.controls.specializationCategoryId.value === -1 ||
            this.profileUpdateForm.fg.controls.specializationCategoryId.value === 0
        ) {
            this.specCatOptions.push({ value: '-1', label: 'Select Specialization', isDisabled: false });
        }
        this.specCatOptions.push(...options);
    }
    
    
    loadDynamicImagesFromServer() {
        let _ = () => {
            this.coverPicImage.loadURLImageFile(this.utils.makeOwnServerUrl('/api/file/' +
                this.profile.details.coverPicFilename));
            this.profilePicImage.loadURLImageFile(this.utils.makeOwnServerUrl('/api/file/' +
                this.profile.details.profilePicFilename));
        }
        _();
        this.profile.change$.pipe(this.takeUntilDestroyed).subscribe(() => {
            _();
        })
    }
    
    
    async reloadProfile() {
        let res = await this.profile.load();
        if (!res) {
            toast.error('Failed to fetch profile');
        } else {
            toast.info('Profile reloaded');
        }
    }
    
    
    removeExperienceFromProfile(index: number) {
        this.profileUpdateForm.fg.controls.experiences.removeAt(index);
    }
    
    
    removeLanguageFromProfile(index: number) {
        this.profileUpdateForm.fg.controls.languages.removeAt(index);
    }
    
    
    showProfileAvailabilityStatusConditionally() {
        if (this.profileUpdateForm.fg.controls.availabilityDurations.value.every((ad: any) => !ad.enabled)) {
            toast.warning('You have not set your availability.');
            toast.warning('Your profile will not be visible to patients.');
        }
    }
}
