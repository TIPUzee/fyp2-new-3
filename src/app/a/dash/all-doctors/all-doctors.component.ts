import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HtmlService } from '../../../services/html.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCloudArrowUp, faArrowRotateRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { OffcanvasService } from '../../../utils/components/offcanvas/offcanvas.service';
import { HTTPService } from "../../../services/http.service";
import {
    AdminGetDoctorApprovalDocumentsResponse,
    AdminUpdateDoctorResponse,
    AllGetAllDoctorsResponse,
} from "../../../interfaces/api-response-interfaces";
import { Subject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { UtilFuncService } from "../../../services/util-func.service";
import { DoctorAccountStatus } from "../../../interfaces/interfaces";
import { ModalComponent } from "../../../utils/components/modal/modal.component";
import { FormInputComponent } from "../../../utils/components/form-input/form-input.component";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators as vl } from "@angular/forms";
import { FormValidatorsService } from "../../../services/form-validators.service";
import { FormSelectComponent } from "../../../utils/components/form-select/form-select.component";
import { FormSubmitButtonComponent } from "../../../utils/components/form-submit-button/form-submit-button.component";
import { toast } from "ngx-sonner";
import {
    FormRefreshButtonComponent
} from "../../../utils/components/form-refresh-button/form-refresh-button.component";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { NgxExtendedPdfViewerModule } from "ngx-extended-pdf-viewer";

