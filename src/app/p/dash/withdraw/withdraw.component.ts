import { AfterViewInit, Component } from '@angular/core';
import { HtmlService } from '../../../services/html.service';
import { PatientProfileService } from "../../../services/patient-profile.service";
import { FormBuilder, ReactiveFormsModule, Validators as vl } from "@angular/forms";
import { FormValidatorsService } from "../../../services/form-validators.service";
import { toast } from "ngx-sonner";
import { HTTPService } from "../../../services/http.service";
import {
    GetPrevPatientRefundTransactionRequestResponse,
    SubmitPatientRefundTransactionRequestResponse
} from "../../../interfaces/api-response-interfaces";
import { UtilFuncService } from "../../../services/util-func.service";
import { FormInputComponent } from "../../../utils/components/form-input/form-input.component";
import { FormSubmitButtonComponent } from "../../../utils/components/form-submit-button/form-submit-button.component";
import { NgIf, NgSwitch, NgSwitchCase } from "@angular/common";
import { ModalComponent } from "../../../utils/components/modal/modal.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

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
                    vl.required, vl.min(100),
                ])
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
                min: 'The Minimum amount is Rs 100.',
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
            this.refundRequestForm.fg.markAllAsTouched();
            if (this.refundRequestForm.fg.invalid) {
                toast.error('Please correct the errors in the form');
                return false;
            }
            return true;
        },
        submit: async () => {
            if (!this.refundRequestForm.validateAndRaiseErrors()) return;
            
            this.refundRequestForm.loading = true;
            
            const res = await this.http.sendRequest({
                method: 'POST',
                url: '/withdraw/refund-request',
                jsonData: this.refundRequestForm.fg.value,
            }) as SubmitPatientRefundTransactionRequestResponse | false;
            
            this.refundRequestForm.loading = false;
            
            if (!res) return;
            
            if (res.minAmountNotMet) {
                toast.error('Minimum amount not met', {
                    description: `You need to have at least Rs ${ res.minAmount } in your account to request a refund.`,
                });
            } else if (res.alreadyRequested) {
                toast.error('Refund request already submitted', {
                    description: 'You can only submit one refund request at a time.',
                });
            } else if (res.success) {
                toast.success('Refund request submitted', {
                    description: 'Your refund request has been submitted successfully. Please allow us up to 3' +
                        ' working days for processing.',
                });
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
        details: {} as GetPrevPatientRefundTransactionRequestResponse,
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
                url: '/withdraw/prev-refund-request',
            }) as GetPrevPatientRefundTransactionRequestResponse | false;
            
            this.prevRefundRequest.loading = false;
            
            if (!res) {
                this.prevRefundRequest.errorLoading = true;
                return;
            } else if (res.neverRequested) {
                toast.warning('You have never requested a refund');
            } else if (res.alreadyRequested) {
                toast.info('Refund request already submitted', {
                    description: 'You have already submitted a refund request. Please wait for it to be processed.',
                });
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
        protected profile: PatientProfileService,
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
        this.refundRequestForm.fg.controls.amount.setValue(Math.floor(this.profile.refundableAmount));
    }
}
