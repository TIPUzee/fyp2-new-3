import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HTTPService } from "./http.service";
import { UtilFuncService } from "./util-func.service";
import { LoadPatientProfileResponse } from "../interfaces/api-response-interfaces";
import { PatientAccountStatus } from "../interfaces/interfaces";
import { toast } from "ngx-sonner";

@Injectable({
    providedIn: 'root',
})
export class PatientProfileService {
    private profileChange = new Subject<void>();
    public profileChange$ = this.profileChange.asObservable();
    
    id: number = 0;
    email: string = '';
    password: string = '';
    name: string = '';
    dob: string = '';
    whatsappNumber: string = '';
    registrationTime: string = '';
    refundableAmount: number = 0;
    status: PatientAccountStatus = 'ACCOUNT_NOT_SUSPENDED';
    
    
    constructor(
        private http: HTTPService,
        private utils: UtilFuncService,
    ) {
        this.loadFromServer();
    }
    
    
    async loadFromServer() {
        let res = await this.http.sendRequest({
            url: '/profile',
            method: 'GET'
        }) as LoadPatientProfileResponse | false;
        
        if (res === false) {
            toast.error('Failed to load some data');
            setTimeout(() => {
                this.loadFromServer();
            }, 5000);
            return;
        }
        
        if (res.userType !== 'p') {
            this.utils.setCurrentUser(res.userType);
        }
        
        this.id = res.profile.id;
        this.email = res.profile.email;
        this.name = res.profile.name;
        this.dob = this.utils.convertGMTDate(res.profile.dob);
        this.whatsappNumber = res.profile.whatsappNumber;
        this.registrationTime = res.profile.registrationTime;
        this.refundableAmount = res.profile.refundableAmount;
        this.status = res.profile.status;
        
        // trigger change
        this.profileChange.next();
    }
    
}
