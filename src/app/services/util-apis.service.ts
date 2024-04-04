import { Injectable } from '@angular/core';
import { HTTPService } from "./http.service";
import { UtilFuncService } from "./util-func.service";
import { toast } from "ngx-sonner";
import {
    AuthRegisVerifyCodeResponse,
    EmailExistsResponse,
    WhatsappNumberExistsResponse
} from "../interfaces/api-response-interfaces";

@Injectable({
    providedIn: 'root'
})
export class UtilApisService {
    
    constructor(
        private http: HTTPService,
        private utils: UtilFuncService
    ) { }
    
    
    emailExists(email: string): Promise<boolean | null> {
        return new Promise(async (resolve) => {
            let res = await this.http.sendRequest({
                url: `/email-exists/${ email }`,
                method: 'GET'
            }) as EmailExistsResponse | false;
            if (res === false) {
                resolve(null);
                return;
            }
            resolve(res.emailExists);
        });
    }
    
    
    isAuthCodeValid(code: string): Promise<boolean | null> {
        return new Promise(async (resolve) => {
            let res = await this.http.sendRequest({
                url: `/auth/regis/verify-code/${ code }`,
                method: 'GET'
            }) as AuthRegisVerifyCodeResponse | false;

            if (res === false) {
                resolve(null);
                return;
            }
            resolve(!res.invalidCode);
        });
    }
    
    
    whatsappNumberExists(whatsappNumber: string): Promise<boolean | null> {
        return new Promise(async (resolve) => {
            let res = await this.http.sendRequest({
                url: `/whatsapp-number-exists/${ whatsappNumber }`, method: 'GET'
            }) as WhatsappNumberExistsResponse | false;

            if (res === false) {
                resolve(null);
                return;
            }
            resolve(res.whatsappNumberExists);
        });
    }
}
