import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HtmlService } from '../../services/html.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCloudArrowUp, faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { HTTPService } from "../../services/http.service";
import {
    AdminCompleteDoctorWithdrawalRequestResponse,
    AdminGetDoctorWithdrawalsResponse,
    AdminRejectDoctorWithdrawalRequestResponse,
    AdminUpdatePatientResponse,
} from "../../interfaces/api-response-interfaces";
import { Subject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { UtilFuncService } from "../../services/util-func.service";
import { ModalComponent } from "../../components/modal/modal.component";
import { FormInputComponent } from "../../components/form-input/form-input.component";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators as vl } from "@angular/forms";
import { FormValidatorsService } from "../../services/form-validators.service";
import { FormSelectComponent } from "../../components/form-select/form-select.component";
import { FormSubmitButtonComponent } from "../../components/form-submit-button/form-submit-button.component";
import { toast } from "ngx-sonner";
import {
    FormRefreshButtonComponent
} from "../../components/form-refresh-button/form-refresh-button.component";
import { RouterLink } from "@angular/router";
import { FormTextareaComponent } from "../../components/form-textarea/form-textarea.component";
import {
    FormDatetimePickerComponent
} from "../../components/form-datetime-picker/form-datetime-picker.component";
import { FormFileInputComponent } from "../../components/form-file-input/form-file-input.component";

