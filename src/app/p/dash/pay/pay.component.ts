import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HtmlService } from '../../../services/html.service';
import { CommonModule, Location, ViewportScroller } from '@angular/common';
import { RatingStarsComponent } from '../../compo/rating-stars/rating-stars.component';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CookieService } from "ngx-cookie-service";
import { toast } from "ngx-sonner";
import { HTTPService } from "../../../services/http.service";
import {
    GetAppointmentBookingPaymentParamsResponse, GetDoctorDetailsResponse,
    VerifyAppointmentBookingTokenResponse
} from "../../../interfaces/api-response-interfaces";
import { FormSubmitButtonComponent } from "../../../utils/components/form-submit-button/form-submit-button.component";
import { Subject } from "rxjs";
import { DoctorProfile, PayfastPaymentGatewayParams } from "../../../interfaces/interfaces";
import { UtilFuncService } from "../../../services/util-func.service";

@Component({
    selector: 'app-pay',
    standalone: true,
    imports: [CommonModule, RatingStarsComponent, RouterLink, HttpClientModule, FormSubmitButtonComponent],
    templateUrl: './pay.component.html',
    styleUrl: './pay.component.scss',
})
export class PayComponent implements AfterViewInit {
    //
    // State variables
    doctorId: number = -1;
    doctor = {
        change: new Subject<void>(),
        loadIdFromUrlParams: () => {
            let params = this.router.parseUrl(this.router.url).queryParams;
            if (params.hasOwnProperty('d')) {
                this.doctorId = parseInt(params['d'] as string);
            } else {
                this.location.back();
            }
        },
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
    // View elements
    @ViewChild('payfastProceedBtn') payfastProceedBtn!: ElementRef<HTMLInputElement>;
    //
    // Forms
    //
    // Book Appointment
    book = {
        waiting: false,
        verifyToken: async (): Promise<boolean> => {
            this.book.waiting = true;
            
            const res = await this.http.sendRequest({
                url: '/appointment/book/verify-auth',
                method: 'GET',
                headers: {
                    TempAuthorization: this.cookies.get('AppointmentBookingTempAuthorization')
                }
            }) as VerifyAppointmentBookingTokenResponse | false;
            
            this.book.waiting = false;
            
            if (res === false) return false;
            
            if (res.invalidToken) {
                toast.error('Please rebook the appointment', {
                    description: 'Your session has expired',
                });
            } else if (res.doctorNotExists) {
                toast.error('Doctor not found', {
                    description: 'Please rebook the appointment or try again later',
                });
            } else if (res.doctorNotActive) {
                toast.error('Doctor not active', {
                    description: 'Please rebook the appointment or try again later',
                });
            } else if (res.invalidSlot) {
                toast.error('Something went wrong', {
                    description: 'Please select your slot again',
                });
            } else if (res.slotClash) {
                toast.error('Someone else booked the slot', {
                    description: 'Please select another slot',
                });
            } else if (res.appointmentAlreadyBooked) {
                toast.error('Appointment already booked');
            } else if (res.verified) {
                return true;
            }
            
            this.cookies.delete('AppointmentBookingTempAuthorization');
            this.location.back();
            return false;
        }
    }
    //
    // Payfast Payment Gateway
    payfastGateway = {
        waiting: false,
        params: {
            token: '',
            currencyCode: '',
            merchantId: '',
            merchantName: '',
            basketId: -1,
            txnamt: -1,
            orderDate: '',
            successUrl: '',
            failureUrl: '',
            checkoutUrl: '',
            formUrl: '',
            txndesc: '',
            procCode: '00',
            tranType: '',
            signature: '',
            customerEmailAddress: '',
            customerMobileNo: '',
            version: '',
            items: [],
        } as PayfastPaymentGatewayParams,
        updateRedirectionParams: () => {
            this.payfastGateway.params.successUrl = `http://localhost:4200/p/pay?d=${ this.doctorId }&m=true`;
            this.payfastGateway.params.failureUrl = `http://localhost:4200/p/pay?d=${ this.doctorId }&m=false`;
        },
        load: async (): Promise<boolean> => {
            this.payfastGateway.waiting = true;
            
            if (!await this.book.verifyToken()) {
                this.payfastGateway.waiting = false;
                return false;
            }
            
            const res = await this.http.sendRequest({
                url: '/appointment/book/payfast-params',
                method: 'GET',
                headers: {
                    TempAuthorization: this.cookies.get('AppointmentBookingTempAuthorization')
                },
            }) as GetAppointmentBookingPaymentParamsResponse | false;
            
            this.payfastGateway.waiting = false;
            
            if (res === false) return false;
            
            if (res.invalidToken) {
                toast.error('Please rebook the appointment', {
                    description: 'Your session has expired',
                });
            } else if (res.doctorNotExists) {
                toast.error('Doctor not found', {
                    description: 'Please rebook the appointment or try again later',
                });
            } else if (res.doctorNotActive) {
                toast.error('Doctor not active', {
                    description: 'Please rebook the appointment or try again later',
                });
            } else if (res.invalidSlot) {
                toast.error('Something went wrong', {
                    description: 'Please select your slot again',
                });
            } else if (res.slotClash) {
                toast.error('Someone else booked the slot', {
                    description: 'Please select another slot',
                });
            } else if (res.appointmentAlreadyBooked) {
                toast.error('Appointment already booked');
            } else if (!res.verified) {
                toast.error('Please rebook the appointment', {
                    description: 'Your session has expired',
                });
            } else if (!res.paramsGenerated) {
                toast.error('Something went wrong', {
                    description: 'Please try again later',
                });
            } else {
                this.payfastGateway.params = {
                    ...this.payfastGateway.params,
                    ...res.payfastParams,
                };
                toast.loading('Redirecting to Payfast', {
                    duration: 3100,
                });
                console.info(this.payfastGateway.params);
                setTimeout(() => {
                    this.payfastProceedBtn.nativeElement.click();
                }, 3000);
                return true;
            }
            
            this.cookies.delete('AppointmentBookingTempAuthorization');
            this.location.back();
            return false;
        }
    }
    
    
    constructor(
        public common: CommonService,
        private html: HtmlService,
        public scroller: ViewportScroller,
        private http: HTTPService,
        public location: Location,
        private router: Router,
        private cookies: CookieService,
        private utils: UtilFuncService,
        private _http: HttpClient,
    ) {
        this.doctor.loadIdFromUrlParams();
        this.payfastGateway.updateRedirectionParams();
        this.checkForPayfastTransactionErrors();
        
        if (!this.cookies.check('AppointmentBookingTempAuthorization')) {
            console.error('No cookie');
            toast.error('Please rebook the appointment.', {
                description: 'Your session has expired.',
            })
            this.location.back();
        }
        
        this.doctor.load();
    }
    
    
    async ngAfterViewInit() {
        this.html.initTailwindElements();
        await this.book.verifyToken();
    }
    
    
    checkForPayfastTransactionErrors() {
        let params = this.router.parseUrl(this.router.url).queryParams;
        if (params.hasOwnProperty('err_code')) {
            const err_code = params['err_code'] as string;
            if (err_code === '000') {
                toast.success('Transaction successful', {
                    description: 'Your appointment will show up in your dashboard in 2 to 3 minutes',
                });
            } else {
                toast.error('Transaction failed', {
                    description: 'Please try again later',
                });
            }
        }
    }
    
    
    makePayfastRequest() {
        const url = 'https://ipg1.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken';
        const params = {
            MERCHANT_ID: 19893,
            SECURED_KEY: 'KwF0fQpYjGrgad0JRTLb89eGq',
            TXNAMT: 1050,
            BASKET_ID: 12
        };
        
        this._http.post<any>(url, params).subscribe(
            (response) => {
                console.log('Response:', response);
                const token = response.ACCESS_TOKEN;
                const generatedDateTime = response.GENERATED_DATE_TIME;
                // Handle response data as needed
                console.info('Token:', token);
                console.info('Generated Date Time:', generatedDateTime);
            },
            (error) => {
                console.error('Error:', error);
                // Handle error
            }
        );
    }
    
}
