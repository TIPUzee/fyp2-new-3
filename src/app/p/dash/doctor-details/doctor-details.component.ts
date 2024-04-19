import { CommonModule, Location, NgOptimizedImage } from '@angular/common';
import { AfterViewInit, Component, Input, OnChanges, ViewChild } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HtmlService } from '../../../services/html.service';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { UtilFuncService } from '../../../services/util-func.service';
import { DoctorAnalytics, DoctorAppointmentSlot, DoctorProfile, DoctorReviews } from "../../../interfaces/interfaces";
import { HTTPService } from "../../../services/http.service";
import {
    GetDoctorAnalyticsResponse, GetDoctorAppointmentSlotsResponse,
    GetDoctorDetailsResponse,
    GetDoctorReviewsResponse
} from "../../../interfaces/api-response-interfaces";
import { toast } from "ngx-sonner";
import { LocalImageFileComponent } from "../../../utils/components/local-image-file/local-image-file.component";
import { AvailabilityTimePipe } from "../../../pipes/availability-time.pipe";
import { MonthYearPipe } from "../../../pipes/month-year.pipe";
import { WeekdayShortPipe } from "../../../pipes/weekday-short.pipe";
import { InViewportDirective, InViewportModule } from 'ng-in-viewport';
import { DatetimePipe } from "../../../pipes/datetime.pipe";
import { AgChartsAngular } from 'ag-charts-angular';
import { AgChartOptions } from 'ag-charts-community';
import { agChartBackgroundConfig } from "../../../configs/agchart-options";
import { Subject } from "rxjs";
import { RatingStarsComponent } from "../../../utils/components/rating-stars/rating-stars.component";
import { AppointmentDurationPipe } from "../../../pipes/appointment-duration.pipe";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-doctor-details',
    standalone: true,
    imports: [
        CommonModule, RatingStarsComponent, RouterLink, FontAwesomeModule,
        NgOptimizedImage, LocalImageFileComponent, AvailabilityTimePipe, MonthYearPipe, WeekdayShortPipe,
        InViewportModule, InViewportDirective, DatetimePipe, AgChartsAngular, RatingStarsComponent,
        AppointmentDurationPipe
    ],
    templateUrl: './doctor-details.component.html',
    styleUrl: './doctor-details.component.scss',
})
export class DoctorDetailsComponent implements AfterViewInit, OnChanges {
    //
    // icons
    faAngleDown = faAngleDown;
    //
    // Inputs
    @Input({ required: false }) doctorId: number = -1;
    //
    // State variables
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
    // Forms
    //
    // Load Patient Reviews
    patientReviews = {
        list: [] as DoctorReviews[],
        nextOffset: 0,
        limitPerLoad: 0,
        loadMoreTriggerIndex: 0,
        noMore: false,
        loading: false,
        loadMore: async ({ visible }: { visible: boolean }) => {
            if (!visible || this.patientReviews.noMore || this.doctorId === -1) {
                return;
            }
            
            if (this.patientReviews.loading) {
                return;
            }
            
            this.patientReviews.loading = true;
            
            let res = await this.http.sendRequest({
                method: 'GET',
                url: `/doctor/${ this.doctorId }/reviews/${ this.patientReviews.nextOffset }`,
            }) as GetDoctorReviewsResponse | false;
            
            this.patientReviews.loading = false;
            
            if (res === false) {
                return;
            }
            
            // loop through the res.list and transform the data
            res.list = res.list.map((review) => {
                return {
                    ...review,
                    timeTo: new Date(review.timeTo),
                };
            });
            
            this.patientReviews.nextOffset = res.nextOffset;
            this.patientReviews.limitPerLoad = res.limitPerLoad;
            
            let newReviewsLength = res.list.length;
            
            let newList = this.patientReviews.list;
            
            newList.push(...res.list);
            
            // Remove duplicates from newList
            newList = newList.filter((review, index, self) => self.findIndex((r) => r.patientReview ===
                review.patientReview) === index);
            
            if (newReviewsLength < res.limitPerLoad) {
                this.patientReviews.noMore = true;
            }
            
            let triggerIndex = this.patientReviews.list.length - 2;
            if (triggerIndex < 0) {
                triggerIndex = 0;
            }
            this.patientReviews.loadMoreTriggerIndex = triggerIndex;
            this.patientReviews.list = newList;
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
            this.analytics.change.next();
            return true;
        }
    }
    //
    // Chart elements
    @ViewChild('nbOfAppointmentsChartEle') nbOfAppointmentsChartEle!: AgChartsAngular;
    @ViewChild('reviewRatingChartEle') reviewRatingChartEle!: AgChartsAngular;
    //
    // Charts
    //
    // Appointments Chart
    nbOfAppointmentsChart = {
        options: {
            ...agChartBackgroundConfig,
            title: {
                text: 'Appointments in last 12 weeks',
            },
            data: [
                {
                    week: 1,
                    completedAppoints: 30,
                    docCancelledAppoints: 2,
                    docNotJoinedAppoints: 5,
                },
                {
                    week: 2,
                    completedAppoints: 20,
                    docCancelledAppoints: 13,
                    docNotJoinedAppoints: 8,
                },
            ],
            series: [
                {
                    type: 'line',
                    xKey: 'week',
                    yKey: 'completedAppoints',
                    title: 'Completed',
                    // tooltip,
                },
                {
                    type: 'line',
                    xKey: 'week',
                    yKey: 'docCancelledAppoints',
                    title: 'Doctor Cancelled',
                    // tooltip,
                },
                {
                    type: 'line',
                    xKey: 'week',
                    yKey: 'docNotJoinedAppoints',
                    title: 'Missed',
                    // tooltip,
                },
            ],
            axes: [
                {
                    position: 'bottom',
                    reversed: true,
                    type: 'number',
                    label: {
                        formatter: (params) => {
                            return `Week ${ this.analytics.data.nbOfAppointAnalytics.weeks - params.value + 1 }`;
                        }
                    },
                },
                {
                    position: 'left',
                    type: 'number',
                },
            ],
        } as AgChartOptions,
        refreshData: () => {
            console.info('loading chart data');
            if (!this.analytics) return;
            this.nbOfAppointmentsChart.options.data
                = this.analytics.data.nbOfAppointAnalytics.completedAppoints.weekVice.map((completed, index) => {
                return {
                    week: index + 1,
                    completedAppoints: completed,
                    docCancelledAppoints: this.analytics.data.nbOfAppointAnalytics.docCancelledAppoints.weekVice[index],
                    docNotJoinedAppoints: this.analytics.data.nbOfAppointAnalytics.docNotJoinedAppoints.weekVice[index],
                };
            });
            console.info('loaded chart data', this.nbOfAppointmentsChart.options.data);
            this.nbOfAppointmentsChartEle.ngOnChanges(() => {});
        }
    };
    //
    // Review Ratings Chart
    reviewRatingChart = {
        options: {
            data: [
                { stars: 'Poor', rating: 0 },
                { stars: 'Fair', rating: 0 },
                { stars: 'Good', rating: 0 },
                { stars: 'Very Good', rating: 0 },
                { stars: 'Excellent', rating: 0 },
            ],
            title: {
                text: 'Ratings in last 4 weeks',
            },
            series: [
                {
                    type: 'bar', xKey: 'stars', yKey: 'rating', cornerRadius: 5
                }
            ],
            ...agChartBackgroundConfig,
        } as AgChartOptions,
        avgRating: 0,
        refreshData: () => {
            console.info('loading chart data');
            if (!this.analytics) return;
            this.reviewRatingChart.options.data = [
                { stars: 'Poor', rating: this.analytics.data.ratingAnalytics.rating1Star },
                { stars: 'Fair', rating: this.analytics.data.ratingAnalytics.rating2Star },
                { stars: 'Good', rating: this.analytics.data.ratingAnalytics.rating3Star },
                { stars: 'Very Good', rating: this.analytics.data.ratingAnalytics.rating4Star },
                { stars: 'Excellent', rating: this.analytics.data.ratingAnalytics.rating5Star },
            ];
            this.reviewRatingChartEle.options = this.reviewRatingChart.options;
            this.reviewRatingChartEle.ngOnChanges(() => {});
            this.reviewRatingChart.avgRating = this.analytics.data.ratingAnalytics.totalAppointments === 0 ? 0 :
                (this.analytics.data.ratingAnalytics.rating1Star + this.analytics.data.ratingAnalytics.rating2Star * 2 +
                    this.analytics.data.ratingAnalytics.rating3Star * 3 + this.analytics.data.ratingAnalytics.rating4Star * 4 +
                    this.analytics.data.ratingAnalytics.rating5Star * 5) / this.analytics.data.ratingAnalytics.totalAppointments;
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
            console.log('slots list transformed', this.slots.list);
            return true;
        }
    }
    //
    // Constructor
    constructor(
        protected common: CommonService,
        private html: HtmlService,
        protected utils: UtilFuncService,
        private http: HTTPService,
        private location: Location,
        private router: Router,
    ) {
        this.doctor.onLoad().pipe(takeUntilDestroyed()).subscribe(async () => {
            this.analytics.load();
            this.slots.load();
        })
        this.analytics.onLoad().pipe(takeUntilDestroyed()).subscribe(async () => {
            this.reviewRatingChart.refreshData();
            this.nbOfAppointmentsChart.refreshData();
        })
        
        this.fetchFromUrlParams();
    }
    
    
    async ngAfterViewInit() {
        await this.doctor.load();
        this.html.initTailwindElements();
    }
    
    
    async ngOnChanges() {
        await this.doctor.load();
        this.html.initTailwindElements();
    }
    
    
    fetchFromUrlParams() {
        let params = this.router.parseUrl(this.router.url).queryParams;
        if (params.hasOwnProperty('d')) {
            this.doctorId = parseInt(params['d'] as string);
        }
    }
}
