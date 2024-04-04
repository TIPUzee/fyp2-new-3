import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HtmlService } from '../../services/html.service';
import { Router, RouterLink } from '@angular/router';
import { HTTPService } from "../../services/http.service";
import { FormBuilder, ReactiveFormsModule, Validators as vl } from "@angular/forms";
import { NgOptimizedImage } from "@angular/common";
import { FormInputComponent } from "../../utils/components/form-input/form-input.component";
import { FormSubmitButtonComponent } from "../../utils/components/form-submit-button/form-submit-button.component";
import { UtilFuncService } from "../../services/util-func.service";
import { AuthLoginResponse } from "../../interfaces/api-response-interfaces";
import { toast } from "ngx-sonner";

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        RouterLink, ReactiveFormsModule, NgOptimizedImage, FormInputComponent,
        FormSubmitButtonComponent
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit {
    @ViewChild('userTypeSelectorInput') userTypeSelectorInput!: ElementRef<HTMLSelectElement>;
    
    loginForm = {
        fg: this._fb.group({
            email: ['', [vl.required, vl.email]],
            password: ['', [vl.required]],
        }),
        errors: {
            email: {
                required: 'Email must be provided',
                email: 'Please provide a valid email address',
            },
            password: {
                required: 'Password is required',
            },
        },
        waiting: false,
        submit: async () => {
            this.utils.markAllFormControlsAsTouched(this.loginForm.fg);
            if (this.loginForm.fg.invalid) {
                return;
            }
            let data = this.loginForm.fg.value;
            
            this.loginForm.waiting = true;
            let res = await this.http.sendRequest({
                url: '/auth/login',
                jsonData: data,
                method: 'POST'
            }) as AuthLoginResponse | false;
            this.loginForm.waiting = false;
            
            if (res === false) {
                toast.error('Unable to login at the moment', {
                    description: 'Please try again later.'
                });
                return;
            }
            
            if (res.invalidCredentials) {
                toast.error('Wrong email or password');
                return;
            }
            
            if (!res.loginSuccessful) {
                toast.error('Unable to login at the moment', {
                    description: 'Please try again later.'
                });
                return;
            }
            
            this.utils.setAuthorizationToken(res.token);
            this.utils.setCurrentUser(res.userType);
            await this.router.navigate([res.userType]);
        }
    }
    
    
    constructor(
        private htmlService: HtmlService,
        public router: Router,
        private http: HTTPService,
        private _fb: FormBuilder,
        private utils: UtilFuncService,
    ) {
    }
    
    
    ngAfterViewInit(): void {
        this.htmlService.scrollToTop();
        this.htmlService.initTailwindElements();
    }
    
}
