import { CommonModule, ViewportScroller, Location } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RatingStarsComponent } from '../../components/rating-stars/rating-stars.component';
import { Router, RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { HtmlService } from '../../services/html.service';
import { Subject } from "rxjs";
import { DoctorAnalytics, DoctorAppointmentSlot, DoctorProfile } from "../../interfaces/interfaces";
import {
    BookAppointmentResponse,
    GetDoctorAnalyticsResponse,
    GetDoctorAppointmentSlotsResponse,
    GetDoctorDetailsResponse
} from "../../interfaces/api-response-interfaces";
import { toast } from "ngx-sonner";
import { HTTPService } from "../../services/http.service";
import { UtilFuncService } from "../../services/util-func.service";
import { AvailabilityTimePipe } from "../../pipes/availability-time.pipe";
import { WeekdayShortPipe } from "../../pipes/weekday-short.pipe";
import { FormBuilder, ReactiveFormsModule, Validators as vl } from "@angular/forms";
import { FormValidatorsService } from "../../services/form-validators.service";
import { AppointmentDurationPipe } from "../../pipes/appointment-duration.pipe";
import { FormSubmitButtonComponent } from "../../components/form-submit-button/form-submit-button.component";
import { FormTextareaComponent } from "../../components/form-textarea/form-textarea.component";
import { FormErrorBoxComponent } from "../../components/form-error-box/form-error-box.component";
import { CookieService } from "ngx-cookie-service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-book',
    standalone: true,
    imports: [
        CommonModule, RatingStarsComponent, RouterLink, AvailabilityTimePipe, WeekdayShortPipe,
        AppointmentDurationPipe, FormSubmitButtonComponent, FormTextareaComponent, ReactiveFormsModule,
        FormErrorBoxComponent
    ],
    templateUrl: './book.component.html',
    styleUrl: './book.component.scss',
})
export class BookComponent implements AfterViewInit {
    //
    // State variables
    doctorId: number = -1;
    doctor = {
        change: new Subject<void>(),
        onLoad: () => {
            return this.doctor.change.asObservable();
        },
        details: {} as DoctorProfile,
        loading: false,
        load: async () => {
            if (this.doctorId === -1) {
                return false;
            }
            
            this.doctor.loading = true;
            
            let res = await this.http.sendRequest({
                method: 'GET',
                url: `/doctor/${ this.doctorId }`,
            }) as GetDoctorDetailsResponse | false;
            
            this.doctor.loading = false;
            
            if (res === false) {
                toast.error('Failed to load doctor details', {
                    description: 'Please try again later',
                });
                this.location.back();
                return false;
            }
            
            if (res.doctorNotFound) {
                toast.error('Doctor does not exist', {
                    description: 'Please try again later',
                });
                this.location.back();
                return false;
            }
            
            this.doctor.details = res.doctor;
            this.doctor.details.coverPicFilename
                = this.utils.makeOwnServerUrl(`/api/file/${ this.doctor.details.coverPicFilename }`);
            this.doctor.details.profilePicFilename
                = this.utils.makeOwnServerUrl(`/api/file/${ this.doctor.details.profilePicFilename }`);
            this.doctor.change.next();
            return true;
        }
    }
    //
    // Doctor Analytics
    analytics = {
        change: new Subject<void>(),
        onLoad: () => {
            return this.analytics.change.asObservable();
        },
        data: {} as DoctorAnalytics,
        avgRating: 0,
        loading: false,
        load: async () => {
            if (this.analytics.loading || this.doctorId === -1) return false;
            
            this.analytics.loading = true;
            
            let res = await this.http.sendRequest({
                method: 'GET',
                url: `/doctor/${ this.doctorId }/analytics`,
            }) as GetDoctorAnalyticsResponse | false;
            
            this.analytics.loading = false;
            
            if (res === false) {
                return false;
            }
            
            if (res.doctorNotFound) {
                toast.error('Doctor not found', {
                    description: 'Please try again later',
                });
                return false;
            }
            
            this.analytics.data = res;
            this.analytics.avgRating = (
                res.ratingAnalytics.rating1Star + res.ratingAnalytics.rating2Star + res.ratingAnalytics.rating3Star +
                res.ratingAnalytics.rating4Star + res.ratingAnalytics.rating5Star
            ) / 5;
            this.analytics.change.next();
            return true;
        }
    }
    //
    // Appointment Slots
    slots = {
        list: [] as DoctorAppointmentSlot[][][],
        selectedWeek: 0,
        selectedSlotDayIndex: 0,
        selectedSlotIndex: -1,
        loading: false,
        selectWeek: (index: number) => {
            this.slots.selectedWeek = index;
        },
        selectSlot: (day: number, index: number) => {
            this.slots.selectedSlotDayIndex = day;
            this.slots.selectedSlotIndex = index;
        },
        load: async () => {
            if (this.doctorId === -1) return false;
            
            this.slots.loading = true;
            
            let res = await this.http.sendRequest({
                method: 'GET',
                url: `/doctor/${ this.doctorId }/appointment-slots`,
            }) as GetDoctorAppointmentSlotsResponse | false;
            
            this.slots.loading = false;
            
            if (res === false) {
                return false;
            }
            
            if (res.doctorNotFound) {
                toast.error('Doctor not found', {
                    description: 'Please try again later',
                });
                return false;
            }
            
            const slots = res.appointmentSlots;
            
            // convert the time strings to Date objects
            slots.forEach((day) => {
                day.forEach((slot) => {
                    slot.forEach((s) => {
                        s.timeFrom = new Date(s.timeFrom);
                        s.timeTo = new Date(s.timeTo);
                    });
                });
            });
            
            this.slots.list = slots;
            console.info('slots loaded', this.slots.list);
            return true;
        }
    }
    //
    // Forms
    //
    // Book appointment form
    bookAppointment = {
        fg: this._fb.group({
            doctorId: [this.doctorId, vl.required],
            timeFrom: ['', vl.required],
            timeTo: ['', vl.required],
            symptomDescription: [
                '', vl.compose([vl.required, vl.minLength(10), vl.maxLength(512), this._fvs.leadingSpaces()])
            ],
        }),
        errors: {
            timeForm: {
                required: 'Please select a time slot',
            },
            timeTo: {
                required: 'Please select a time slot',
            },
            symptomDescription: {
                required: 'Please describe your symptoms',
                minLength: 'Symptom description must be at least 10 characters long',
                maxLength: 'Symptom description must be at most 512 characters long',
                leadingSpaces: 'Symptom description cannot start or end with white spaces',
            }
        },
        loading: false,
        validateAndRaiseErrors: () => {
            if (this.doctorId === -1) {
                if (this.doctor.loading) {
                    toast.warning('Please wait', {
                        description: 'Some data is still loading',
                    });
                } else {
                    toast.error('Could not load some data', {
                        description: 'Please try again later',
                    });
                }
                return;
            }
            this.bookAppointment.fg.controls.doctorId.setValue(this.doctorId);
            
            if (this.slots.selectedSlotIndex !== -1) {
                this.bookAppointment.fg.controls.timeFrom.setValue(this.utils.convertDateToDefinedDateTimeFormat(this.utils.convertLocalDateToUTCDate(
                    this.slots.list[this.slots.selectedWeek][this.slots.selectedSlotDayIndex][this.slots.selectedSlotIndex].timeFrom
                )));
                this.bookAppointment.fg.controls.timeTo.setValue(this.utils.convertDateToDefinedDateTimeFormat(this.utils.convertLocalDateToUTCDate(
                    this.slots.list[this.slots.selectedWeek][this.slots.selectedSlotDayIndex][this.slots.selectedSlotIndex].timeTo
                )));
            }
            
            this.bookAppointment.fg.markAllAsTouched();
            return !this.bookAppointment.fg.invalid;
        },
        submit: async () => {
            if (!this.bookAppointment.validateAndRaiseErrors()) return false;
            
            const data = this.bookAppointment.fg.value;
            
            this.bookAppointment.loading = true;
            
            let res = await this.http.sendRequest({
                method: 'POST',
                url: `/appointment/book`,
                jsonData: data,
            }) as BookAppointmentResponse | false;
            
            this.bookAppointment.loading = false;
            
            if (res === false) return false;
            
            if (res.doctorNotExists) {
                toast.error('Doctor not found', {
                    description: 'Please try again later',
                });
            } else if (res.doctorNotActive) {
                toast.error('Doctor is not active', {
                    description: 'Please try again later',
                });
            } else if (res.invalidSlot) {
                toast.error('Something went wrong', {
                    description: 'Please select your slot again',
                });
                await this.slots.load();
            } else if (res.slotClash) {
                toast.error('Someone else booked the slot', {
                    description: 'Please select another slot',
                });
                await this.slots.load();
            } else if (res.appointmentBooked) {
                toast.success('Please proceed to payment', {
                    description: 'To confirm your appointment booking',
                });
                if (this.cookies.check('AppointmentBookingTempAuthorization')) {
                    this.cookies.delete('AppointmentBookingTempAuthorization', '/');
                }
                this.cookies.set('AppointmentBookingTempAuthorization', res.appointmentToken, 1, '/');
                await this.router.navigate(['p', 'pay'], { queryParams: { d: this.doctorId } });
                return true;
            } else {
                toast.error('Something went wrong', {
                    description: 'Please try again later',
                });
            }
            return false;
        },
    }
    
    
    constructor(
        public common: CommonService,
        private html: HtmlService,
        public scroller: ViewportScroller,
        private router: Router,
        private http: HTTPService,
        private utils: UtilFuncService,
        private location: Location,
        private _fb: FormBuilder,
        private _fvs: FormValidatorsService,
        private cookies: CookieService,
    ) {
        this.fetchFromUrlParams();
        this.doctor.onLoad().pipe(takeUntilDestroyed()).subscribe(() => {
            this.analytics.load();
            this.slots.load();
        });
        
        this.doctor.load();
    }
    
    
    ngAfterViewInit(): void {
        this.html.initTailwindElements();
    }
    
    
    fetchFromUrlParams() {
        let params = this.router.parseUrl(this.router.url).queryParams;
        if (params.hasOwnProperty('d')) {
            this.doctorId = parseInt(params['d'] as string);
        } else {
            this.location.back();
        }
    }
}
