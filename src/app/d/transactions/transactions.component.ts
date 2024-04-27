import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonService } from '../../services/common.service';
import { HtmlService } from '../../services/html.service';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import {
    DoctorGetAppointmentTransactionsResponse,
    GetWithdrawalTransactionsResponse
} from "../../interfaces/api-response-interfaces";
import { HTTPService } from "../../services/http.service";
import { DatetimePipe } from "../../pipes/datetime.pipe";
import { AppointmentDurationPipe } from "../../pipes/appointment-duration.pipe";
import { ModalComponent } from "../../components/modal/modal.component";
import { UtilFuncService } from "../../services/util-func.service";
import { DoctorProfileService } from "../../services/doctor-profile.service";

type AppointmentTransaction = DoctorGetAppointmentTransactionsResponse['transactions'][0] & { type: 'APPOINTMENT' };
type RefundTransaction = GetWithdrawalTransactionsResponse['refundTransactions'][0] & { type: 'REFUND' };

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [
        CommonModule, RouterLink, FontAwesomeModule, DatetimePipe, AppointmentDurationPipe,
        ModalComponent
    ],
    templateUrl: './transactions.component.html',
    styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements AfterViewInit, OnInit {
    faArrowUpRightFromSquare = faArrowUpRightFromSquare;
    //
    // transactions
    selectedTransactionIndex = 0;
    selectedTransactionSS = '';
    transactions: (AppointmentTransaction | RefundTransaction)[] = [];
    appointmentTransactions = this.initAppointmentTransactions();
    withdrawalTransactions = this.initRefundTransactions();
    
    
    constructor(
        protected common: CommonService,
        private html: HtmlService,
        protected profile: DoctorProfileService,
        private http: HTTPService,
        private utils: UtilFuncService,
    ) {}
    
    
    async ngOnInit() {
        this.initTransactions();
    }
    
    
    async ngAfterViewInit(): Promise<void> {
    }
    
    async initTransactions() {
        await this.appointmentTransactions.load();
        await this.withdrawalTransactions.load();
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
        
        this.withdrawalTransactions.list.forEach(t => {
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
            loading: true,
            errorLoading: false,
            list: [] as DoctorGetAppointmentTransactionsResponse['transactions'],
            load: async () => {}
        }
        
        _.load = async () => {
            _.loading = true;
            _.errorLoading = false;
            
            const res = await this.http.sendRequest({
                url: '/appointments/transactions',
                method: 'GET',
            }) as DoctorGetAppointmentTransactionsResponse | false;
            
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
            loading: true,
            errorLoading: false,
            list: [] as GetWithdrawalTransactionsResponse['refundTransactions'],
            load: async () => {}
        }
        
        _.load = async () => {
            _.loading = true;
            _.errorLoading = false;
            
            const res = await this.http.sendRequest({
                url: '/withdrawal/all',
                method: 'GET',
            }) as GetWithdrawalTransactionsResponse | false;
            
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
                        ss: this.utils.makeOwnServerUrl(this.utils.makeApiUrl('/file/' + t.ss))
                    });
                });
            } else {
                _.errorLoading = true;
            }
        }
        
        return _;
    }
}
