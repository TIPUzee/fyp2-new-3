import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class OffcanvasService {
    anyOffcanvasOpened: number = 0;
    
    
    constructor() {}
    
    
    async AdminDoctorsSpecializationsCompo(): Promise<any> {
        let a;
        await import('../../../a/dash/doctors-specializations/doctors-specializations.component').then(x => {
            a = x.DoctorsSpecializationsComponent;
        });
        return a;
    }
    
    
    async AdminLanguagesCompo(): Promise<any> {
        let a;
        await import('../../../a/dash/languages/languages.component').then(x => {
            a = x.LanguagesComponent;
        });
        return a;
    }
    
    
    async AdminPatientsCompo(): Promise<any> {
        let a;
        await import('../../../a/dash/patients/patients.component').then(x => {
            a = x.PatientsComponent;
        });
        return a;
    }
    
    
    async AdminSpecializationCategoryAndDiseaseMappingCompo(): Promise<any> {
        let a;
        await import('../../../a/dash/specialization-category-and-disease-mapping/specialization-category-and-disease-mapping.component').then(
            x => {
                a = x.SpecializationCategoryAndDiseaseMappingComponent;
            });
        return a;
    }
}