@Component({
    selector: 'app-all-doctors',
    standalone: true,
    imports: [
        FontAwesomeModule, CommonModule, ModalComponent, FormInputComponent,
        ReactiveFormsModule, FormSelectComponent, FormSubmitButtonComponent, FormRefreshButtonComponent, FormsModule,
        RouterLink, NgxExtendedPdfViewerModule, RouterOutlet, RouterLinkActive
    ],
    templateUrl: './all-doctors.component.html',
    styleUrl: './all-doctors.component.scss',
})
export class AllDoctorsComponent implements AfterViewInit {
    //
    // Static variables
    static allObjs: AllGetAllDoctorsResponse['doctors'] = [];
    static loading = false;
    static searched = {
        changeSearch$: new Subject<void>(),
        list: [] as string[],
        query: '',
        selectKey: (key: string) => {
            if (AllDoctorsComponent.searched.list.includes(key)) {
                AllDoctorsComponent.searched.list = AllDoctorsComponent.searched.list.filter(k => k !== key);
            } else {
                AllDoctorsComponent.searched.list.push(key);
            }
            AllDoctorsComponent.searched.changeSearch$.next();
        },
        search: (q: string) => {
            AllDoctorsComponent.searched.query = q;
            AllDoctorsComponent.searched.changeSearch$.next();
        },
    };
    //
    // State Variables
    change$ = new Subject<void>();
    dataTableInstance: any = null;
    selectedObj: AllGetAllDoctorsResponse['doctors'][0] = {
        activeForAppointments: 0,
        appointmentCharges: 0,
        coverPicFilename: '',
        dob: new Date(),
        email: '',
        id: 0,
        maxMeetingDuration: 0,
        name: '',
        password: '',
        profilePicFilename: '',
        registrationTime: new Date(),
        specialization: '',
        specializationCategoryId: 0,
        status: 'NEW_ACCOUNT',
        statusChangeTime: new Date(),
        walletAmount: 0,
        whatsappNumber: '',
    }
    mainClass = AllDoctorsComponent;
    currentDocumentSelectedIndex = 0;
    doctorDocuments = {
        selectedDocIndex: -1,
        list: [] as string[],
        loading: false,
        toShow: false,
        lateShow: () => {
            setTimeout(() => {
                this.doctorDocuments.toShow = true;
            }, 500);
        },
        load: async () => {
            this.doctorDocuments.loading = true;
            
            const res = await this.http.sendRequest({
                method: 'GET',
                url: `/a/doctor/${ this.selectedObj.id }/documents`,
            }) as AdminGetDoctorApprovalDocumentsResponse | false;
            
            if (!res) {
                this.doctorDocuments.loading = false;
                return;
            } else if (res.doctorNotFound) {
                toast.error('Doctor not found', {
                    description: 'The doctor you are trying to view documents for does not exist in the database. Please refresh' +
                        ' the page and try again.'
                });
                this.doctorDocuments.loading = false;
                return;
            } else if (res.docs) {
                // make complete URLs
                res.docs = res.docs.map(d => this.utils.makeOwnServerUrl(this.utils.makeApiUrl('/file/' + d)));
                this.doctorDocuments.list = res.docs;
                if (this.doctorDocuments.list.length) {
                    this.doctorDocuments.selectedDocIndex = 0;
                } else {
                    this.doctorDocuments.selectedDocIndex = -1;
                    toast.warning('No documents found', {
                        description: 'The doctor has not uploaded any documents yet.'
                    });
                }
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while fetching the documents. Please try again.'
                });
            }
        }
    }
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
    faArrowLeft = faArrowLeft;
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
            status: ['NEW_ACCOUNT' as DoctorAccountStatus, [vl.required]],
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
            { label: 'Not Verified', value: 'NEW_ACCOUNT' },
            { label: 'Approved', value: 'ACCOUNT_APPROVED' },
            { label: 'Approval Requested', value: 'APPROVAL_REQUESTED' },
            { label: 'Approval Rejected', value: 'APPROVAL_REJECTED' },
            { label: 'Suspended', value: 'ACCOUNT_SUSPENDED' },
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
                url: '/a/doctor',
                jsonData: {
                    id: this.selectedObjectForm.fg.controls.id.value,
                    email: this.selectedObjectForm.fg.controls.email.value,
                    password: this.selectedObjectForm.fg.controls.password.value,
                    status: this.selectedObjectForm.fg.controls.status.value,
                }
            }) as AdminUpdateDoctorResponse | false;
            
            this.selectedObjectForm.loading = false;
            
            if (!res) {
                return;
            } else if (res.emailAlreadyExists) {
                toast.error('Email already exists', {
                    description: 'Another user (patient, doctor or admin) is already using this email address. Please use a different email address.'
                });
            } else if (res.doctorNotFound) {
                toast.error('Doctor not found', {
                    description: 'The doctor you are trying to update does not exist in the database. Please refresh' +
                        ' the page and try again.'
                });
            } else if (res.doctorUpdated) {
                toast.success('Doctor updated')
                this.possibleActionsModal.close();
                await this.load({ id: Number(this.selectedObjectForm.fg.controls.id.value) });
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while updating the doctor. Please try again.'
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
            label: 'Category',
            field: 'specializationCategoryId',
        },
        {
            label: 'Email',
            field: 'email',
        },
        {
            label: 'Password',
            field: 'password',
        },
        {
            label: 'Name',
            field: 'name',
        },
        {
            label: 'Date of birth',
            field: 'dob',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = this.utils.convertDateToDefinedDateFormat(a);
            }
        },
        {
            label: 'WhatsApp Number',
            field: 'whatsappNumber',
        },
        {
            label: 'Account Status',
            field: 'status',
            format: (ele: HTMLTableCellElement, a: DoctorAccountStatus) => {
                if (a === 'ACCOUNT_SUSPENDED') {
                    ele.textContent = 'Suspended';
                    ele.classList.add('bg-red-200', 'text-red-800');
                } else if (a === 'NEW_ACCOUNT') {
                    ele.textContent = 'Not Verified';
                    ele.classList.add('bg-yellow-200', 'text-yellow-800');
                } else if (a === 'ACCOUNT_APPROVED') {
                    ele.textContent = 'Approved';
                    ele.classList.add('bg-green-200', 'text-green-800');
                } else if (a === 'APPROVAL_REQUESTED') {
                    ele.textContent = 'Approval Requested';
                    ele.classList.add('bg-blue-200', 'text-blue-800');
                } else if (a === 'APPROVAL_REJECTED') {
                    ele.textContent = 'Approval Rejected';
                    ele.classList.add('bg-red-200', 'text-red-800');
                } else {
                    throw new Error('Unknown doctor account status: ' + a);
                }
            }
        },
        {
            label: 'Status Change Time',
            field: 'statusChangeTime',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = this.utils.convertDateToDefinedDateTimeFormat(a);
            }
        },
        {
            label: 'Wallet Amount',
            field: 'walletAmount',
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
        {
            label: 'Meeting Duration',
            field: 'maxMeetingDuration',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = a + ' minutes';
            }
        },
        {
            label: 'Specialization',
            field: 'specialization',
        },
        {
            label: 'Specialization',
            field: 'specialization',
        },
        {
            label: 'Active for Consultation',
            field: 'activeForAppointments',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = a ? 'Yes' : 'No';
            }
        },
    ];
    
    
    constructor(
        private html: HtmlService,
        public offcanvas: OffcanvasService,
        private http: HTTPService,
        private utils: UtilFuncService,
        private _fb: FormBuilder,
        private _fvs: FormValidatorsService,
    ) {
        this.change$.pipe(takeUntilDestroyed()).subscribe(() => {
            this.updateDataTable();
        })
        AllDoctorsComponent.searched.changeSearch$.pipe(takeUntilDestroyed()).subscribe(() => {
            let list = AllDoctorsComponent.searched.list.map(l => l);
            if (list.length === 0) {
                for (const col of this.columns) {
                    if (col?.field) {
                        list.push(col.field);
                    }
                }
            }
            this.html.dataTableSearch(
                this.dataTableInstance,
                AllDoctorsComponent.searched.query,
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
        const rows = [
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [2, 'Zeeshan', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321', '2023-12-06T11:30:00Z'],
            [1, 'John Doe', 'zeeshan@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
        ];
        this.dataTableInstance = this.html.createDataTable(
            this.dataTableContainer.nativeElement,
            this.columns,
            undefined,
        );
        
        (
            this.dataTableContainer.nativeElement as any
        ).addEventListener('rowClick.te.datatable', ({ row }: { row: { id: number } }) => {
            const { id } = row;
            this.selectedObj = AllDoctorsComponent.allObjs.find(p => p.id === id) || this.selectedObj;
            this.selectedObjectForm.fg.controls.email.setValue(this.selectedObj.email);
            this.selectedObjectForm.fg.controls.id.setValue(this.selectedObj.id);
            this.selectedObjectForm.fg.controls.password.setValue(this.selectedObj.password);
            this.selectedObjectForm.fg.controls.status.setValue(this.selectedObj.status);
            this.possibleActionsModal.open();
        });
    }
    
    
    async load({ id, force }: { id?: number, force?: boolean } = {}) {
        if (AllDoctorsComponent.allObjs.length && !id && !force) {
            this.change$.next();
            return;
        }
        
        if (AllDoctorsComponent.loading) return;
        
        AllDoctorsComponent.loading = true;
        
        let url = '/a/doctors';
        if (id) {
            url = `/a/doctor/${ id }`;
        }
        
        const res = await this.http.sendRequest({
            method: 'GET',
            url: url,
        }) as AllGetAllDoctorsResponse | false;
        
        AllDoctorsComponent.loading = false;
        
        if (!res) return;
        
        // convert date strings to Date objects
        res.doctors.forEach(d => {
            d.dob = new Date(d.dob);
            d.registrationTime = new Date(d.registrationTime);
            d.statusChangeTime = new Date(d.statusChangeTime);
        });
        
        if (id) {
            if (res.doctors.length === 0) {
                // remove the patient from AllDoctorsComponent.patients
                AllDoctorsComponent.allObjs = AllDoctorsComponent.allObjs.filter(p => p.id !== id);
            } else {
                // update the patient in AllDoctorsComponent.patients
                const obj = res.doctors[0];
                const index = AllDoctorsComponent.allObjs.findIndex(p => p.id === id);
                if (index !== -1) {
                    AllDoctorsComponent.allObjs[index] = obj;
                } else {
                    AllDoctorsComponent.allObjs.push(obj);
                }
            }
        } else {
            AllDoctorsComponent.allObjs = res.doctors;
        }
        
        this.change$.next();
    }
    
    
    searchByUrlQueryParam() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // loop through columns and check if the column is in the url query param
        for (const col of this.columns) {
            if (urlParams.has(col.field)) {
                AllDoctorsComponent.searched.list = [col.field];
                AllDoctorsComponent.searched.query = urlParams.get(col.field) || '';
                AllDoctorsComponent.searched.changeSearch$.next();
                break;
            }
        }
    }
    
    
    updateDataTable() {
        // [id, name, email, dob, password, whatsappNumber, status, refundableAmount, registrationTime]
        const rows = AllDoctorsComponent.allObjs.map(p => [
            p.id,
            p.specializationCategoryId,
            p.email,
            p.password,
            p.name,
            p.dob,
            p.whatsappNumber,
            p.status,
            p.statusChangeTime,
            p.walletAmount,
            p.registrationTime,
            p.maxMeetingDuration,
            p.specialization,
            p.activeForAppointments,
        ]);
        this.html.updateDataTable(this.dataTableInstance, rows);
    }
}
