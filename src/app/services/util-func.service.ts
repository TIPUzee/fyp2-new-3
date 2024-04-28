import { ElementRef, Injectable } from '@angular/core';
import { env } from '../../env/env';
import { FormGroup } from "@angular/forms";
import { CookieService } from "ngx-cookie-service";

// import { Location } from '@angular/common';

@Injectable({
    providedIn: 'root',
})
export class UtilFuncService {
    private currentUser: 'g' | 'p' | 'd' | 'a' = 'g';
    public serverURL = env.serverURL;
    
    
    constructor(
        private cookie: CookieService,
    ) {
        const userType = this.cookie.get('userType');
        if (userType) {
            this.currentUser = userType as 'g' | 'p' | 'd' | 'a';
        }
    }
    
    
    convertDateFormat(inputDate: string) {
        const parts = inputDate.split('-');
        
        return `${ parts[2] }-${ parts[1] }-${ parts[0] }`;
    }
    
    
    convertDateToDefinedDateFormat(date: Date): string {
        // e.g. 2021-09-01
        const year = date.getFullYear();
        const month = (
            date.getMonth() + 1
        ).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${ year }-${ month }-${ day }`;
    }
    
    
    convertDateToDefinedDateTimeFormat(date: Date): string {
        // e.g. 2021-09-01 08:00 PM
        return `${ this.convertDateToDefinedDateFormat(date) } ${ this.convertDateToDefinedTimeFormat(date) }`;
    }
    
    
    convertDateToDefinedTimeFormat(date: Date): string {
        // e.g. 08:00:00 or 13:00:00
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${ hours }:${ minutes }:${ seconds }`;
    }
    
    
    convertFormDataToJson(formData: FormData): Record<string, any> {
        const jsonData: Record<string, any> = {};
        
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });
        
        return jsonData;
    }
    
    
    convertGMTDate(date: string | Date | null): string {
        if (!date) {
            return '';
        }
        
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Asia/Karachi'
        };
        const formattedDate = date.toLocaleDateString('en-UK', options).replace(/\//g, '-');
        return this.convertDateFormat(formattedDate);
    }
    
    
    convertLocalDateToUTCDate(date: Date): Date {
        return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    }
    
    
    convertToDMTDateObject(dateTime: string): Date {
        return new Date(dateTime);
    }
    
    
    floorValue(val: number): number {
        return Math.floor(val);
    }
    
    
    getCurrentUser(): 'g' | 'p' | 'd' | 'a' {
        return this.currentUser;
    }
    
    
    getFormData(
        form: ElementRef<HTMLFormElement> | HTMLFormElement,
    ): FormData {
        return new FormData(form.nativeElement || form);
    }
    
    
    getTime({ minutes }: { minutes?: number }): string {
        if (!minutes) {
            return '12:00 AM';
        }
        const _hoursInNumbers = (
            minutes % 1440
        ) / 60;
        let hours = Math.floor(_hoursInNumbers);
        const _minutes = Math.round((
            _hoursInNumbers % 1
        ) * 60);
        
        let period = 'AM';
        if (hours >= 12) {
            period = 'PM';
        }
        if (hours === 0) {
            hours = 12;
        } else if (hours > 12) {
            hours -= 12;
        }
        
        return `${ hours.toString().padStart(2, "0") }:${ _minutes.toString().padStart(2, "0") } ${ period }`;
    }
    
    
    getTimeInMinutes(time: string) {
        // e.g. 08:00 PM
        // consider 12:00 AM as 0 minutes
        
        const [timePart, period] = time.split(' ');
        const [hours, minutes] = timePart.split(':').map(Number);
        
        let minutesInNumbers = hours * 60 + minutes;
        if (period === 'AM' && hours === 12) {
            minutesInNumbers = 0;
        } else if (period === 'PM' && hours == 12) {
            minutesInNumbers = 12 * 60 + minutes;
        } else if (period === 'PM') {
            minutesInNumbers += 12 * 60;
        }
        
        return minutesInNumbers;
    }
    
    
    makeApiUrl(url: string): string {
        return '/api' + url;
    }
    
    
    makeOwnServerUrl(url: string): string {
        return this.serverURL + url;
    }
    
    
    makeUrlQueryString(url: string, urlParams: Record<string, any>): string {
        const queryString = Object.entries(urlParams)
            .map(([key, value]) => `${ key }=${ value }`).join('&');
        if (queryString) {
            url += `?${ queryString }`;
        }
        return url;
    }
    
    
    markAllFormControlsAsTouched(form: FormGroup) {
        Object.values(form.controls).forEach((control) => {
            control.markAllAsTouched();
            control.markAsDirty();
        });
        form.patchValue(form.value);
        return form;
    }
    
    
    setAuthorizationToken(token: string): void {
        if (this.cookie.check('Authorization')) {
            this.cookie.delete('Authorization', '/');
        }
        this.cookie.set('Authorization', token, 365, '/');
    }
    
    
    setCurrentUser(userType: 'g' | 'p' | 'd' | 'a'): void {
        this.currentUser = userType;
        if (this.cookie.check('userType')) {
            this.cookie.delete('userType', '/');
        }
        this.cookie.set('userType', userType, 365, '/');
    }
    
    
    toNumber(value: any): number {
        if (typeof value === 'number') {
            return value;
        }
        return parseFloat(value);
    }
    
    
    transformJsonCamelCaseToSnakeCase(json: Record<string, any>): Record<string, any> {
        const transformedJson: Record<string, any> = {};
        
        Object.entries(json).forEach(([key, value]) => {
            const newKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            transformedJson[newKey] = value;
        });
        
        // also handle numbers, e.g. 1 -> '_1'
        Object.entries(transformedJson).forEach(([key, value]) => {
            if (typeof value === 'number') {
                delete transformedJson[key];
                transformedJson[`_${ key }`] = value;
            }
        });
        
        return transformedJson;
    }
    
    
    transformJsonCamelCaseToSnakeCaseDeep(input: Record<any, any>): Record<any, any> {
        if (Array.isArray(input)) {
            return input.map((item) => this.transformJsonCamelCaseToSnakeCaseDeep(item));
        } else if (input instanceof File) {
            return input;
        } else if (typeof input === 'object' && input !== null) {
            const snakeCaseObject: any = {};
            for (const key in input) {
                if (Object.prototype.hasOwnProperty.call(input, key)) {
                    let snakeCaseKey = key.replace(/[A-Z]/g, (match) => `_${ match.toLowerCase() }`);
                    snakeCaseKey = snakeCaseKey.replace(/([0-9])/g, (match) => `_${ match }`);
                    snakeCaseObject[snakeCaseKey] = this.transformJsonCamelCaseToSnakeCaseDeep(input[key]);
                }
            }
            return snakeCaseObject;
        } else {
            return input;
        }
    }
    
    
    transformJsonSnakeCaseToCamelCase(json: Record<string, any>): Record<string, any> {
        const transformedJson: Record<string, any> = {};
        
        Object.entries(json).forEach(([key, value]) => {
            // if starts with m_ then remove it
            let newKey = key.replace(/^m_/, '');
            // convert snake_case to camelCase
            newKey = newKey.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
            newKey = newKey.replace(/_([0-9])/g, (match, number) => number);
            transformedJson[newKey] = value;
        });
        
        return transformedJson;
    }
    
    
    transformJsonSnakeCaseToCamelCaseDeep(input: Record<any, any>): Record<any, any> {
        if (Array.isArray(input)) {
            return input.map((item) => this.transformJsonSnakeCaseToCamelCaseDeep(item));
        } else if (input instanceof File) {
            return input;
        } else if (typeof input === 'object' && input !== null) {
            const camelCaseObject: any = {};
            for (const key in input) {
                if (Object.prototype.hasOwnProperty.call(input, key)) {
                    // if starts with m_ then remove it
                    const newKey = key.replace(/^m_/, '');
                    // convert snake_case to camelCase
                    let camelCaseKey = newKey.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
                    // convert _1 to 1
                    camelCaseKey = camelCaseKey.replace(/_([0-9])/g, (match, number) => number);
                    camelCaseObject[camelCaseKey] = this.transformJsonSnakeCaseToCamelCaseDeep(input[key]);
                }
            }
            return camelCaseObject;
        } else {
            return input;
        }
    }
    
    
    validateApiUrl(url: string): void {
        if (url[0] !== '/') {
            throw new Error('API url must start with /');
        }
    }
}
