import { AfterViewInit, Component } from '@angular/core';
import { HtmlService } from '../../services/html.service';
import { Router, RouterLink } from '@angular/router';
import { FormInputComponent } from "../../utils/components/form-input/form-input.component";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators as vl } from "@angular/forms";
import { FormValidatorsService } from "../../services/form-validators.service";
import { FormSubmitButtonComponent } from "../../utils/components/form-submit-button/form-submit-button.component";
import { HTTPService } from "../../services/http.service";
import { UtilFuncService } from "../../services/util-func.service";
import { CookieService } from "ngx-cookie-service";
import { AuthRegisS2Response } from "../../interfaces/api-response-interfaces";
import { toast } from "ngx-sonner";

@Component({
    selector: 'app-regis-email',
    standalone: true,
    imports: [RouterLink, FormInputComponent, ReactiveFormsModule, FormsModule, FormSubmitButtonComponent],
    templateUrl: './regis-email.component.html',
    styleUrl: './regis-email.component.scss',
})
export class RegisEmailComponent implements AfterViewInit {
    
    regisVerifyEmailForm = {
        fg: this._fb.group(
            {
                code: [
                    '',
                    vl.compose([
                        vl.required, this._fvs.numeric(), vl.minLength(6), vl.maxLength(6)
                    ]),
                    vl.composeAsync([
                        this._fvs.isAuthCodeValid()
                    ])
                ],
            }
        ),
        errors: {
            code: {
                required: 'Verification Code is required',
                numeric: 'Verification Code must be only numbers',
                minlength: 'Verification Code must be 6 characters',
                maxlength: 'Verification Code must be 6 characters',
                isAuthCodeValid: 'Verification Code is invalid',
            },
        },
        waiting: false,
        submit: async () => {
            this.utils.markAllFormControlsAsTouched(this.regisVerifyEmailForm.fg);
            if (this.regisVerifyEmailForm.fg.invalid) {
                toast.error('Please fill in the form correctly');
                return;
            }
            let data: Record<string, any> = this.regisVerifyEmailForm.fg.value;
            
            // Data Conversions
            data['code'] = Number(data['code']);
            
            this.regisVerifyEmailForm.waiting = true;
            let res = await this.http.sendRequest({
                url: '/auth/regis/s2',
                jsonData: data,
                method: 'POST'
            }) as AuthRegisS2Response | false;
            this.regisVerifyEmailForm.waiting = false;
            
            if (!res) {
                toast.error('Something went wrong. Please try again later.');
                console.error('Error occurred while sending request to /auth/regis/s2', data, res);
                return;
            }
            
            if (res.invalidCode) {
                this.regisVerifyEmailForm.fg.controls['code'].setErrors({ isAuthCodeValid: true });
                toast.error('Invalid Verification Code');
                return;
            }
            
            if (res.whatsappNumberAlreadyExists && res.emailAlreadyExists) {
                toast.error('Email and Whatsapp Number has already taken');
                toast.error('Or your account has already registered');
                return;
            }
            
            if (res.emailAlreadyExists) {
                toast.error('Email has already taken');
                return;
            }
            
            if (res.whatsappNumberAlreadyExists) {
                toast.error('Whatsapp Number has already taken');
                return;
            }
            
            if (!res.registrationCompleted) {
                toast.error('Something went wrong. Please try again later.');
                return;
            }
            
            this.utils.setAuthorizationToken(res.token);
            this.utils.setCurrentUser(res.userType);
            
            if (res.userType == 'p') {
                await this.router.navigate(['p']);
            } else if (res.userType == 'd') {
                await this.router.navigate(['d']);
            } else {
                toast.error('Invalid User Type');
            }
        }
    }
    
    
    constructor(
        private htmlService: HtmlService,
        private _fb: FormBuilder,
        private _fvs: FormValidatorsService,
        private http: HTTPService,
        private utils: UtilFuncService,
        private cookie: CookieService,
        private router: Router,
    ) {}
    
    
    ngAfterViewInit(): void {
        this.htmlService.initTailwindElements();
        this.htmlService.scrollToTop();
        console.log('Old regis', this.cookie.get('Authorization'));
    }
}
