import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RatingStarsComponent } from '../../compo/rating-stars/rating-stars.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonService } from '../../../services/common.service';
import { HtmlService } from '../../../services/html.service';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { PatientProfileService } from "../../../services/patient-profile.service";
import {
    GetAppointmentTransactionsResponse,
    GetPatientRefundTransactionsResponse
} from "../../../interfaces/api-response-interfaces";
import { HTTPService } from "../../../services/http.service";
import { DatetimePipe } from "../../../pipes/datetime.pipe";
import { AppointmentDurationPipe } from "../../../pipes/appointment-duration.pipe";

type AppointmentTransaction = GetAppointmentTransactionsResponse['transactions'][0] & { type: 'APPOINTMENT' };
type RefundTransaction = GetPatientRefundTransactionsResponse['refundTransactions'][0] & { type: 'REFUND' };

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [CommonModule, RouterLink, RatingStarsComponent, FontAwesomeModule, DatetimePipe, AppointmentDurationPipe],
    templateUrl: './transactions.component.html',
    styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements AfterViewInit, OnInit {
    faArrowUpRightFromSquare = faArrowUpRightFromSquare;
    //
    // transactions
    transactions: (AppointmentTransaction | RefundTransaction)[] = [];
    appointmentTransactions = this.initAppointmentTransactions();
    refundTransactions = this.initRefundTransactions();
    
    
    constructor(
        protected common: CommonService,
        private html: HtmlService,
        protected profile: PatientProfileService,
        private http: HTTPService,
    ) {}
    
    
    async ngAfterViewInit(): Promise<void> {
        console.info('transactions', this.transactions);
    }
    
    
    async ngOnInit() {
        await this.appointmentTransactions.load();
        await this.refundTransactions.load();
        this.transactions = this.getCombinedTransactions();
        this.html.initTailwindElements();
    }
    
    getCombinedTransactions() {
        // merge appointment and refund transactions
        // sort by time
        
        const transactions: typeof this.transactions = [];
        
        this.appointmentTransactions.list.forEach(t => {
            transactions.push({ ...t, type: 'APPOINTMENT' });
        });
        
        this.refundTransactions.list.forEach(t => {
            transactions.push({ ...t, type: 'REFUND' });
        });
        
        // for sorting, use the timeTo property for appointments and the trxTime property for refunds
        return transactions.sort((a, b) => {
            if (a.type === 'APPOINTMENT' && b.type === 'APPOINTMENT') {
                return a.timeTo.getTime() - b.timeTo.getTime();
            } else if (a.type === 'REFUND' && b.type === 'REFUND') {
                return a.trxTime.getTime() - b.trxTime.getTime();
            } else if (a.type === 'APPOINTMENT' && b.type === 'REFUND') {
                return a.timeTo.getTime() - b.trxTime.getTime();
            } else if (a.type === 'REFUND' && b.type === 'APPOINTMENT') {
                return a.trxTime.getTime() - b.timeTo.getTime();
            } else {
                throw new Error('unexpected transaction type');
            }
        });
    }
    
    
    initAppointmentTransactions() {
        const _ = {
            loading: false,
            errorLoading: false,
            list: [] as GetAppointmentTransactionsResponse['transactions'],
            load: async () => {}
        }
        
        _.load = async () => {
            _.loading = true;
            _.errorLoading = false;
            
            const res = await this.http.sendRequest({
                url: '/appointments/transactions',
                method: 'GET',
            }) as GetAppointmentTransactionsResponse | false;
            
            _.loading = false;
            
            if (!res) {
                _.errorLoading = true;
                return;
            } else if (res.transactions) {
                _.list = [];
                res.transactions.forEach(t => {
                    _.list.push({
                        ...t,
                        timeFrom: new Date(t.timeFrom),
                        timeTo: new Date(t.timeTo),
                        paymentTime: new Date(t.paymentTime),
                    });
                });
            } else {
                _.errorLoading = true;
            }
        }
        
        return _;
    }
    
    
    initRefundTransactions() {
        const _ = {
            loading: false,
            errorLoading: false,
            list: [] as GetPatientRefundTransactionsResponse['refundTransactions'],
            load: async () => {}
        }
        
        _.load = async () => {
            _.loading = true;
            _.errorLoading = false;
            
            const res = await this.http.sendRequest({
                url: '/withdraw/refund-transactions',
                method: 'GET',
            }) as GetPatientRefundTransactionsResponse | false;
            
            _.loading = false;
            
            if (!res) {
                _.errorLoading = true;
                return;
            } else if (res.noTransactions) {
                _.list = [];
            } else if (res.refundTransactions) {
                _.list = [];
                res.refundTransactions.forEach(t => {
                    _.list.push({
                        ...t,
                        requestTime: new Date(t.requestTime),
                        trxTime: new Date(t.trxTime),
                    });
                });
            } else {
                _.errorLoading = true;
            }
        }
        
        return _;
    }
}
