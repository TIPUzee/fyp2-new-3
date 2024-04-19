import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { HTTPService } from '../services/http.service';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { UtilFuncService } from "../services/util-func.service";
import { AuthVerifyLoginsResponse } from "../interfaces/api-response-interfaces";
import { toast } from "ngx-sonner";

@Injectable()
export class DoctorAuth implements CanActivate {
    
    constructor(
        private router: Router,
        private http: HTTPService,
        private cookies: CookieService,
        private utils: UtilFuncService
    ) { }
    
    
    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        return new Promise<boolean>(async (resolve) => {
            if (this.cookies.get('Authorization') !== '') {
                let res = await this.http.sendRequest({
                    url: '/auth/verify-logins',
                    method: 'GET',
                }) as AuthVerifyLoginsResponse | false;
                
                if (!res) {
                    return resolve(false);
                }
                
                console.info('DoctorAuth#canActivate', res);
                if (res.accountSuspended) {
                    console.info('DoctorAuth#canActivate', 'Account suspended');
                    toast.error('Your account has been suspended', {
                        description: 'Please contact support for more information.'
                    });
                } else if (res.invalidLogin) {
                    toast.error('Invalid login', {
                        description: 'Please login again.'
                    });
                } else if (res.userType !== 'd') {
                } else {
                    resolve(true);
                    return;
                }
                
                console.info('DoctorAuth#canActivate', 'Redirecting to login');
                this.utils.setCurrentUser(res.userType);
                resolve(false);
            } else {
                resolve(false);
            }
        });
    }
}
