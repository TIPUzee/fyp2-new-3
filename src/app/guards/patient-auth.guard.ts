import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { HTTPService } from '../services/http.service';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { UtilFuncService } from "../services/util-func.service";
import { AuthVerifyLoginsResponse } from "../interfaces/api-response-interfaces";

@Injectable()
export class PatientAuth implements CanActivate {
    
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
                    return resolve(false);
                }

                this.utils.setCurrentUser(res.userType);
                if (res.invalidLogin || res.userType !== 'p') {
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
