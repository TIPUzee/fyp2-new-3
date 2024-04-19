import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { RouterLink } from '@angular/router';
import { HtmlService } from '../../../services/html.service';
import { RatingStarsComponent } from '../../../utils/components/rating-stars/rating-stars.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { ModalComponent } from '../../../utils/components/modal/modal.component';
import { Appointment, AppointmentWithSlots, DoctorAppointmentSlot } from "../../../interfaces/interfaces";
import { AppointmentService } from "../../../services/appointment.service";
import { DatetimePipe } from "../../../pipes/datetime.pipe";
import { AppointmentDurationPipe } from "../../../pipes/appointment-duration.pipe";
import { FormSubmitButtonComponent } from "../../../utils/components/form-submit-button/form-submit-button.component";
import { FormTextareaComponent } from "../../../utils/components/form-textarea/form-textarea.component";
import {
    RatingStarsInteractiveComponent
} from "../../../utils/components/rating-stars-interactive/rating-stars-interactive.component";
import {
    CancelAppointmentResponse,
    GetDoctorAppointmentSlotsResponse,
    RescheduleAppointmentResponse, SubmitPatientReviewResponse
} from "../../../interfaces/api-response-interfaces";
import { toast } from "ngx-sonner";
import { HTTPService } from "../../../services/http.service";
import { FormErrorBoxComponent } from "../../../utils/components/form-error-box/form-error-box.component";
import { WeekdayShortPipe } from "../../../pipes/weekday-short.pipe";
import { UtilFuncService } from "../../../services/util-func.service";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators as vl } from "@angular/forms";
import { FormValidatorsService } from "../../../services/form-validators.service";
import { Subject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

interface AppointmentWithSlotsAndPatientReviewForm extends AppointmentWithSlots {
    patientReviewForm: {
        fg: FormGroup<{ review: FormControl<string | null>, rating: FormControl<number | null> }>,
        errors: {
            review: { required: string, minlength: string, maxlength: string, leadingSpaces: string },
            rating: { required: string, min: string, max: string }
        },
        loading: boolean,
        submit: () => Promise<void>,
        updateRating: (rating: number) => void,
    }
}

@Component({
    selector: 'app-appointments',
    standalone: true,
    imports: [
        CommonModule, RouterLink, RatingStarsComponent, FontAwesomeModule, ModalComponent, DatetimePipe,
        AppointmentDurationPipe, FormSubmitButtonComponent, FormTextareaComponent, RatingStarsInteractiveComponent,
        FormErrorBoxComponent, WeekdayShortPipe, ReactiveFormsModule,
    ],
    templateUrl: './appointments.component.html',
    styleUrl: './appointments.component.scss',
})
export class AppointmentsComponent implements AfterViewInit {
    //
    // State variables
    private destroy$ = new Subject<void>();
    selectedAppointmentId: number = -1;
    selectedAppointmentIndex: number = -1;
    appointments: AppointmentWithSlotsAndPatientReviewForm[] = [];
    selectedSlot: DoctorAppointmentSlot = {
        timeFrom: new Date(),
        timeTo: new Date(),
    }
    //
    // Icons
    faCircleQuestion = faCircleQuestion;
    //
    // Modals
    @ViewChild('rescheduleAppointmentConfirmationModal') rescheduleAppointmentConfirmationModal!: ModalComponent;
    @ViewChild('cancelAppointmentConfirmationModal') cancelAppointmentConfirmationModal!: ModalComponent;
    //
    // Forms
    //
    // Reschedule Appointment
    rescheduleAppointmentForm = {
        loading: false,
        submit: async (appointmentId: number) => {
            this.rescheduleAppointmentForm.loading = true;
            const appointment = await this.getAppointment(appointmentId);
            if (!appointment) return;
            
            const slot = appointment.slots.list[appointment.slots.selectedWeekIndex][
                appointment.slots.selectedDayIndex][appointment.slots.selectedSlotIndex];
            
            console.info('Rescheduling appointment', appointmentId, slot.timeFrom, slot.timeTo);
            let res = await this.http.sendRequest({
                url: `/appointment/${ appointmentId }/reschedule`,
                method: 'PUT',
                jsonData: {
                    timeFrom: this.utils.convertDateToDefinedDateTimeFormat(this.utils.convertLocalDateToUTCDate(slot.timeFrom)),
                    timeTo: this.utils.convertDateToDefinedDateTimeFormat(this.utils.convertLocalDateToUTCDate(slot.timeTo)),
                },
            }) as RescheduleAppointmentResponse | false;
            
            this.rescheduleAppointmentForm.loading = false;
            
            if (res === false) {
                return;
            } else if (res.appointmentNotExists) {
                toast.error('Could not find the appointment', {
                    description: 'Please try again later.'
                });
            } else if (res.notReschedulable) {
                toast.error('Appointment cannot be rescheduled', {
                    description: 'Please try again later.'
                });
            } else if (res.doctorNotExists) {
                toast.error('Could not find the doctor', {
                    description: 'Please try again later.'
                });
                return;
            } else if (res.doctorNotActive) {
                toast.error('Doctor is not active for appointments', {
                    description: 'Please try again later.'
                });
                return;
            } else if (res.invalidSlot) {
                toast.error('Invalid slot selected', {
                    description: 'Please try again.'
                });
                await this.loadAppointmentSlots(appointmentId);
                return;
            } else if (res.slotClash) {
                toast.error('Selected slot clashes with another appointment', {
                    description: 'Please try again.'
                });
                await this.loadAppointmentSlots(appointmentId);
                return;
            } else if (res.maxRescheduleReached) {
                toast.error('Maximum rescheduling limit reached', {
                    description: 'The appointment cannot be rescheduled anymore.'
                });
            } else if (res.rescheduled) {
                toast.success('Appointment rescheduled successfully');
            }
            
            this.rescheduleAppointmentConfirmationModal.close();
            await this.allAppointments.load({ id: [appointmentId] })
        },
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
                toast.error('You have already canceled this appointment');
            } else if (res.alreadyCancelledByDoc) {
                toast.error('The doctor has already canceled the Appointment');
            } else if (res.notCancelable) {
                toast.error('Appointment is not cancelable');
            } else if (res.cancelOperationDone) {
                toast.success('Appointment cancelled');
            } else {
                toast.error('Failed to cancel appointment');
                return;
            }
            
            this.cancelAppointmentConfirmationModal.close();
            await this.allAppointments.load({ id: [this.selectedAppointmentId] });
        }
    }
    
    
    constructor(
        public common: CommonService,
        private allAppointments: AppointmentService,
        private html: HtmlService,
        private http: HTTPService,
        private utils: UtilFuncService,
        private _fb: FormBuilder,
        private _fvs: FormValidatorsService,
    ) {
        this.appointments = this.sortAppointmentsByDate(this.makeAppointmentsWithSlots(this.allAppointments.list))
        this.allAppointments.change$.pipe(takeUntilDestroyed()).subscribe(() => {
            this.appointments = this.sortAppointmentsByDate(this.makeAppointmentsWithSlots(this.allAppointments.list));
            this.html.initTailwindElements();
        })
    }
    
    
    ngAfterViewInit(): void {
        this.html.initTailwindElements();
    }
    
    
    async getAppointment(appointmentId: number) {
        const appointment = this.appointments.find((a) => a.id === appointmentId);
        if (!appointment) {
            await this.allAppointments.load({ id: [appointmentId] });
            if (!this.allAppointments.list.find((a) => a.id === appointmentId)) {
                toast.error('Could not find the appointment', {
                    description: 'Please try again later.'
                });
            } else {
                toast.warning('Please try again');
            }
            this.rescheduleAppointmentForm.loading = false;
            return undefined;
        }
        return appointment;
    }
    
    
    getAppointmentReviewForm(appointmentId: number) {
        const form = {
            fg: this._fb.group({
                review: [
                    '', vl.compose([
                        vl.required,
                        vl.minLength(10),
                        vl.maxLength(500),
                        this._fvs.leadingSpaces(),
                    ])
                ],
                rating: [
                    0, vl.compose([
                        vl.required,
                        vl.min(1),
                        vl.max(5),
                    ])
                ],
            }),
            errors: {
                review: {
                    required: 'Review is required',
                    minlength: 'Review must be at least 10 characters long',
                    maxlength: 'Review cannot be more than 500 characters long',
                    leadingSpaces: 'Leading spaces are not allowed',
                },
                rating: {
                    required: 'Rating is required',
                    min: 'Rating is required',
                    max: 'Rating is required',
                },
            },
            loading: false,
            submit: async () => {},
            updateRating: (rating: number) => {},
        }
        
        const validateAndShowMsgs = () => {
            form.fg.markAllAsTouched();
            form.fg.updateValueAndValidity();
            if (form.fg.invalid) {
                toast.error('Please fill in the required fields correctly');
                return false;
            }
            return true;
        }
        
        form.updateRating = (rating: number) => {
            form.fg.controls.rating.setValue(rating);
        }
        
        form.submit = async () => {
            form.loading = true;
            
            if (!validateAndShowMsgs()) {
                form.loading = false;
                return;
            }
            
            let res = await this.http.sendRequest({
                url: `/appointment/${ appointmentId }/review`,
                method: 'PUT',
                jsonData: {
                    review: form.fg.value.review,
                    rating: form.fg.value.rating,
                }
            }) as SubmitPatientReviewResponse | false;
            
            form.loading = false;
            
            if (res === false) return;
            
            if (res.appointmentNotExists) {
                toast.error('Appointment does not exist');
            } else if (res.alreadyReviewed) {
                toast.error('You have already reviewed this appointment');
            } else if (res.cannotReview) {
                toast.error('You cannot review this appointment');
            } else if (res.reviewedSuccessfully) {
                toast.success('Review submitted successfully');
            }
            
            await this.allAppointments.load({ id: [appointmentId] });
        };
        
        return form;
    }
    
    
    async loadAppointmentSlots(appointmentId: number) {
        const appointment = this.appointments.find((a) => a.id === appointmentId);
        if (!appointment) {
            await this.allAppointments.load({ id: [appointmentId] });
            return false;
        }
        
        if (appointment.status !== 'DOC_REQUESTED_DELAY' && appointment.status !== 'DOC_NOT_JOINED' &&
            appointment.status !== 'SLOT_CLASH') {
            return false;
        }
        
        this.updateAppointmentSlotsAndStatus(appointmentId, [], 'LOADING');
        
        let res = await this.http.sendRequest({
            method: 'GET',
            url: `/doctor/${ appointment.doctorId }/appointment-slots`,
        }) as GetDoctorAppointmentSlotsResponse | false;
        
        if (res === false) {
            this.updateAppointmentSlotsAndStatus(appointmentId, [], 'ERROR');
            return false;
        }
        
        if (res.doctorNotFound) {
            toast.error('Could not find the doctor', {
                description: 'Please try again later.'
            });
            this.updateAppointmentSlotsAndStatus(appointmentId, [], 'NOT_FOUND');
        } else if (res.doctorNotActive) {
            toast.error('Doctor is not active for appointments', {
                description: 'Please try again later.'
            });
            this.updateAppointmentSlotsAndStatus(appointmentId, [], 'DOC_NOT_ACTIVE');
        } else {
            const slots = res.appointmentSlots;
            
            slots.forEach((day) => {
                day.forEach((slot) => {
                    slot.forEach((s) => {
                        s.timeFrom = new Date(s.timeFrom);
                        s.timeTo = new Date(s.timeTo);
                    });
                });
            });
            
            this.updateAppointmentSlotsAndStatus(appointmentId, slots, 'FOUND');
        }
        
        return !(
            res.doctorNotActive || res.doctorNotFound
        );
    }
    
    
    makeAppointmentsWithSlots(appointments: Appointment[]): AppointmentWithSlotsAndPatientReviewForm[] {
        return appointments.map((appointment) => {
            return {
                ...appointment,
                slots: {
                    status: 'LOADING',
                    list: [],
                    selectedWeekIndex: 0,
                    selectedDayIndex: 0,
                    selectedSlotIndex: 0,
                },
                patientReviewForm: this.getAppointmentReviewForm(appointment.id),
            };
        });
    }
    
    
    async openRescheduleAppointmentModalConditionally(appointmentId: number) {
        const appointment = await this.getAppointment(appointmentId);
        if (!appointment) return;
        
        if (appointment.slots.status === 'LOADING') {
            return;
        }
        
        if (!appointment.slots.list[appointment.slots.selectedWeekIndex]) {
            toast.error('Please select an appointment slot');
            return;
        }
        
        if (!appointment.slots.list[appointment.slots.selectedWeekIndex][appointment.slots.selectedDayIndex]) {
            return;
        }
        
        if (!appointment.slots.list[appointment.slots.selectedWeekIndex][appointment.slots.selectedDayIndex][
            appointment.slots.selectedSlotIndex]) {
            return;
        }
        
        this.rescheduleAppointmentConfirmationModal.open();
    }
    
    
    async refreshSelectedSlot(appointmentId: number) {
        const appointment = await this.getAppointment(appointmentId);
        if (!appointment) return;
        
        if (appointment.slots.status === 'LOADING') {
            return;
        }
        
        if (!appointment.slots.list[appointment.slots.selectedWeekIndex]) {
            toast.error('Please select an appointment slot');
            return;
        }
        
        if (!appointment.slots.list[appointment.slots.selectedWeekIndex][appointment.slots.selectedDayIndex]) {
            toast.error('Please select an appointment slot');
            return;
        }
        
        if (!appointment.slots.list[appointment.slots.selectedWeekIndex][appointment.slots.selectedDayIndex][
            appointment.slots.selectedSlotIndex]) {
            toast.error('Please select an appointment slot');
            return;
        }
        
        this.selectedSlot = appointment.slots.list[appointment.slots.selectedWeekIndex][
            appointment.slots.selectedDayIndex][appointment.slots.selectedSlotIndex];
    }
    
    
    async selectAppointment(appointmentId: number) {
        this.selectedAppointmentId = appointmentId;
        for (let i = 0; i < this.appointments.length; i++) {
            if (this.appointments[i].id === appointmentId) {
                this.selectedAppointmentIndex = i;
                break;
            }
        }
    }
    
    
    selectSlot(appointmentId: number, dayIndex: number, slotIndex: number) {
        for (let i = 0; i < this.appointments.length; i++) {
            if (this.appointments[i].id === appointmentId) {
                this.appointments[i].slots.selectedDayIndex = dayIndex;
                this.appointments[i].slots.selectedSlotIndex = slotIndex;
                break;
            }
        }
    }
    
    
    selectSlotWeek(appointmentId: number, weekIndex: number) {
        for (let i = 0; i < this.appointments.length; i++) {
            if (this.appointments[i].id === appointmentId) {
                this.appointments[i].slots.selectedWeekIndex = weekIndex;
                break;
            }
        }
    }
    
    
    sortAppointmentsByDate(appointments: AppointmentWithSlotsAndPatientReviewForm[]) {
        return appointments.sort((a, b) => {
            return b.timeFrom.getTime() - a.timeFrom.getTime();
        });
    }
    
    
    updateAppointmentSlotsAndStatus(
        appointmentId: number,
        slots: DoctorAppointmentSlot[][][],
        status: AppointmentWithSlots['slots']['status']
    ) {
        for (let i = 0; i < this.appointments.length; i++) {
            if (this.appointments[i].id === appointmentId) {
                this.appointments[i].slots.list = slots;
                this.appointments[i].slots.status = status;
                break;
            }
        }
    }
}
