import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HtmlService } from '../../services/html.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCloudArrowUp, faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { HTTPService } from "../../services/http.service";
import { AdminUpdatePatientResponse, GetAllPatientsResponse } from "../../interfaces/api-response-interfaces";
import { Subject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { UtilFuncService } from "../../services/util-func.service";
import { PatientAccountStatus } from "../../interfaces/interfaces";
import { ModalComponent } from "../../utils/components/modal/modal.component";
import { FormInputComponent } from "../../utils/components/form-input/form-input.component";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators as vl } from "@angular/forms";
import { FormValidatorsService } from "../../services/form-validators.service";
import { FormSelectComponent } from "../../utils/components/form-select/form-select.component";
import { FormSubmitButtonComponent } from "../../utils/components/form-submit-button/form-submit-button.component";
import { toast } from "ngx-sonner";
import {
    FormRefreshButtonComponent
} from "../../utils/components/form-refresh-button/form-refresh-button.component";
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-patients',
    standalone: true,
    imports: [
        FontAwesomeModule, CommonModule, ModalComponent, FormInputComponent,
        ReactiveFormsModule, FormSelectComponent, FormSubmitButtonComponent, FormRefreshButtonComponent, FormsModule,
        RouterLink
    ],
    templateUrl: './patients.component.html',
    styleUrl: './patients.component.scss',
})
export class PatientsComponent implements AfterViewInit {
    //
    // Static variables
    static allObjs: GetAllPatientsResponse['patients'] = [];
    static loading = false;
    static searched = {
        changeSearch$: new Subject<void>(),
        list: [] as string[],
        query: '',
        selectKey: (key: string) => {
            if (PatientsComponent.searched.list.includes(key)) {
                PatientsComponent.searched.list = PatientsComponent.searched.list.filter(k => k !== key);
            } else {
                PatientsComponent.searched.list.push(key);
            }
            PatientsComponent.searched.changeSearch$.next();
        },
        search: (q: string) => {
            PatientsComponent.searched.query = q;
            PatientsComponent.searched.changeSearch$.next();
        },
    };
    //
    // State Variables
    change$ = new Subject<void>();
    dataTableInstance: any = null;
    selectedObj: GetAllPatientsResponse['patients'][0] = {
        //
        // State Variables
        dob: new Date(),
        email: '',
        id: 0,
        name: '',
        password: '',
        refundableAmount: 0,
        registrationTime: new Date(),
        status: 'ACCOUNT_NOT_SUSPENDED',
        whatsappNumber: '',
    }
    mainClass = PatientsComponent;
    //
    // View Elements
    @ViewChild('dataTableContainer') dataTableContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('dataTableSearch') dataTableSearch!: ElementRef<HTMLInputElement>;
    @ViewChild('searchButtonsContainer') searchButtonsContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('possibleActionsModal') possibleActionsModal!: ModalComponent;
    //
    // Icons
    faCloudArrowUp = faCloudArrowUp;
    faArrowRotateRight = faArrowRotateRight;
    //
    // Forms
    selectedObjectForm = {
        loading: false,
        fg: this._fb.group({
            id: [0, [vl.required]],
            email: [
                '', vl.compose([
                    vl.required,
                    this._fvs.email()
                ]),
                vl.composeAsync([
                    this._fvs.emailMustNotExist(() => [this.selectedObj.email])
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
            status: ['ACCOUNT_NOT_SUSPENDED', [vl.required]],
        }),
        errors: {
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
            status: {
                required: 'Status is required',
            }
        },
        accountStatusOptions: [
            { label: 'Suspended', value: 'ACCOUNT_SUSPENDED' },
            { label: 'Active', value: 'ACCOUNT_NOT_SUSPENDED' }
        ],
        submit: async () => {
            if (this.selectedObjectForm.loading) return;
            if (!this.selectedObjectForm.fg.valid) {
                this.selectedObjectForm.fg.markAllAsTouched();
                return;
            }
            this.selectedObjectForm.loading = true;
            
            const res = await this.http.sendRequest({
                method: 'PUT',
                url: '/a/patient',
                jsonData: {
                    id: this.selectedObjectForm.fg.controls.id.value,
                    email: this.selectedObjectForm.fg.controls.email.value,
                    password: this.selectedObjectForm.fg.controls.password.value,
                    status: this.selectedObjectForm.fg.controls.status.value,
                }
            }) as AdminUpdatePatientResponse | false;
            
            this.selectedObjectForm.loading = false;
            
            if (!res) {
                return;
            } else if (res.emailAlreadyExists) {
                toast.error('Email already exists', {
                    description: 'Another user (patient, doctor or admin) is already using this email address. Please use a different email address.'
                });
            } else if (res.patientNotFound) {
                toast.error('Patient not found', {
                    description: 'The patient you are trying to update does not exist in the database. Please refresh the page and try again.'
                });
            } else if (res.patientUpdated) {
                toast.success('Patient updated')
                this.possibleActionsModal.close();
                await this.load({ id: Number(this.selectedObjectForm.fg.controls.id.value) });
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while updating the patient. Please try again.'
                });
                this.possibleActionsModal.close();
                await this.load({ id: Number(this.selectedObjectForm.fg.controls.id.value) });
            }
        }
    };
    //
    // Datatable
    columns = [
        {
            label: 'ID',
            field: 'id',
            fixed: true,
            width: 65,
        },
        {
            label: 'Name',
            field: 'name',
        },
        {
            label: 'Email',
            field: 'email',
        },
        {
            label: 'Date of birth',
            field: 'dob',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = this.utils.convertDateToDefinedDateFormat(a);
            }
        },
        {
            label: 'Password',
            field: 'password',
        },
        {
            label: 'WhatsApp Number',
            field: 'whatsappNumber',
        },
        {
            label: 'Account Status',
            field: 'status',
            format: (ele: HTMLTableCellElement, a: PatientAccountStatus) => {
                if (a === 'ACCOUNT_NOT_SUSPENDED') {
                    ele.classList.add('bg-green-200', 'text-green-800');
                    ele.textContent = 'Active';
                } else if (a === 'ACCOUNT_SUSPENDED') {
                    ele.classList.add('bg-red-200', 'text-red-800');
                    ele.textContent = 'Suspended';
                } else {
                    throw new Error('Unknown patient account status ' + a);
                }
            }
        },
        {
            label: 'Refundable Amount',
            field: 'refundableAmount',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = 'Rs. ' + a;
            }
        },
        {
            label: 'Registration Time',
            field: 'registrationTime',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = this.utils.convertDateToDefinedDateTimeFormat(a);
            }
        },
    ];
    
    
    constructor(
        private html: HtmlService,
        private http: HTTPService,
        private utils: UtilFuncService,
        private _fb: FormBuilder,
        private _fvs: FormValidatorsService,
    ) {
        this.change$.pipe(takeUntilDestroyed()).subscribe(() => {
            this.updateDataTable();
        })
        PatientsComponent.searched.changeSearch$.pipe(takeUntilDestroyed()).subscribe(() => {
            let list = PatientsComponent.searched.list.map(l => l);
            if (list.length === 0) {
                for (const col of this.columns) {
                    if (col?.field) {
                        list.push(col.field);
                    }
                }
            }
            this.html.dataTableSearch(
                this.dataTableInstance,
                PatientsComponent.searched.query,
                list
            );
        })
    }
    
    
    async ngAfterViewInit() {
        this.initDataTable();
        this.html.initTailwindElements();
        await this.load();
        this.searchByUrlQueryParam();
    }
    
    
    initDataTable(): void {
        this.dataTableInstance = this.html.createDataTable(
            this.dataTableContainer.nativeElement,
            this.columns,
            undefined,
        );
        
        (
            this.dataTableContainer.nativeElement as any
        ).addEventListener('rowClick.te.datatable', ({ row }: { row: { id: number } }) => {
            const { id } = row;
            this.selectedObj = PatientsComponent.allObjs.find(p => p.id === id) || this.selectedObj;
            this.selectedObjectForm.fg.controls.email.setValue(this.selectedObj.email);
            this.selectedObjectForm.fg.controls.id.setValue(this.selectedObj.id);
            this.selectedObjectForm.fg.controls.password.setValue(this.selectedObj.password);
            this.selectedObjectForm.fg.controls.status.setValue(this.selectedObj.status);
            this.possibleActionsModal.open();
        });
    }
    
    
    async load({ id, force }: { id?: number, force?: boolean } = {}) {
        if (PatientsComponent.allObjs.length && !id && !force) {
            this.change$.next();
            return;
        }
        
        if (PatientsComponent.loading) return;
        
        PatientsComponent.loading = true;
        
        let url = '/a/patients';
        if (id) {
            url = `/a/patient/${ id }`;
        }
        
        const res = await this.http.sendRequest({
            method: 'GET',
            url: url,
        }) as GetAllPatientsResponse | false;
        
        PatientsComponent.loading = false;
        
        if (!res) return;
        
        // convert date strings to Date objects
        res.patients.forEach(p => {
            p.dob = new Date(p.dob);
            p.registrationTime = new Date(p.registrationTime);
        });
        
        if (id) {
            if (res.patients.length === 0) {
                // remove the patient from AllDoctorsComponent.patients
                PatientsComponent.allObjs = PatientsComponent.allObjs.filter(p => p.id !== id);
            } else {
                // update the patient in AllDoctorsComponent.patients
                const patient = res.patients[0];
                const index = PatientsComponent.allObjs.findIndex(p => p.id === id);
                if (index !== -1) {
                    PatientsComponent.allObjs[index] = patient;
                } else {
                    PatientsComponent.allObjs.push(patient);
                }
            }
        } else {
            PatientsComponent.allObjs = res.patients;
        }
        
        this.change$.next();
    }
    
    
    searchByUrlQueryParam() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // loop through columns and check if the column is in the url query param
        for (const col of this.columns) {
            if (urlParams.has(col.field)) {
                PatientsComponent.searched.list = [col.field];
                PatientsComponent.searched.query = urlParams.get(col.field) || '';
                PatientsComponent.searched.changeSearch$.next();
                break;
            }
        }
    }
    
    
    updateDataTable() {
        // [id, name, email, dob, password, whatsappNumber, status, refundableAmount, registrationTime]
        const rows = PatientsComponent.allObjs.map(p => [
            p.id,
            p.name,
            p.email,
            p.dob,
            p.password,
            p.whatsappNumber,
            p.status,
            p.refundableAmount,
            p.registrationTime,
        ]);
        this.html.updateDataTable(this.dataTableInstance, rows);
    }
}
