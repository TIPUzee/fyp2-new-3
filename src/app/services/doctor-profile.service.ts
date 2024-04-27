import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HTTPService } from "./http.service";
import { LoadDoctorProfileResponse } from "../interfaces/api-response-interfaces";
import {
    DoctorAccountStatus,
    DoctorAvailabilityDuration,
    DoctorExperience,
    DoctorLanguage, DoctorProfile
} from "../interfaces/interfaces";
import { toast } from "ngx-sonner";

@Injectable({
    providedIn: 'root',
})
export class DoctorProfileService {
    private change = new Subject<void>();
    change$ = this.change.asObservable();
    
    details: DoctorProfile = {
        id: -1,
        profilePicFilename: null,
        coverPicFilename: null,
        email: '',
        name: '',
        dob: new Date(),
        whatsappNumber: '',
        registrationTime: '',
        status: 'NEW_ACCOUNT' as DoctorAccountStatus,
        walletAmount: 0,
        availabilityDurations: [] as DoctorAvailabilityDuration[],
        specializationCategoryId: -1,
        maxMeetingDuration: 0,
        appointmentCharges: 0,
        specialization: '',
        languages: [] as DoctorLanguage[],
        experiences: [] as DoctorExperience[],
    }
    
    constructor(
        private http: HTTPService,
    ) {
        this.load();
    }
    
    
    async load() {
        let res = await this.http.sendRequest({
            url: '/profile',
            method: 'GET'
        }) as LoadDoctorProfileResponse | false;
        
        if (res === false) {
            toast.error('Failed to load some data');
            return;
        }
        
        if (res.userType !== 'd') {
            toast.error('You are not logged in as a doctor');
            return false;
        }
        
        this.details = res.profile;
        
        this.change.next();
        return true;
    }
    
}
