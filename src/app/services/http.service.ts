import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { UtilFuncService } from "./util-func.service";
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { toast } from "ngx-sonner";
import { AuthVerifyLoginsResponse, GetTempTokenResponse } from "../interfaces/api-response-interfaces";
import { env } from "../../env/env";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { take } from "rxjs";

interface JsonResponse {
    data: Record<string, any> | null;
    success: boolean;
    reason: 'FRONTEND' | 'CLIENT' | 'SERVER' | null;
}

@Injectable({
    providedIn: 'root',
})
export class HTTPService {
    public tempLoginToken: string = '';
    takeUntilDestroyed: any;
    
    
    constructor(
        private utils: UtilFuncService,
        public cookies: CookieService,
        private router: Router,
        private http: HttpClient,
    )
    {
        this.takeUntilDestroyed = takeUntilDestroyed();
        console.info('Env', env.prod ? 'prod' : 'dev');
        this.loadTempLoginToken();
    }
    
    
    async loadTempLoginToken() {
        let res = await this.sendRequest({
            url: '/auth/get-temp-token', method: 'GET'
        }) as GetTempTokenResponse | false;
        
        if (res === false) {
            toast.error('Failed to load some data!');
            return;
        }
        
        if (res.tokenNotGenerated) {
            toast.error('Failed to load some data!');
            return;
        }
        this.tempLoginToken = res.token;
    }
    
    
    methodNotAllowedError(xhr: XMLHttpRequest) {
        if (xhr.status === 405) {
            toast.error('An error occurred while processing your request.', {
                description: 'Request method is not allowed. Please try again later.'
            });
            return true;
        }
        return false;
    }
    
    
    public sendMultipartRequest(
        {
            url,
            jsonData = {},
            files,
            method,
            urlParams = {},
            headers = {},
            isOwnServerApiCall = true,
        }: {
            url: string;
            jsonData: Record<string, any>;
            files: Record<string, File | FileList>;
            method: 'POST' | 'PUT';
            urlParams?: Record<string, any>;
            headers?: Record<string, any>;
            isOwnServerApiCall?: boolean;
            showSuccessPopups?: boolean;
        }
    ): Promise<Record<string, any> | false> {
        
        return new Promise((resolve) => {
            const processedUrl = this.processUrl(url, isOwnServerApiCall, urlParams);
            
            let _headers = new HttpHeaders();
            _headers = _headers.set('Authorization', this.cookies.get('Authorization'));
            // append other headers
            Object.entries(headers).forEach(([key, value]) => { _headers = _headers.set(key, value) });
            
            let _method: 'post' | 'put' = method === 'POST' ? 'post' : 'put';
            let formData = new FormData();
            formData.append('json', JSON.stringify(this.utils.transformJsonCamelCaseToSnakeCaseDeep(jsonData)));
            
            files = this.utils.transformJsonCamelCaseToSnakeCaseDeep(files);
            Object.entries(files).forEach(([key, value]) => {
                if (value instanceof FileList) {
                    for (let i = 0; i < value.length; i++) {
                        formData.append(key, value[i]);
                    }
                    return;
                } else if (value instanceof File) {
                    formData.append(key, value);
                }
            });
            
            this.http[_method](processedUrl, formData, { headers: _headers }).pipe(take(1)).subscribe(
                (res: Record<any, any>) => {
                    resolve(this.utils.transformJsonSnakeCaseToCamelCaseDeep(res['data']));
                },
                (err) => {
                    console.error(err.status, 'status', err);
                    if (err.status === 0) {
                        this.handleNetworkError(resolve, null);
                        resolve(false);
                    } else if (err.status === 405) {
                        toast.error('An error occurred while processing your request.', {
                            description: 'Request method is not allowed. Please try again later.'
                        });
                        resolve(false);
                    } else {
                        this.handleErrorResponse(err.error, resolve);
                        resolve(false);
                    }
                }
            )
        });
        
    }
    
    
    public sendRequest(
        {
            url,
            jsonData = {},
            method,
            urlParams = {},
            headers = {},
            isOwnServerApiCall = true,
            retryCount = 2,
        }: {
            url: string;
            jsonData?: object;
            method: 'POST' | 'GET' | 'PUT' | 'DELETE';
            urlParams?: Record<string, any>;
            headers?: Record<string, any>;
            isOwnServerApiCall?: boolean;
            isJsonRequest?: boolean;
            showSuccessPopups?: boolean;
            retryCount?: number;
        }
    ): Promise<Record<string, any> | false> {
        
        return new Promise((resolve) => {
            let retried = 0;
            
            
            let json = this.utils.transformJsonCamelCaseToSnakeCaseDeep(jsonData);
            
            const processedUrl = this.processUrl(url, isOwnServerApiCall, urlParams);
            let send = () => {
                retried++;
                let xhr = this.createXhrObject(method, processedUrl, headers);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.onload = () => this.handleLoad(xhr, isOwnServerApiCall, resolve);
                xhr.onerror = (e) => {
                    if (retried >= retryCount) {
                        this.handleNetworkError(resolve, e.target);
                        return;
                    }
                    send();
                }
                xhr.send(JSON.stringify(json));
            }
            
            send();
        });
    }
    
    
    public async verifyLogins({ showMsg = true }: { showMsg?: boolean }) {
        let res = await this.sendRequest({
            url: '/auth/verify-logins',
            method: 'GET'
        }) as AuthVerifyLoginsResponse | false;
        
        if (res === false) {
            if (showMsg) {
                toast.error('Unable to verify logins. Please try again later.');
            }
            return res;
        }
        
        if (res.invalidLogin) {
            if (showMsg) {
                toast.error('You are not logged in.', {
                    description: 'Please login again.',
                });
            }
            return false;
        } else {
            this.utils.setCurrentUser(res.userType);
            return true;
        }
    }
    
    
    private createFormData(jsonData: Record<string, any>) {
        const formData = new FormData();
        for (const key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                formData.append(key, jsonData[key]);
            }
        }
        return formData;
    }
    
    
    private createXhrObject(method: string, url: string, headers: Record<string, any>) {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.responseType = 'json';
        xhr.setRequestHeader('Authorization', this.cookies.get('Authorization'));
        Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
        return xhr;
    }
    
    
    private handleErrorResponse(response: JsonResponse, resolve: any) {
        const { reason, errors }: any = response;
        if (reason === 'FRONTEND' || reason === 'SERVER') {
            errors.forEach((error: string) => toast.error(error));
            resolve(false);
        }
        if (reason === 'CLIENT') {
            resolve(this.utils.transformJsonSnakeCaseToCamelCaseDeep(response.data as Record<string, any>));
        } else {
            resolve(false);
        }
    }
    
    
    private async handleLoad(
        xhr: XMLHttpRequest,
        isOwnServerApiCall: boolean,
        resolve: any,
    ) {
        if (this.methodNotAllowedError(xhr) ||
            await this.unauthorizedAccessError(xhr, isOwnServerApiCall, resolve)) {
            resolve(false);
            return;
        }
        
        if (
            isOwnServerApiCall &&
            (
                xhr.response.reason === 'FRONTEND' || xhr.response.reason === 'SERVER'
            )
        ) {
            this.handleErrorResponse(xhr.response, resolve);
            resolve(false);
            return;
            
        } else if (isOwnServerApiCall) {
            resolve(this.utils.transformJsonSnakeCaseToCamelCaseDeep(xhr.response.data));
            return;
            
        } else {
            resolve(xhr.response);
            return;
        }
    }
    
    
    private handleNetworkError(resolve: any, err: EventTarget | null) {
        
        toast.error(
            'Network error. Please try again later!'
        );
        resolve(false);
    }
    
    
    private processUrl(url: string, isOwnServerApiCall: boolean, urlParams: Record<string, any>) {
        this.utils.validateApiUrl(url);
        url = isOwnServerApiCall ? this.utils.makeOwnServerUrl(this.utils.makeApiUrl(url)) : url;
        return this.utils.makeUrlQueryString(url, urlParams);
    }
    
    
    private async unauthorizedAccessError(
        xhr: XMLHttpRequest,
        isOwnServerApiCall: boolean,
        resolve: any,
    ) {
        if (xhr.status !== 401) {
            return false;
        }
        
        if (!isOwnServerApiCall) {
            toast.error('Unauthorized access. Please try again later.');
            console.error('Unauthorized access', xhr.responseURL, xhr.response);
            resolve(false);
            return true;
        }
        
        if (typeof xhr.response !== 'object' || !xhr.response.reason) {
            toast.error('Unauthorized access. Please try again later.');
            console.error('Unknown unauthorized access', xhr.responseURL, xhr.response);
            resolve(false);
            return true;
        }
        let res = this.utils.transformJsonSnakeCaseToCamelCase(xhr.response.data) as {
            userDoesNotExist: boolean,
            moduleNotAllowed: boolean,
            accountSuspended: boolean,
        }
        
        if (res.userDoesNotExist) {
            toast.error(
                'User does not exist. Please try logging in again.',
            );
            await this.router.navigate(['/login']);
            
        } else if (res.moduleNotAllowed) {
            toast.error(
                'You are not authorized to access this module.',
            );
            
        } else if (res.accountSuspended) {
            toast.error(
                'Your account has been suspended.',
            );
            toast.error(
                'Please contact support for more information.',
            );
            await this.router.navigate(['/login']);
            
        } else {
            toast.error(
                'You are not authorized to access this resource.',
            );
        }
        resolve(false);
        return true;
    }
}
