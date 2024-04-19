import { Injectable } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from "@angular/forms";
import { HTTPService } from "./http.service";
import { UtilApisService } from "./util-apis.service";
import { VideoExtensions } from "../constants/constants";

@Injectable({
    providedIn: 'root'
})
export class FormValidatorsService {
    
    constructor(private http: HTTPService, private user: UtilApisService) { }
    
    
    atLeastMustContainAlphaNumeric(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            
            if (!value) {
                return null;
            }
            
            if (/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(value)) {
                return null;
            } else {
                return { atLeastMustContainAlphaNumeric: true };
            }
        };
    }
    
    
    atLeastOneLowercaseAndOneUppercase(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            
            if (!value) {
                return null;
            }
            
            if (/^(?=.*[a-z])(?=.*[A-Z])/.test(value)) {
                return null;
            } else {
                return { atLeastOneLowercaseAndOneUppercase: true };
            }
        };
    }
    
    
    customRequired({ ignoreValues, requireCondition }: {
        ignoreValues?: () => string[],
        requireCondition?: (control: AbstractControl) => boolean
    }): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            
            if (requireCondition && !requireCondition(control)) {
                return null;
            }
            
            if (ignoreValues && ignoreValues().includes(value)) {
                return null;
            } else if (!value) {
                return { required: true };
            }
            
            return null;
        }
    }
    
    
    date(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            
            if (!value) {
                return null;
            }
            
            const dateFormatRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
            
            if (dateFormatRegex.test(value)) {
                return null;
            } else {
                return { date: true };
            }
        };
    }
    
    
    dateMustBeBefore({ years }: { years: number }): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            const valueDate = new Date(value);
            const yearsAgoDate = new Date();
            yearsAgoDate.setFullYear(yearsAgoDate.getFullYear() - years);
            
            if (valueDate >= yearsAgoDate) {
                return { dateMustBeBefore: true };
            } else {
                return null;
            }
        };
    }
    
    
    email(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            
            if (!value) {
                return null;
            }
            
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            
            if (emailRegex.test(value)) {
                return null;
            } else {
                return { email: true };
            }
        };
    }
    
    
    emailMustExist(ignoreEmails?: () => string[]): AsyncValidatorFn {
        return this.emailMustOrMustNotExist(ignoreEmails, true);
    }
    
    
    emailMustNotExist(ignoreEmails?: () => string[]): AsyncValidatorFn {
        return this.emailMustOrMustNotExist(ignoreEmails, false);
    }
    
    
    fileExtension(extensions: string[]): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value: File = control.value;
            
            if (!value) {
                return null;
            }
            
            const extension = value.name.split('.').pop();
            
            if (extension && extensions.includes(extension)) {
                return null;
            }
            
            return { fileExtension: true };
        };
    }
    
    
    filesExtension(extensions: string[]): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value: FileList = control.value;
            
            if (!value) {
                return null;
            }
            
            for (let i = 0; i < value.length; i++) {
                const extension = value[i].name.split('.').pop();
                
                if (!extension || !extensions.includes(extension)) {
                    return { filesExtension: true };
                }
            }
            
            return null;
        };
    }
    
    
    isAuthCodeValid(): AsyncValidatorFn {
        return (control: AbstractControl): Promise<ValidationErrors | null> => {
            return new Promise(async (resolve) => {
                let count = 0;
                let func = async () => {
                    if (count === 2) {
                        count = 0;
                        return resolve({ tryAgain: true });
                    }
                    count++;
                    
                    let res = await this.user.isAuthCodeValid(control.value);
                    
                    if (res === null) {
                        return func();
                    }
                    
                    if (res) {
                        return resolve(null);
                    } else {
                        return resolve({ isAuthCodeValid: true });
                    }
                }
                return await func();
            })
        }
    }
    
    
    leadingSpaces(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            
            if (!value) {
                return null;
            }
            
            const trimmedValue = value.trim();
            
            if (value === trimmedValue) {
                return null;
            } else {
                return { leadingSpaces: true };
            }
        };
    }
    
    
    matchWith(matchControlName: string): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            const matchControl = control.parent?.get(matchControlName);
            const matchValue = matchControl?.value;
            
            if (value === matchValue) {
                return null;
            }
            
            let errorKey: string = matchControlName[0].toUpperCase() + matchControlName.slice(1);
            errorKey = `matchWith${ errorKey }`;
            let _: Record<string, boolean> = {};
            _[errorKey] = true;
            return _;
        };
    }
    
    
    name(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            
            if (!value) {
                return null;
            }
            
            if (/^[a-zA-Z\s]*$/.test(value)) {
                return null;
            } else {
                return { name: true };
            }
        };
    }
    
    
    noSpecialCharactersOtherThanDefinedForPassword(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            
            if (!value) {
                return null;
            }
            
            const allowedSpecialCharactersRegex = /^[A-Za-z\d@$!%*?&_-]+$/;
            
            if (allowedSpecialCharactersRegex.test(value)) {
                return null;
            } else {
                return { noSpecialCharactersOtherThanDefinedForPassword: true };
            }
        };
    }
    
    
    numeric(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            
            if (!value) {
                return null;
            }
            
            if (/^\d+$/.test(value)) {
                return null;
            } else {
                return { numeric: true };
            }
        };
    }
    
    
    time(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            
            if (!value) {
                return null;
            }
            
            const timeFormatRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
            
            if (timeFormatRegex.test(value)) {
                return null;
            } else {
                return { time: true };
            }
        };
    }
    
    
    timeMultipleOf15Minutes(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            
            if (!value) {
                return null;
            }
            
            const time = value.split(' ')[0];
            const minutes = time.split(':')[1];
            
            if (Number(minutes) % 15 === 0) {
                return null;
            } else {
                return { timeMultipleOf15Minutes: true };
            }
        };
    }
    
    
    whatsappNumberMustExist(): AsyncValidatorFn {
        return this.whatsappNumberMustOrMustNotExist(undefined, true);
    }
    
    
    whatsappNumberMustNotExist(ignoreWhatsappNumbers?: () => string[]): AsyncValidatorFn {
        return this.whatsappNumberMustOrMustNotExist(ignoreWhatsappNumbers, false);
    }
    
    
    private emailMustOrMustNotExist(ignoreEmails?: () => string[], mustExist: boolean = true): AsyncValidatorFn {
        return (control: AbstractControl): Promise<ValidationErrors | null> => {
            return new Promise(async (resolve) => {
                if (ignoreEmails) {
                    let email = ignoreEmails();
                    if (email.includes(control.value)) {
                        return resolve(null);
                    }
                }
                let res = await this.user.emailExists(control.value);
                
                if (res === null) {
                    return { networkError: true };
                }
                
                if (res) {
                    if (mustExist) {
                        return resolve(null);
                    } else {
                        return resolve({ emailMustNotExist: true });
                    }
                } else {
                    if (mustExist) {
                        return resolve({ emailMustExist: true });
                    } else {
                        return resolve(null);
                    }
                }
            })
        }
        
    }
    
    
    private whatsappNumberMustOrMustNotExist(
        ignoreWhatsappNumbers?: () => string[],
        mustExist: boolean = true
    ): AsyncValidatorFn {
        
        return (control: AbstractControl): Promise<ValidationErrors | null> => {
            return new Promise(async (resolve) => {
                if (ignoreWhatsappNumbers) {
                    let whatsappNumber = ignoreWhatsappNumbers();
                    if (whatsappNumber.includes(control.value)) {
                        return resolve(null);
                    }
                }
                let res = await this.user.whatsappNumberExists(control.value);
                
                if (res === null) {
                    return { networkError: true };
                }
                
                if (res) {
                    if (mustExist) {
                        return resolve(null);
                    } else {
                        return resolve({ whatsappNumberMustNotExist: true });
                    }
                } else {
                    if (mustExist) {
                        return resolve({ whatsappNumberMustExist: true });
                    } else {
                        return resolve(null);
                    }
                }
            })
        }
    }
    
    
    videoFile(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value: File = control.value;
            
            if (!value) {
                return null;
            }
            
            const extension = value.name.split('.').pop();
            
            if (extension && VideoExtensions.includes(`.${extension}`)) {
                return null;
            }
            
            return { videoFile: true };
        };
    }
    
    fileMaxSize(maxSize: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value: File = control.value;
            
            if (!value) {
                return null;
            }
            
            if ((value.size / 1024 / 1024) <= maxSize) {
                return null;
            }
            
            return { fileMaxSize: true };
        };
    }
    
    
    phoneNumberFormat(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            
            if (!value) {
                return null;
            }
            
            const phoneNumberRegex = /^\+[1-9]\d{1,14}$/;
            
            if (phoneNumberRegex.test(value)) {
                return null;
            } else {
                return { phoneNumberFormat: true };
            }
        };
    }
}
