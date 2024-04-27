import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HtmlService } from '../../services/html.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCloudArrowUp, faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { HTTPService } from "../../services/http.service";
import {
    AdminApprovePatientNotJoinedRequestResponse,
    AdminGetAppointmentsResponse,
    AdminGetPatientNotJoinedProofVideosResponse,
    AdminRejectPatientNotJoinedRequestResponse,
} from "../../interfaces/api-response-interfaces";
import { Subject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { UtilFuncService } from "../../services/util-func.service";
import { AppointmentStatus } from "../../interfaces/interfaces";
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
import { VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';
import { VgBufferingModule } from '@videogular/ngx-videogular/buffering';

@Component({
    selector: 'app-appointments',
    standalone: true,
    imports: [
        FontAwesomeModule, CommonModule, ModalComponent, FormInputComponent,
        ReactiveFormsModule, FormSelectComponent, FormSubmitButtonComponent, FormRefreshButtonComponent, FormsModule,
        RouterLink, VgCoreModule, VgControlsModule, VgOverlayPlayModule, VgBufferingModule
    ],
    templateUrl: './appointments.component.html',
    styleUrl: './appointments.component.scss',
})
export class AppointmentsComponent implements AfterViewInit {
    //
    // Static variables
    static allObjs: AdminGetAppointmentsResponse['appointments'] = [];
    static loading = false;
    static searched = {
        changeSearch$: new Subject<void>(),
        list: [] as string[],
        query: '',
        selectKey: (key: string) => {
            if (AppointmentsComponent.searched.list.includes(key)) {
                AppointmentsComponent.searched.list = AppointmentsComponent.searched.list.filter(k => k !== key);
            } else {
                AppointmentsComponent.searched.list.push(key);
            }
            AppointmentsComponent.searched.changeSearch$.next();
        },
        search: (q: string) => {
            AppointmentsComponent.searched.query = q;
            AppointmentsComponent.searched.changeSearch$.next();
        },
    };
    //
    // State Variables
    change$ = new Subject<void>();
    dataTableInstance: any = null;
    selectedObj: AdminGetAppointmentsResponse['appointments'][0] = {
        delayCountByDoc: 0,
        doctorId: 0,
        doctorReport: '',
        id: 0,
        paidAmount: 0,
        patientId: 0,
        patientReview: '',
        paymentTime: new Date(),
        rating: 0,
        refundedAmount: 0,
        rescheduleCountByPat: 0,
        secretCode: '',
        status: 'PENDING',
        statusChangeTime: new Date(),
        symptomDescription: '',
        timeFrom: new Date(),
        timeTo: new Date()
    }
    mainClass = AppointmentsComponent;
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
            label: 'Patient ID',
            field: 'patientId',
        },
        {
            label: 'Current Status',
            field: 'status',
            format: (ele: HTMLTableCellElement, a: AppointmentStatus) => {
                if (a === 'PENDING') {
                    ele.classList.add('bg-yellow-200', 'text-yellow-800');
                    ele.textContent = 'Pending';
                } else if (a === 'COMPLETED') {
                    ele.classList.add('bg-green-200', 'text-green-800');
                    ele.textContent = 'Completed';
                } else if (a === 'DOC_CANCELLED') {
                    ele.classList.add('bg-red-200', 'text-gray-600');
                    ele.textContent = 'Doctor Cancelled';
                } else if (a === 'DOC_NOT_JOINED') {
                    ele.classList.add('bg-red-200', 'text-red-800');
                    ele.textContent = 'Doctor Not Joined';
                } else if (a === 'DOC_REQUESTED_DELAY') {
                    ele.classList.add('bg-yellow-200', 'text-yellow-800');
                    ele.textContent = 'Doctor Requested Delay';
                } else if (a === 'PAT_CANCELLED') {
                    ele.classList.add('bg-red-200', 'text-red-800');
                    ele.textContent = 'Patient Cancelled';
                } else if (a === 'PAT_NOT_JOINED') {
                    ele.classList.add('bg-red-200', 'text-red-800');
                    ele.textContent = 'Patient Not Joined';
                } else if (a === 'PAT_NOT_JOINED_REJ') {
                    ele.classList.add('bg-red-200', 'text-red-800');
                    ele.textContent = 'Patient Not Joined Rejected';
                } else if (a === 'PAT_NOT_JOINED_REQ') {
                    ele.classList.add('bg-yellow-200', 'text-blue-600');
                    ele.textContent = 'Patient Not Joined Requested';
                } else if (a === 'SLOT_CLASH') {
                    ele.classList.add('bg-red-200', 'text-red-800');
                    ele.textContent = 'Slot Clash';
                } else {
                    throw new Error('Unknown Appointment status: ' + a);
                }
            }
        },
        {
            label: 'Status Change Time',
            field: 'statusChangeTime',
            format: (ele: HTMLTableCellElement, a: Date) => {
                ele.textContent = this.utils.convertDateToDefinedDateTimeFormat(a);
            }
        },
        {
            label: 'Paid Amount',
            field: 'paidAmount',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = 'Rs. ' + a;
            }
        },
        {
            label: 'Booking Time',
            field: 'paymentTime',
            format: (ele: HTMLTableCellElement, a: Date) => {
                ele.textContent = this.utils.convertDateToDefinedDateTimeFormat(a);
            }
        },
        {
            label: 'Refunded Amount',
            field: 'refundedAmount',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = 'Rs. ' + a;
            }
        },
        {
            label: 'Patient Symptom Description',
            field: 'symptomDescription',
            format: (ele: HTMLTableCellElement, a: any) => {
                if (a.length > 50) {
                    ele.textContent = a.substr(0, 50) + '...';
                } else {
                    ele.textContent = a;
                }
            }
        },
        {
            label: 'Doctor Report',
            field: 'doctorReport',
            format: (ele: HTMLTableCellElement, a: any) => {
                if (a.length > 50) {
                    ele.textContent = a.substr(0, 50) + '...';
                } else {
                    ele.textContent = a;
                }
            }
        },
        {
            label: 'Patient Review',
            field: 'patientReview',
            format: (ele: HTMLTableCellElement, a: any) => {
                if (a.length > 50) {
                    ele.textContent = a.substr(0, 50) + '...';
                } else {
                    ele.textContent = a;
                }
            }
        },
        {
            label: 'Rating',
            field: 'rating',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = a + ' star(s)';
            }
        },
        {
            label: 'Doctor Delayed',
            field: 'delayCountByDoc',
            format: (ele: HTMLTableCellElement, a: number) => {
                ele.textContent = a + ' time(s)';
            }
        },
        {
            label: 'Patient Rescheduled',
            field: 'rescheduleCountByPat',
            format: (ele: HTMLTableCellElement, a: number) => {
                ele.textContent = a + ' time(s)';
            }
        },
        {
            label: 'Meeting From',
            field: 'timeFrom',
            format: (ele: HTMLTableCellElement, a: Date) => {
                ele.textContent = this.utils.convertDateToDefinedDateTimeFormat(a);
            }
        },
        {
            label: 'Meeting To',
            field: 'timeTo',
            format: (ele: HTMLTableCellElement, a: Date) => {
                ele.textContent = this.utils.convertDateToDefinedDateTimeFormat(a);
            }
        },
        {
            label: 'Secret Code',
            field: 'secretCode',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = a;
            }
        },
    ];
    //
    // Forms
    selectedObjectForm = {
        selectedVideoIndex: 0,
        loading: false,
        fg: this._fb.group({
            id: [0, [vl.required]],
            email: ['', [vl.required, vl.email]],
            password: ['', [vl.required]],
            status: ['ACCOUNT_NOT_SUSPENDED', [vl.required]],
        }),
        errors: {
            email: {
                required: 'Email is required',
                email: 'Invalid email',
            },
            password: {
                required: 'Password is required',
            },
            status: {
                required: 'Status is required',
            }
        },
        accountStatusOptions: [
            { label: 'Suspended', value: 'ACCOUNT_SUSPENDED' },
            { label: 'Active', value: 'ACCOUNT_NOT_SUSPENDED' }
        ],
        rejectionLoading: false,
        acceptanceLoading: false,
        reject: async () => {
            if (this.selectedObjectForm.loading) return;
            if (!this.selectedObj.id) {
                toast.warning('Please select an appointment first');
                return;
            }
            this.selectedObjectForm.rejectionLoading = true;
            
            const res = await this.http.sendRequest({
                method: 'PUT',
                url: `/a/appointment/${ this.selectedObj.id }/patient-not-joined/reject`,
            }) as AdminRejectPatientNotJoinedRequestResponse | false;
            
            this.selectedObjectForm.rejectionLoading = false;
            
            if (!res) {
                return;
            } else if (res.alreadyMarkedAsPatientNotJoinedReject) {
                toast.success('Already rejected the request');
            } else if (res.appointmentNotExists) {
                toast.error('Appointment not found', {
                    description: 'The appointment you are trying to reject the patient not joined request for does not exist.'
                })
            } else if (res.statusNotChangeable) {
                toast.error('Cannot perform this action', {
                    description: 'The request might have already been rejected or accepted.'
                })
            } else if (res.markedAsPatientNotJoinedReject) {
                toast.success('Successfully rejected the request');
                this.possibleActionsModal.close();
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while updating the request. Please try again.'
                });
                this.possibleActionsModal.close();
            }
            await this.load({ id: Number(this.selectedObj.id) });
        },
        approve: async () => {
            if (this.selectedObjectForm.loading) return;
            if (!this.selectedObj.id) {
                toast.warning('Please select an appointment first');
                return;
            }
            this.selectedObjectForm.acceptanceLoading = true;
            
            const res = await this.http.sendRequest({
                method: 'PUT',
                url: `/a/appointment/${ this.selectedObj.id }/patient-not-joined/approve`,
            }) as AdminApprovePatientNotJoinedRequestResponse | false;
            
            this.selectedObjectForm.acceptanceLoading = false;
            
            if (!res) {
                return;
            } else if (res.alreadyMarkedAsPatientNotJoined) {
                toast.success('Already accepted the request');
            } else if (res.appointmentNotExists) {
                toast.error('Appointment not found', {
                    description: 'The appointment you are trying to approve the patient not joined request for does' +
                        ' not exist.'
                })
            } else if (res.statusNotChangeable) {
                toast.error('Cannot perform this action', {
                    description: 'The request might have already been approved or rejected.'
                })
            } else if (res.markedAsPatientNotJoined) {
                toast.success('Successfully approved the request');
                this.possibleActionsModal.close();
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while approving the request. Please try again.'
                });
                this.possibleActionsModal.close();
            }
            await this.load({ id: Number(this.selectedObj.id) });
        },
        
    };
    //
    // Proof Videos
    proofVideos = {
        loading: false,
        list: [] as string[],
        selectedVideoIndex: 0,
        playVideo: false,
        selectIndex: (i: number) => {
            this.proofVideos.playVideo = false;
            this.proofVideos.selectedVideoIndex = i;
            console.info(this.proofVideos.list[this.proofVideos.selectedVideoIndex]);
            this.proofVideos.playVideo = true;
        },
        load: async () => {
            if (this.selectedObj.status !== 'PAT_NOT_JOINED_REQ') return;
            this.proofVideos.loading = true;
            this.proofVideos.list = [];
            this.proofVideos.selectedVideoIndex = 0;
            
            const res = await this.http.sendRequest({
                method: 'GET',
                url: `/a/appointment/${ this.selectedObj.id }/patient-not-joined/attempt-videos`,
            }) as AdminGetPatientNotJoinedProofVideosResponse | false;
            
            this.proofVideos.loading = false;
            
            if (!res) {
                return;
            } else if (res.appointmentNotExists) {
                toast.error('Appointment not found', {
                    description: 'The appointment has been deleted or does not exist.'
                });
            } else if (res.statusNotSuitable) {
                toast.error('Appointment has been updated', {
                    description: 'Reloading the appointment'
                });
            } else {
                // transform the video names to video URLs
                res.videos = res.videos.map(v => this.utils.makeOwnServerUrl(this.utils.makeApiUrl(`/video/${ v }`)));
                // res.videos = res.videos.map(v => `/assets/vid/${ v }`);
                this.proofVideos.list = res.videos;
                if (this.proofVideos.list.length === 0) {
                    toast.info('No proof videos found');
                }
                return;
            }
            
            await this.load({ id: Number(this.selectedObj.id) });
        }
    }
    
    
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
        AppointmentsComponent.searched.changeSearch$.pipe(takeUntilDestroyed()).subscribe(() => {
            let list = AppointmentsComponent.searched.list.map(l => l);
            if (list.length === 0) {
                for (const col of this.columns) {
                    if (col?.field) {
                        list.push(col.field);
                    }
                }
            }
            this.html.dataTableSearch(
                this.dataTableInstance,
                AppointmentsComponent.searched.query,
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
        ).addEventListener('rowClick.te.datatable', async ({ row }: { row: { id: number } }) => {
            const { id } = row;
            this.selectedObj = AppointmentsComponent.allObjs.find(p => p.id === id) || this.selectedObj;
            this.proofVideos.load();
            this.possibleActionsModal.open();
        });
    }
    
    
    async load({ id, force }: { id?: number, force?: boolean } = {}) {
        if (AppointmentsComponent.allObjs.length && !id && !force) {
            this.change$.next();
            return;
        }
        
        if (AppointmentsComponent.loading) return;
        
        AppointmentsComponent.loading = true;
        
        let url = '/a/appointments';
        if (id) {
            url = `/a/appointment/${ id }`;
        }
        
        const res = await this.http.sendRequest({
            method: 'GET',
            url: url,
        }) as AdminGetAppointmentsResponse | false;
        
        AppointmentsComponent.loading = false;
        
        if (!res) return;
        
        // convert date strings to Date objects
        res.appointments.forEach(a => {
            a.timeFrom = new Date(a.timeFrom);
            a.timeTo = new Date(a.timeTo);
            a.paymentTime = new Date(a.paymentTime);
            a.statusChangeTime = new Date(a.statusChangeTime);
        });
        
        if (id) {
            if (res.appointments.length === 0) {
                // remove the patient from AllDoctorsComponent.patients
                AppointmentsComponent.allObjs = AppointmentsComponent.allObjs.filter(p => p.id !== id);
            } else {
                // update the patient in AllDoctorsComponent.patients
                const appointment = res.appointments[0];
                const index = AppointmentsComponent.allObjs.findIndex(p => p.id === id);
                if (index !== -1) {
                    AppointmentsComponent.allObjs[index] = appointment;
                } else {
                    AppointmentsComponent.allObjs.push(appointment);
                }
            }
        } else {
            AppointmentsComponent.allObjs = res.appointments;
        }
        
        // update the selected object if it is in the list
        this.selectedObj = AppointmentsComponent.allObjs.find(p => p.id === this.selectedObj.id) ||
            AppointmentsComponent.allObjs[0];
        this.change$.next();
    }
    
    
    searchByUrlQueryParam() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // loop through columns and check if the column is in the url query param
        for (const col of this.columns) {
            if (urlParams.has(col.field)) {
                AppointmentsComponent.searched.list = [col.field];
                AppointmentsComponent.searched.query = urlParams.get(col.field) || '';
                AppointmentsComponent.searched.changeSearch$.next();
                break;
            }
        }
    }
    
    
    updateDataTable() {
        const rows = AppointmentsComponent.allObjs.map(a => [
            a.id,
            a.doctorId,
            a.patientId,
            a.status,
            a.statusChangeTime,
            a.paidAmount,
            a.paymentTime,
            a.refundedAmount,
            a.symptomDescription,
            a.doctorReport,
            a.patientReview,
            a.rating,
            a.delayCountByDoc,
            a.rescheduleCountByPat,
            a.timeFrom,
            a.timeTo,
            a.secretCode,
        ]);
        this.html.updateDataTable(this.dataTableInstance, rows);
    }
}
