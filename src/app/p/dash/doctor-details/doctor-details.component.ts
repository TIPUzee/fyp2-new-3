import { CommonModule, Location, NgOptimizedImage } from '@angular/common';
import { AfterViewInit, Component, Input, OnChanges, ViewChild } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { RatingStarsComponent } from '../../compo/rating-stars/rating-stars.component';
import { HtmlService } from '../../../services/html.service';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { AgChartsAngular, AgChartsAngularModule } from 'ag-charts-angular';
import {
    AgBarSeriesOptions,
    AgChartCaptionOptions,
    AgChartLegendOptions,
    AgChartOptions,
    AgCharts,
    AgLineSeriesOptions,
} from 'ag-charts-community';
import { UtilFuncService } from '../../../services/util-func.service';
import { DoctorProfile, DoctorReviews } from "../../../interfaces/interfaces";
import { HTTPService } from "../../../services/http.service";
import { GetDoctorDetailsResponse, GetDoctorReviewsResponse } from "../../../interfaces/api-response-interfaces";
import { toast } from "ngx-sonner";
import { LocalImageFileComponent } from "../../../utils/components/local-image-file/local-image-file.component";
import { AvailabilityTimePipe } from "../../../pipes/availability-time.pipe";
import { MonthYearPipe } from "../../../pipes/month-year.pipe";
import { WeekdayShortPipe } from "../../../pipes/weekday-short.pipe";
import { InViewportModule } from 'ng-in-viewport';
import { InViewportDirective } from 'ng-in-viewport';
import { DatetimePipe } from "../../../pipes/datetime.pipe";

@Component({
    selector: 'app-doctor-details',
    standalone: true,
    imports: [
        CommonModule, RatingStarsComponent, RouterLink, FontAwesomeModule, AgChartsAngularModule,
        NgOptimizedImage, LocalImageFileComponent, AvailabilityTimePipe, MonthYearPipe, WeekdayShortPipe,
        InViewportModule, InViewportDirective, DatetimePipe
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
    doctor!: DoctorProfile;
    //
    // AgCharts Component Elements
    @ViewChild('chartThreeMonthsAppointments') chartThreeMonthsAppointments!: AgChartsAngular;
    @ViewChild('chartLast3WeekRating') chartLast3WeekRating!: AgChartsAngular;
    @ViewChild('chartLast3WeekRating') chartAllTimeRating!: AgChartsAngular;
    //
    // Image elements
    //
    // AgCharts Options
    chartThreeMonthsAppointmentsOptions!: AgChartOptions;
    chartAllTimeRatingOptions!: AgChartOptions;
    chartLast3WeekRatingOptions!: AgChartOptions;
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
            console.info('Load more reviews', visible, this.patientReviews.noMore);
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
            newList = newList.filter((review, index, self) => self.findIndex((r) => r.patientReview === review.patientReview) === index);
            
            if (newReviewsLength < res.limitPerLoad) {
                this.patientReviews.noMore = true;
            }
            
            let triggerIndex = this.patientReviews.list.length - 2;
            if (triggerIndex < 0) {
                triggerIndex = 0;
            }
            this.patientReviews.loadMoreTriggerIndex = triggerIndex;
            this.patientReviews.list = newList;
            console.info('Loaded more reviews', this.patientReviews.list);
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
    ) {
        this.initAgCharts();
    }
    
    
    async ngAfterViewInit() {
        await this.loadDoctorDetails();
        this.html.initTailwindElements();
        this.initAgChartsColors();
        await this.patientReviews.loadMore({ visible: true });
    }
    
    
    async ngOnChanges() {
        await this.loadDoctorDetails();
        await this.patientReviews.loadMore({ visible: true });
    }
    
    
    inView({ target, visible }: { target: Element; visible: boolean }, index: number) {
        console.log('Inview', target, visible);
    }
    
    
    initAgCharts(): void {
        let oldRandVal = 12;
        let data = Array.from({ length: 90 }, (_, index) => {
            oldRandVal = this.common.getRandomNumber(oldRandVal - 5, oldRandVal + 5);
            return {
                day: `Day ${ index + 1 }`,
                appointments: oldRandVal,
                rating: this.common.getRandomNumber(1, 5)
            };
        });
        
        this.chartThreeMonthsAppointmentsOptions = {
            title: { text: 'No. of Completed Appointments' } as AgChartCaptionOptions,
            subtitle: { text: 'Last 3 months' },
            data: data,
            series: [
                {
                    type: 'line',
                    xKey: 'day',
                    yKey: 'appointments',
                    xName: 'Day',
                    yName: 'No. of Appointments',
                    nodeClickRange: 'nearest',
                } as AgLineSeriesOptions,
            ],
            legend: {
                position: 'top',
            } as AgChartLegendOptions,
        };
        this.chartLast3WeekRatingOptions = {
            title: { text: 'Appointments Rating' } as AgChartCaptionOptions,
            subtitle: { text: 'Last 3 weeks' },
            data: [
                { title: 'Poor', count: this.common.getRandomNumber(1, 35) },
                { title: 'Fair', count: this.common.getRandomNumber(1, 35) },
                { title: 'Good', count: this.common.getRandomNumber(1, 35) },
                { title: 'Very Good', count: this.common.getRandomNumber(1, 35) },
                { title: 'Excellent', count: this.common.getRandomNumber(1, 35) },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'title',
                    yKey: 'count',
                    yName: 'Rating by patients',
                    nodeClickRange: 'nearest'
                } as AgBarSeriesOptions
            ],
            legend: {
                position: 'top',
            } as AgChartLegendOptions,
        };
    }
    
    
    initAgChartsColors(): void {
        try {
            AgCharts.updateDelta(this.chartThreeMonthsAppointments?.chart!, {
                background: {
                    fill: '#edf7fe',
                },
            });
            AgCharts.updateDelta(this.chartLast3WeekRating?.chart!, {
                background: {
                    fill: '#edf7fe',
                },
            });
        } catch (e) {
        
        }
    }
    
    
    async loadDoctorDetails() {
        if (this.doctorId === -1) {
            return false;
        }
        
        let res = await this.http.sendRequest({
            method: 'GET',
            url: `/doctor/${ this.doctorId }`,
        }) as GetDoctorDetailsResponse | false;
        
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
        
        this.doctor = res.doctor;
        this.doctor.coverPicFilename = this.utils.makeOwnServerUrl(`/api/file/${ this.doctor.coverPicFilename }`);
        this.doctor.profilePicFilename = this.utils.makeOwnServerUrl(`/api/file/${ this.doctor.profilePicFilename }`);
        return true;
    }
}
