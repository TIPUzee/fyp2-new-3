import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { HTTPService } from '../services/http.service';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { UtilFuncService } from "../services/util-func.service";
import { AuthVerifyLoginsResponse } from "../interfaces/api-response-interfaces";
import { toast } from "ngx-sonner";

@Injectable()
export class AdminAuth implements CanActivate {
    
    constructor(
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

                if (res === false) {
                    toast.error('Unable to verify logins. Please try again later.');
                    return resolve(false);
                }
                
                this.utils.setCurrentUser(res.userType);
                if (res.invalidLogin || res.userType !== 'a') {
                    toast.error('You are not authorized to access this page.');
                    resolve(false);
                } else {
                    resolve(true);
                }
            } else {
                resolve(false);
            }
        });
    }
}