@Component({
    selector: 'app-doctor-withdrawals',
    standalone: true,
    imports: [
        FontAwesomeModule, CommonModule, ModalComponent, FormInputComponent,
        ReactiveFormsModule, FormSelectComponent, FormSubmitButtonComponent, FormRefreshButtonComponent, FormsModule,
        RouterLink, FormTextareaComponent, FormDatetimePickerComponent, FormFileInputComponent
    ],
    templateUrl: './doctor-withdrawals.component.html',
    styleUrl: './doctor-withdrawals.component.scss',
})
export class DoctorWithdrawalsComponent implements AfterViewInit {
    //
    // Static variables
    static allObjs: AdminGetDoctorWithdrawalsResponse['withdrawals'] = [];
    static loading = false;
    static searched = {
        changeSearch$: new Subject<void>(),
        list: [] as string[],
        query: '',
        selectKey: (key: string) => {
            if (DoctorWithdrawalsComponent.searched.list.includes(key)) {
                DoctorWithdrawalsComponent.searched.list = DoctorWithdrawalsComponent.searched.list.filter(k => k !==
                    key);
            } else {
                DoctorWithdrawalsComponent.searched.list.push(key);
            }
            DoctorWithdrawalsComponent.searched.changeSearch$.next();
        },
        search: (q: string) => {
            DoctorWithdrawalsComponent.searched.query = q;
            DoctorWithdrawalsComponent.searched.changeSearch$.next();
        },
    };
    //
    // State Variables
    change$ = new Subject<void>();
    dataTableInstance: any = null;
    selectedObj: AdminGetDoctorWithdrawalsResponse['withdrawals'][0] = {
        amount: 0,
        id: 0,
        doctorId: 0,
        receiverEpUsername: '',
        receiverEpNb: '',
        rejectionReason: '',
        requestTime: new Date(),
        senderEpUsername: '',
        senderEpNb: '',
        status: 'REQUESTED',
        trxId: '',
        trxTime: new Date(),
    }
    mainClass = DoctorWithdrawalsComponent;
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
            id: [0, vl.required],
            senderEpNb: [
                '', vl.compose([
                    vl.required, vl.minLength(10), vl.maxLength(15), this._fvs.phoneNumberFormat(),
                ])
            ],
            senderEpUsername: [
                '', vl.compose([
                    vl.required, vl.minLength(1), vl.maxLength(64),
                ])
            ],
        }),
        errors: {
            senderEpNb: {
                required: 'Please enter a phone number',
                minlength: 'Phone number is too short',
                maxlength: 'Phone number is too long',
                phoneNumberFormat: 'Phone number is not valid. e.g., +923001234567',
            },
            senderEpUsername: {
                required: 'Please enter a username',
                minlength: 'Username is too short. Minimum one character required',
                maxlength: 'Username is too long. Maximum 64 characters allowed',
            },
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
            
            const data = this.selectedObjectForm.fg.value;
            
            const res = await this.http.sendRequest({
                method: 'PUT',
                url: '/a/patient',
                jsonData: data,
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
    ///
    // Reject
    rejectForm = {
        opened: false,
        loading: false,
        fg: this._fb.group({
            id: [0, vl.required],
            reason: [
                '', vl.compose([
                    vl.required, vl.minLength(1), vl.maxLength(64),
                ])
            ],
        }),
        errors: {
            reason: {
                required: 'Please enter a rejection reason',
                minlength: 'Rejection reason is too short. Minimum one character required',
                maxlength: 'Rejection reason is too long. Maximum 64 characters allowed',
            },
        },
        submit: async () => {
            this.rejectForm.fg.controls.id.setValue(this.selectedObj.id);
            if (this.rejectForm.loading || !this.rejectForm.validate()) return;
            this.rejectForm.loading = true;
            
            const data = this.rejectForm.fg.value;
            
            const res = await this.http.sendRequest({
                method: 'PUT',
                url: '/a/d/withdrawal/reject',
                jsonData: data,
            }) as AdminRejectDoctorWithdrawalRequestResponse | false;
            
            this.rejectForm.loading = false;
            
            if (!res) {
                return;
            } else if (res.withdrawalNotFound) {
                toast.error('Withdrawal not found', {
                    description: 'The withdrawal you are trying to reject does not exist in the database. ' +
                        'Reloading the withdrawal!'
                });
            } else if (res.alreadyResponded) {
                if (res.withdrawalCurrentStatus === 'COMPLETED') {
                    toast.error('Withdrawal already approved', {
                        description: 'The withdrawal you are trying to reject has already been approved. ' +
                            'Reloading the withdrawal!'
                    });
                    this.possibleActionsModal.close();
                } else if (res.withdrawalCurrentStatus === 'REJECTED') {
                    toast.error('Withdrawal already rejected', {
                        description: 'The withdrawal you are trying to reject has already been rejected. ' +
                            'Reloading the withdrawal!'
                    });
                } else {
                    toast.error('An error occurred', {
                        description: 'An error occurred while rejecting the withdrawal. Please try again.'
                    });
                }
            } else if (res.withdrawalRejected) {
                toast.success('Withdrawal rejected');
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while rejecting the withdrawal. Please try again.'
                });
            }
            
            await this.load({ id: Number(this.rejectForm.fg.controls.id.value) });
        },
        validate: () => {
            if (!this.rejectForm.fg.valid) {
                this.utils.markAllFormControlsAsTouched(this.rejectForm.fg);
                toast.warning('Please fill all required fields');
                return false;
            }
            return true;
        }
    }
    //
    // Complete
    completeForm = {
        opened: false,
        loading: false,
        fg: this._fb.group({
            id: [0, vl.required],
            ss: [
                new File([], ''), vl.compose([
                    vl.required, this._fvs.imageFile(), this._fvs.fileMaxSize(1)
                ])
            ],
            trxId: [
                '', vl.compose([
                    vl.required, vl.minLength(10), vl.maxLength(16),
                ])
            ],
            trxTime: [
                '2024-01-01, 01:00 PM', vl.compose([vl.required, this._fvs.datetimeFormat()]),
            ],
            senderEpNb: [
                '', vl.compose([
                    vl.required, vl.minLength(10), vl.maxLength(15), this._fvs.phoneNumberFormat(),
                ])
            ],
            senderEpUsername: [
                '', vl.compose([
                    vl.required, vl.minLength(1), vl.maxLength(64),
                ])
            ],
        }),
        errors: {
            ss: {
                required: 'Please provide the transaction screenshot',
                imageFile: 'Transaction screenshot must be an image'
            },
            trxId: {
                required: 'Please enter a transaction ID',
                minlength: 'Transaction ID is too short',
                maxlength: 'Transaction ID is too long',
            },
            trxTime: {
                required: 'Please select a transaction time',
                datetimeFormat: 'Transaction time is not valid',
            },
            senderEpNb: {
                required: 'Please enter a phone number',
                minlength: 'Phone number is too short',
                maxlength: 'Phone number is too long',
                phoneNumberFormat: 'Phone number is not valid. e.g., +923001234567',
            },
            senderEpUsername: {
                required: 'Please enter a username',
                minlength: 'Username is too short. Minimum one character required',
                maxlength: 'Username is too long. Maximum 64 characters allowed',
            },
        },
        submit: async () => {
            this.completeForm.fg.controls.id.setValue(this.selectedObj.id);
            if (this.completeForm.loading || !this.completeForm.validate()) return;
            this.completeForm.loading = true;
            
            const data = this.completeForm.fg.value;
            data.trxTime = this.utils.convertDateToDefinedDateTimeFormat(new Date(data.trxTime || ''));
            
            const res = await this.http.sendRequest({
                method: 'PUT',
                url: '/a/d/withdrawal/complete',
                jsonData: data,
            }) as AdminCompleteDoctorWithdrawalRequestResponse | false;
            
            this.completeForm.loading = false;
            
            if (!res) {
                return;
            } else if (res.withdrawalNotFound) {
                toast.error('Withdrawal not found', {
                    description: 'The withdrawal you are trying to complete does not exist in the database. ' +
                        'Reloading the withdrawal!'
                });
            } else if (res.alreadyResponded) {
                if (res.withdrawalCurrentStatus === 'COMPLETED') {
                    toast.error('Withdrawal already approved', {
                        description: 'The withdrawal you are trying to complete has already been approved. ' +
                            'Reloading the withdrawal!'
                    });
                    this.possibleActionsModal.close();
                } else if (res.withdrawalCurrentStatus === 'REJECTED') {
                    toast.error('Withdrawal already rejected', {
                        description: 'The withdrawal you are trying to complete has already been rejected. ' +
                            'Reloading the withdrawal!'
                    });
                } else {
                    toast.error('An error occurred', {
                        description: 'An error occurred while completing the withdrawal. Please try again.'
                    });
                }
            } else if (res.withdrawalCompleted) {
                toast.success('Withdrawal approved');
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while completing the withdrawal. Please try again.'
                });
            }
            
            await this.load({ id: Number(this.completeForm.fg.controls.id.value) });
        },
        validate: () => {
            if (!this.completeForm.fg.valid) {
                this.utils.markAllFormControlsAsTouched(this.completeForm.fg);
                toast.warning('Please fill all required fields');
                return false;
            }
            return true;
        }
    }
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
            label: 'Doctor ID',
            field: 'doctorId',
        },
        {
            label: 'Current Status',
            field: 'status',
            format: (ele: HTMLTableCellElement, a: any) => {
                if (a === 'REQUESTED') {
                    ele.classList.add('bg-yellow-200', 'text-yellow-800');
                    ele.textContent = 'Requested';
                } else if (a === 'COMPLETED') {
                    ele.classList.add('bg-green-200', 'text-green-800');
                    ele.textContent = 'Approved';
                } else if (a === 'REJECTED') {
                    ele.classList.add('bg-red-200', 'text-red-800');
                    ele.textContent = 'Rejected';
                } else {
                    throw new Error('Unknown withdrawal status ' + a);
                }
            }
        },
        {
            label: 'Receiver EP Username',
            field: 'receiverEpUsername',
        },
        {
            label: 'Receiver EP Nb',
            field: 'receiverEpNb',
        },
        {
            label: 'Request Time',
            field: 'requestTime',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = this.utils.convertDateToDefinedDateTimeFormat(a);
            }
        },
        {
            label: 'Sender EP Username',
            field: 'senderEpUsername',
        },
        {
            label: 'Sender EP Nb',
            field: 'senderEpNb',
        },
        {
            label: 'Transaction/Trx ID',
            field: 'trxId',
        },
        {
            label: 'Transaction/Trx Time',
            field: 'trxTime',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = this.utils.convertDateToDefinedDateTimeFormat(a);
            }
        },
        {
            label: 'Amount',
            field: 'amount',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = 'Rs. ' + a;
            }
        },
        {
            label: 'Rejection Reason',
            field: 'rejectionReason',
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
        DoctorWithdrawalsComponent.searched.changeSearch$.pipe(takeUntilDestroyed()).subscribe(() => {
            let list = DoctorWithdrawalsComponent.searched.list.map(l => l);
            if (list.length === 0) {
                for (const col of this.columns) {
                    if (col?.field) {
                        list.push(col.field);
                    }
                }
            }
            this.html.dataTableSearch(
                this.dataTableInstance,
                DoctorWithdrawalsComponent.searched.query,
                list
            );
        })
        setTimeout(() => {
            this.initDataTable();
        }, 200);
    }
    
    
    async ngAfterViewInit() {
        console.info('ngAfterViewInit');
        this.initDataTable();
        this.html.initTailwindElements();
        this.initDataLoad();
    }
    
    
    async initDataLoad() {
        await this.load();
        this.searchByUrlQueryParam();
    }
    
    
    initDataTable(): void {
        if (this.dataTableInstance) return;
        this.dataTableInstance = this.html.createDataTable(
            this.dataTableContainer.nativeElement,
            this.columns,
            undefined,
        );
        
        (
            this.dataTableContainer.nativeElement as any
        ).addEventListener('rowClick.te.datatable', ({ row }: { row: { id: number } }) => {
            const { id } = row;
            this.selectedObj = DoctorWithdrawalsComponent.allObjs.find(p => p.id === id) || this.selectedObj;
            // this.selectedObjectForm.fg.controls.email.setValue(this.selectedObj.email);
            // this.selectedObjectForm.fg.controls.id.setValue(this.selectedObj.id);
            // this.selectedObjectForm.fg.controls.password.setValue(this.selectedObj.password);
            // this.selectedObjectForm.fg.controls.status.setValue(this.selectedObj.status);
            this.possibleActionsModal.open();
        });
    }
    
    
    async load({ id, force }: { id?: number, force?: boolean } = {}) {
        if (DoctorWithdrawalsComponent.allObjs.length && !id && !force) {
            this.change$.next();
            return;
        }
        
        if (DoctorWithdrawalsComponent.loading) return;
        
        DoctorWithdrawalsComponent.loading = true;
        
        let url = '/a/d/withdrawals';
        if (id) {
            url = `/a/d/withdrawal/${ id }`;
        }
        
        const res = await this.http.sendRequest({
            method: 'GET',
            url: url,
        }) as AdminGetDoctorWithdrawalsResponse | false;
        
        DoctorWithdrawalsComponent.loading = false;
        
        if (!res) return;
        
        // convert date strings to Date objects
        res.withdrawals.forEach(w => {
            w.requestTime = new Date(w.requestTime);
            w.trxTime = new Date(w.trxTime);
        });
        
        if (id) {
            if (res.withdrawals.length === 0) {
                DoctorWithdrawalsComponent.allObjs = DoctorWithdrawalsComponent.allObjs.filter(p => p.id !== id);
            } else {
                const withdrawals = res.withdrawals[0];
                const index = DoctorWithdrawalsComponent.allObjs.findIndex(p => p.id === id);
                if (index !== -1) {
                    DoctorWithdrawalsComponent.allObjs[index] = withdrawals;
                } else {
                    DoctorWithdrawalsComponent.allObjs.push(withdrawals);
                }
            }
        } else {
            DoctorWithdrawalsComponent.allObjs = res.withdrawals;
        }
        
        // also update the selected object
        this.selectedObj.id = -1;
        this.selectedObj = DoctorWithdrawalsComponent.allObjs.find(p => p.id === this.selectedObj.id) ||
            this.selectedObj;
        if (this.selectedObj.id === -1) {
            this.selectedObj = DoctorWithdrawalsComponent.allObjs[0] || this.selectedObj;
            this.possibleActionsModal.close();
        }
        this.change$.next();
    }
    
    
    searchByUrlQueryParam() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // loop through columns and check if the column is in the url query param
        for (const col of this.columns) {
            if (urlParams.has(col.field)) {
                DoctorWithdrawalsComponent.searched.list = [col.field];
                DoctorWithdrawalsComponent.searched.query = urlParams.get(col.field) || '';
                DoctorWithdrawalsComponent.searched.changeSearch$.next();
                break;
            }
        }
    }
    
    
    updateDataTable() {
        // [id, name, email, dob, password, whatsappNumber, status, refundableAmount, registrationTime]
        const rows = DoctorWithdrawalsComponent.allObjs.map(w => [
            w.id,
            w.doctorId,
            w.status,
            w.receiverEpUsername,
            w.receiverEpNb,
            w.requestTime,
            w.senderEpUsername,
            w.senderEpNb,
            w.trxId,
            w.trxTime,
            w.amount,
            w.rejectionReason,
        ]);
        this.html.updateDataTable(this.dataTableInstance, rows);
    }
}
