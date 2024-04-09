import { CommonModule, ViewportScroller, Location } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RatingStarsComponent } from '../../../utils/components/rating-stars/rating-stars.component';
import { Router, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HtmlService } from '../../../services/html.service';
import { Subject } from "rxjs";
import { DoctorAnalytics, DoctorAppointmentSlot, DoctorProfile } from "../../../interfaces/interfaces";
import {
    GetDoctorAnalyticsResponse,
    GetDoctorAppointmentSlotsResponse,
    GetDoctorDetailsResponse
} from "../../../interfaces/api-response-interfaces";
import { toast } from "ngx-sonner";
import { HTTPService } from "../../../services/http.service";
import { UtilFuncService } from "../../../services/util-func.service";
import { AvailabilityTimePipe } from "../../../pipes/availability-time.pipe";
import { WeekdayShortPipe } from "../../../pipes/weekday-short.pipe";
import { FormBuilder, Validators as vl } from "@angular/forms";
import { FormValidatorsService } from "../../../services/form-validators.service";

@Component({
    selector: 'app-book',
    standalone: true,
    imports: [CommonModule, RatingStarsComponent, RouterLink, AvailabilityTimePipe, WeekdayShortPipe],
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
        loading: false,
        selectWeek: (index: number) => {
            this.slots.selectedWeek = index;
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
            return true;
        }
    }
    //
    // Forms
    //
    // Book appointment form
    bookAppointment = {
        fg: this._fb.group({
            timeForm: ['', vl.required],
            timeTo: ['', vl.required],
            symptomDescription: ['', vl.required, vl.minLength(10), vl.maxLength(512), this._fvs.leadingSpaces(),],
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
            
            return !this.bookAppointment.fg.invalid;
        },
        submit: async () => {
            if (!this.bookAppointment.validateAndRaiseErrors()) return false;
            
            const data = this.bookAppointment.fg.value;
            
            this.bookAppointment.loading = true;
            
            let res = await this.http.sendRequest({
                method: 'POST',
                url: `/doctor/${ this.doctorId }/appointment`,
                jsonData: data,
            }) as { success: boolean } | false;
            
            this.bookAppointment.loading = false;
            
            if (res === false) {
                return false;
            }
            
            if (res.success) {
                toast.success('Appointment booked successfully', {
                    description: 'You will be notified when the doctor confirms the appointment',
                });
                return true;
            } else {
                toast.error('Failed to book appointment', {
                    description: 'Please try again later',
                });
                return false;
            }
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
    ) {
        this.fetchFromUrlParams();
        this.doctor.onLoad().subscribe(() => {
            this.analytics.load();
            this.slots.load();
        });
        
        this.doctor.load();
    }
    
    
    ngAfterViewInit(): void {
        this.html.initTailwindElements();
        this.scroller.setHistoryScrollRestoration('auto');
        this.scroller.setOffset([300, 300]);
        setTimeout(() => {
            this.scroller.scrollToAnchor('symptomDescriptionInput');
        }, 1500);
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
