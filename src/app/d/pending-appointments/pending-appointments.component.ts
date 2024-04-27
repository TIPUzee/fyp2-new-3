import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HtmlService } from '../../services/html.service';
import { RatingStarsComponent } from '../../components/rating-stars/rating-stars.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AppointmentService } from "../../services/appointment.service";
import { FormSubmitButtonComponent } from "../../components/form-submit-button/form-submit-button.component";
import { ModalComponent } from "../../components/modal/modal.component";
import { FormTextareaComponent } from "../../components/form-textarea/form-textarea.component";
import { FormBuilder, ReactiveFormsModule, Validators as vl } from "@angular/forms";
import { FormInputComponent } from "../../components/form-input/form-input.component";
import { HTTPService } from "../../services/http.service";
import {
    MarkAppointmentAsCompletedResponse,
    DelayAppointmentResponse,
    DoctorNotJoinedAppointmentResponse, CancelAppointmentResponse, PatientNotJoinedAppointmentResponse
} from "../../interfaces/api-response-interfaces";
import { toast } from "ngx-sonner";
import { Appointment } from "../../interfaces/interfaces";
import { AppointmentDurationPipe } from "../../pipes/appointment-duration.pipe";
import { FormValidatorsService } from "../../services/form-validators.service";
import { FormFileInputComponent } from "../../components/form-file-input/form-file-input.component";
import { VideoExtensions } from "../../constants/constants";
import { DatetimePipe } from "../../pipes/datetime.pipe";
import { DobPipe } from "../../pipes/dob.pipe";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-pending-appointments',
    standalone: true,
    imports: [
        CommonModule, RouterLink, RatingStarsComponent, FontAwesomeModule, FormSubmitButtonComponent,
        ModalComponent, FormTextareaComponent, ReactiveFormsModule, FormInputComponent, AppointmentDurationPipe,
        FormFileInputComponent, DatetimePipe, DobPipe
    ],
    templateUrl: './pending-appointments.component.html',
    styleUrl: './pending-appointments.component.scss',
})
export class PendingAppointmentsComponent implements AfterViewInit {
    //
    // State variables
    selectedAppointmentId: number = -1;
    appointments: Appointment[] = [];
    //
    // Reusable variables
    readonly videoExtensions = VideoExtensions.join(', ');
    //
    // Popup modals
    @ViewChild('markAppointmentAsCompletedModal') markAppointmentAsCompletedModal!: ModalComponent;
    @ViewChild('appointmentDelayConfirmationModal') appointmentDelayConfirmationModal!: ModalComponent;
    @ViewChild('doctorCouldNotJoinConfirmationModal') doctorCouldNotJoinConfirmationModal!: ModalComponent;
    @ViewChild('cancelAppointmentConfirmationModal') cancelAppointmentConfirmationModal!: ModalComponent;
    @ViewChild('patientDidntJoinSubmitModal') patientDidntJoinSubmitModal!: ModalComponent;
    //
    // Forms
    //
    // Mark as completed
    markAsCompletedForm = {
        fg: this._fb.group({
            doctorReport: ['', vl.compose([vl.required, vl.maxLength(768)])],
            secretCode: ['', vl.compose([vl.required])],
        }),
        errors: {
            doctorReport: {
                required: 'Please provide a report',
                maxLength: 'Report is too long',
            },
            secretCode: {
                required: 'Please provide the appointment secret code',
            },
        },
        waiting: false,
        submit: async () => {
            this.markAsCompletedForm.fg.markAllAsTouched();
            let appointmentId = this.selectedAppointmentId;
            
            if (this.markAsCompletedForm.fg.invalid) {
                toast.error('Please fill all the fields correctly');
            }
            
            let data = this.markAsCompletedForm.fg.value;
            // @ts-ignore
            data['appointmentId'] = appointmentId;
            
            this.markAsCompletedForm.waiting = true;
            
            let res = await this.http.sendRequest({
                url: '/appointments/mark-as-completed',
                method: 'PUT',
                jsonData: data,
            }) as MarkAppointmentAsCompletedResponse | false;
            
            this.markAsCompletedForm.waiting = false;
            
            if (res === false) {
                toast.error('Failed to mark appointment as completed', {
                    description: 'Please try again later'
                });
                return;
            }
            
            if (res.appointmentNotExists) {
                toast.error('Appointment does not exist');
            } else if (res.invalidSecretCode) {
                toast.error('Wrong appointment secret code', {
                    description: 'Please provide the correct secret code you received from the patient'
                });
                return;
            } else if (res.notCompletable) {
                toast.error('Appointment is not completable');
            } else if (res.alreadyCompleted) {
                toast.error('Appointment is already completed');
            } else if (res.markedAsCompleted) {
                toast.success('Appointment completed');
            } else {
                toast.error('Failed to mark appointment as completed');
                console.error('Error occurred while sending request to /appointments/mark-as-completed', data, res);
            }
            
            this.markAppointmentAsCompletedModal.close();
            await this.allAppointments.load({ id: [appointmentId] });
        },
    }
    //
    // Delay appointment
    delayAppointmentForm = {
        waiting: false,
        submit: async () => {
            let data = { appointmentId: this.selectedAppointmentId };
            
            this.delayAppointmentForm.waiting = true;
            
            let res = await this.http.sendRequest({
                url: '/appointments/delay',
                method: 'PUT',
                jsonData: data,
            }) as DelayAppointmentResponse | false;
            
            this.delayAppointmentForm.waiting = false;
            if (res === false) {
                toast.error('Failed to delay appointment', {
                    description: 'Please try again later'
                });
                return;
            }
            
            if (res.appointmentNotExists) {
                toast.error('Appointment does not exist');
            } else if (res.notDelayable) {
                toast.error('Appointment is not delayable');
            } else if (res.alreadyDelayed) {
                toast.error('Appointment is already delayed');
            } else if (res.maxDelayReached) {
                toast.error('Maximum delay limit reached');
            } else if (res.delayed) {
                toast.success('Appointment delayed');
            } else {
                toast.error('Failed to delay appointment');
                console.error('Error occurred while sending request to /appointments/delay', data, res);
            }
            
            this.appointmentDelayConfirmationModal.close();
            await this.allAppointments.load({ id: [data.appointmentId] });
        }
    }
    //
    // Doctor Could not join
    doctorCouldNotJoinForm = {
        waiting: false,
        submit: async () => {
            let data = { appointmentId: this.selectedAppointmentId };
            
            this.doctorCouldNotJoinForm.waiting = true;
            
            let res = await this.http.sendRequest({
                url: '/appointments/doctor-not-joined',
                method: 'PUT',
                jsonData: data,
            }) as DoctorNotJoinedAppointmentResponse | false;
            
            this.doctorCouldNotJoinForm.waiting = false;
            
            if (res === false) {
                toast.error('Failed to mark appointment as doctor-details not joined', {
                    description: 'Please try again later'
                });
                return;
            } else if (res.appointmentNotExists) {
                toast.error('Appointment does not exist');
            } else if (res.alreadyMarkedAsDoctorNotJoined) {
                toast.error('Appointment is already marked as doctor-details not joined');
            } else if (res.statusNotChangeable) {
                toast.error('This operation is not allowed on this appointment');
            } else if (res.markedAsDoctorNotJoined) {
                toast.success('Your meeting absence has been recorded');
            } else {
                toast.error('Failed to mark appointment as doctor-details not joined');
                console.error(
                    'Error occurred while sending request to /appointments/doctor-details-not-joined',
                    data,
                    res
                );
            }
            
            this.doctorCouldNotJoinConfirmationModal.close();
            await this.allAppointments.load({ id: [data.appointmentId] });
        }
    }
    //
    // Patient did not join
    patientDidntJoinForm = {
        fg: this._fb.group({
            attempt1Video: [
                new File([], ''), vl.compose([
                    vl.required, this._fvs.videoFile(), this._fvs.fileMaxSize(10)
                ])
            ],
            attempt2Video: [
                new File([], ''), vl.compose([
                    vl.required, this._fvs.videoFile(), this._fvs.fileMaxSize(10)
                ])
            ],
        }),
        waiting: false,
        errors: {
            attempt1Video: {
                required: 'Please provide a video file',
                videoFile: 'Please provide a valid video file',
                fileMaxSize: 'File size exceeds 10MB limit',
            },
            attempt2Video: {
                required: 'Please provide a video file',
                videoFile: 'Please provide a valid video file',
                fileMaxSize: 'File size exceeds 10MB limit',
            }
        },
        submit: async () => {
            this.patientDidntJoinForm.fg.markAllAsTouched();
            if (this.patientDidntJoinForm.fg.invalid) {
                toast.warning('Please fill all the fields correctly');
                return;
            }
            
            let files = {
                attempt1Video: this.patientDidntJoinForm.fg.controls.attempt1Video.value as File,
                attempt2Video: this.patientDidntJoinForm.fg.controls.attempt2Video.value as File,
            };
            
            this.patientDidntJoinForm.waiting = true;
            
            const res = await this.http.sendMultipartRequest({
                url: '/appointments/patient-not-joined',
                method: 'POST',
                jsonData: { appointmentId: this.selectedAppointmentId },
                files: files
            }) as PatientNotJoinedAppointmentResponse | false;
            
            this.patientDidntJoinForm.waiting = false;
            
            if (res === false) return;
            
            if (res.appointmentNotExists) {
                toast.error('Appointment does not exist');
            } else if (res.statusNotChangeable) {
                toast.error('This operation is not allowed on this appointment');
            } else if (res.attempt1VideoNotUploaded) {
                toast.error('Attempt 1 video not uploaded');
                return;
            } else if (res.attempt2VideoNotUploaded) {
                toast.error('Attempt 2 video not uploaded');
                return;
            } else if (res.attempt1VideoNotVideo) {
                toast.error('Attempt 1 video is not a video file');
                return;
            } else if (res.attempt2VideoNotVideo) {
                toast.error('Attempt 2 video is not a video file');
                return;
            } else if (res.attempt1VideoSizeExceeded) {
                toast.error('Attempt 1 video size exceeded');
                return;
            } else if (res.attempt2VideoSizeExceeded) {
                toast.error('Attempt 2 video size exceeded');
                return;
            } else if (res.requestAlreadyApproved) {
                toast.error('Request already approved');
            } else if (res.requestAlreadyRejected) {
                toast.error('Request already rejected');
            } else if (res.requestAlreadySubmitted) {
                toast.error('Request already submitted');
            } else if (res.requestSubmitted) {
                toast.success('Patient\'s absence request submitted');
            } else {
                toast.error('Failed to submit request');
                return;
            }
            
            this.patientDidntJoinForm.fg.reset();
            this.patientDidntJoinSubmitModal.close();
            await this.allAppointments.load({ id: [this.selectedAppointmentId] });
        }
    }
    //
    // Cancel Appointment
    cancelAppointmentForm = {
        waiting: false,
        submit: async () => {
            this.cancelAppointmentForm.waiting = true;
            
            let res = await this.http.sendRequest({
                url: '/appointments/cancel',
                method: 'PUT',
                jsonData: { appointmentId: this.selectedAppointmentId }
            }) as CancelAppointmentResponse | false;
            
            this.cancelAppointmentForm.waiting = false;
            
            if (res === false) return;
            
            if (res.appointmentNotExists) {
                toast.error('Appointment does not exist');
            } else if (res.alreadyCancelledByPat) {
                toast.error('Appointment is already cancelled by patient');
            } else if (res.alreadyCancelledByDoc) {
                toast.error('You have already cancelled this appointment');
            } else if (res.notCancelable) {
                toast.error('Appointment is not cancelable');
            } else if (res.cancelOperationDone) {
                toast.success('Appointment cancelled');
            } else {
                toast.error('Failed to cancel appointment');
                console.error('Error occurred while sending request to /appointments/cancel', res);
                return;
            }
            
            this.cancelAppointmentConfirmationModal.close();
            await this.allAppointments.load({ id: [this.selectedAppointmentId] });
        }
    }
    
    
    constructor(
        protected html: HtmlService,
        protected allAppointments: AppointmentService,
        private _fb: FormBuilder,
        private _fvs: FormValidatorsService,
        private http: HTTPService,
    ) {
        this.allAppointments.change$.pipe(takeUntilDestroyed()).subscribe(() => {
            this.appointments = this.allAppointments.list.filter((appointment) => appointment.status === 'PENDING');
            this.html.initTailwindElements();
        })
    }
    
    
    ngAfterViewInit(): void {
        this.appointments = this.allAppointments.list.filter((appointment) => appointment.status === 'PENDING');
        this.html.initTailwindElements();
    }
    
    
    selectAppointment(appointmentId: number) {
        this.selectedAppointmentId = appointmentId;
    }
}
