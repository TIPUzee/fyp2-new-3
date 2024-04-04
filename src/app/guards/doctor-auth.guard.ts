import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { HTTPService } from '../services/http.service';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { UtilFuncService } from "../services/util-func.service";

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
                let _res = await this.http.sendRequest({
                    url: '/auth/verify-logins',
                    method: 'GET',
                });
                if (!_res) {
                    return resolve(false);
                }
                let res = this.utils.transformJsonSnakeCaseToCamelCase(_res) as {
                    invalidLogin: boolean,
                    userType: 'g' | 'p' | 'd' | 'a',
                };
                
                this.utils.setCurrentUser(res.userType);
                if (!res.invalidLogin && res.userType === 'd') {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } else {
                resolve(false);
            }
        });
    }
}
