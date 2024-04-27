import { AfterViewInit, Component } from '@angular/core';
import { HtmlService } from '../../../services/html.service';
import { FormBuilder, ReactiveFormsModule, Validators as vl } from "@angular/forms";
import { FormValidatorsService } from "../../../services/form-validators.service";
import { toast } from "ngx-sonner";
import { HTTPService } from "../../../services/http.service";
import {
    GetPrevWithdrawalTransactionRequestResponse,
    SubmitWithdrawalTransactionRequestResponse
} from "../../../interfaces/api-response-interfaces";
import { UtilFuncService } from "../../../services/util-func.service";
import { FormInputComponent } from "../../../utils/components/form-input/form-input.component";
import { FormSubmitButtonComponent } from "../../../utils/components/form-submit-button/form-submit-button.component";
import { NgIf, NgSwitch, NgSwitchCase } from "@angular/common";
import { ModalComponent } from "../../../utils/components/modal/modal.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DoctorProfileService } from "../../../services/doctor-profile.service";

@Component({
    selector: 'app-withdraw',
    standalone: true,
    imports: [
        FormInputComponent,
        ReactiveFormsModule,
        FormSubmitButtonComponent,
        NgSwitch,
        NgSwitchCase,
        ModalComponent,
        NgIf
    ],
    templateUrl: './withdraw.component.html',
    styleUrl: './withdraw.component.scss',
})
export class WithdrawComponent implements AfterViewInit {
    //
    // Forms
    //
    // Refund request
    refundRequestForm = {
        loading: false,
        fg: this.fb.group({
            amount: [
                0, vl.compose([
                    vl.required, this._fvs.numeric(),
                    vl.min(1),
                    this._fvs.max({ maxFunc: () => { return this.profile.details.walletAmount} }),
                    this._fvs.multipleOf(5000),
                ]),
            ],
            receiverEpNb: [
                '', vl.compose([
                    vl.required, vl.minLength(10), vl.maxLength(15), this._fvs.phoneNumberFormat(),
                ])
            ],
            receiverEpUsername: [
                '', vl.compose([
                    vl.required, vl.minLength(1), vl.maxLength(64),
                ])
            ],
        }),
        errors: {
            amount: {
                required: 'Please enter an amount',
                numeric: 'Amount must be a number',
                min: 'The Minimum amount is Rs 5000.',
                multipleOf: 'Amount must be a multiple of Rs 5000',
                max: 'Amount exceeds your wallet balance',
            },
            receiverEpNb: {
                required: 'Please enter a phone number',
                minlength: 'Phone number is too short',
                maxlength: 'Phone number is too long',
                phoneNumberFormat: 'Phone number is not valid. e.g., +923001234567',
            },
            receiverEpUsername: {
                required: 'Please enter a username',
                minlength: 'Username is too short. Minimum one character required',
                maxlength: 'Username is too long. Maximum 64 characters allowed',
            },
        },
        validateAndRaiseErrors: () => {
            this.utils.markAllFormControlsAsTouched(this.refundRequestForm.fg);
            if (this.refundRequestForm.fg.invalid) {
                toast.warning('Please fill all the fields correctly');
                return false;
            }
            return true;
        },
        submit: async () => {
            if (!this.refundRequestForm.validateAndRaiseErrors()) return;
            
            this.refundRequestForm.loading = true;
            
            const data = this.refundRequestForm.fg.value;
            data.amount = Number(data.amount);
            
            const res = await this.http.sendRequest({
                method: 'POST',
                url: '/withdrawal',
                jsonData: data,
            }) as SubmitWithdrawalTransactionRequestResponse | false;
            
            this.refundRequestForm.loading = false;
            
            if (!res) return;
            
            if (res.minAmountNotMet) {
                toast.error('Minimum amount not met', {
                    description: `You need to have at least Rs ${ res.minAmount } in your account to request a refund.`,
                });
            } else if (res.insufficientAmountInAccount) {
                toast.error('Insufficient amount in account');
            } else if (res.alreadyRequested) {
                toast.error('Refund request already submitted', {
                    description: 'You can only submit one refund request at a time.',
                });
            } else if (res.success) {
                toast.success('Refund request submitted', {
                    description: 'Your refund request has been submitted successfully. Please allow us up to 3' +
                        ' working days for processing.',
                });
                await this.prevRefundRequest.load();
                this.html.initTailwindElements();
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while submitting your refund request. Please try again later.',
                });
            }
        },
    }
    //
    // Prev refund request
    prevRefundRequest = {
        loading: false,
        errorLoading: false,
        details: {} as GetPrevWithdrawalTransactionRequestResponse,
        resetWithdrawalRequest: () => {
            this.prevRefundRequest.details.alreadyRequested = false;
            this.prevRefundRequest.details.neverRequested = true;
            this.prevRefundRequest.details.prevRejected = false;
            this.prevRefundRequest.details.prevCompleted = false;
            this.html.initTailwindElements();
        },
        load: async () => {
            this.prevRefundRequest.loading = true;
            
            const res = await this.http.sendRequest({
                method: 'GET',
                url: '/withdrawal',
            }) as GetPrevWithdrawalTransactionRequestResponse | false;
            
            this.prevRefundRequest.loading = false;
            
            if (!res) {
                this.prevRefundRequest.errorLoading = true;
                return;
            } else if (res.neverRequested) {
                toast.warning('You have never requested a refund');
            } else if (res.alreadyRequested) {
            } else if (res.prevRejected) {
                toast.error('Your previous refund request was rejected', {
                    description: res.requestDetails.rejectionReason,
                });
            } else if (res.prevCompleted) {
                toast.success('Your previous refund request was completed', {
                    description: `Rs ${ res.requestDetails.amount } was refunded to your account.`,
                });
            } else {
                this.prevRefundRequest.errorLoading = true;
            }
            
            this.prevRefundRequest.details = res;
        }
    }
    
    
    constructor(
        private html: HtmlService,
        protected profile: DoctorProfileService,
        private fb: FormBuilder,
        private _fvs: FormValidatorsService,
        private http: HTTPService,
        protected utils: UtilFuncService,
    ) {
        this.resetRefundAmount();
        this.profile.change$.pipe(takeUntilDestroyed()).subscribe(() => {
            this.resetRefundAmount();
        });
    }
    
    
    async ngAfterViewInit(): Promise<void> {
        await this.prevRefundRequest.load()
        this.html.initTailwindElements();
    }
    
    
    resetRefundAmount() {
        this.refundRequestForm.fg.controls.amount.setValue(0);
    }
}
