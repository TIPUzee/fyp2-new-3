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
    ) {
        this.takeUntilDestroyed = takeUntilDestroyed();
        console.info('Env', env.prod ? 'prod' : 'dev');
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
            retryCount = 2,
            redirectToLoginOnUnauthorized = true,
        }: {
            url: string;
            jsonData: Record<string, any>;
            files: Record<string, File | FileList>;
            method: 'POST' | 'PUT';
            urlParams?: Record<string, any>;
            headers?: Record<string, any>;
            showSuccessPopups?: boolean;
            retryCount?: number;
            redirectToLoginOnUnauthorized?: boolean;
        }
    ): Promise<Record<string, any> | false> {
        
        return new Promise((resolve) => {
            let retried = 0;
            
            const send = () => {
                const processedUrl = this.processUrl(url, urlParams);
                
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
                        if (retried >= retryCount) {
                            if (err.status === 0) {
                                this.handleNetworkError(resolve, null);
                                resolve(false);
                            } else if (err.status === 405) {
                                toast.error('An error occurred while processing your request.', {
                                    description: 'Request method is not allowed. Please try again later.'
                                });
                                resolve(false);
                            } else if (err.status === 401) {
                                this.unauthorizedAccessError(
                                    err.error,
                                    err.status,
                                    err.url,
                                    resolve,
                                    redirectToLoginOnUnauthorized
                                );
                                resolve(false);
                            } else {
                                this.handleErrorResponse(err.error, resolve);
                                resolve(false);
                            }
                        } else {
                            retried++;
                            send();
                        }
                    },
                )
            }
            
            send();
        });
        
    }
    
    
    public sendRequest(
        {
            url,
            jsonData = {},
            method,
            urlParams = {},
            headers = {},
            retryCount = 2,
            redirectToLoginOnUnauthorized = true,
        }: {
            url: string;
            jsonData?: object;
            method: 'POST' | 'GET' | 'PUT' | 'DELETE';
            urlParams?: Record<string, any>;
            headers?: Record<string, any>;
            isJsonRequest?: boolean;
            showSuccessPopups?: boolean;
            retryCount?: number;
            redirectToLoginOnUnauthorized?: boolean;
        }
    ): Promise<Record<string, any> | false> {
        
        return new Promise((resolve) => {
            let retried = 0;
            
            let json = this.utils.transformJsonCamelCaseToSnakeCaseDeep(jsonData);
            
            const processedUrl = this.processUrl(url, urlParams);
            const send = () => {
                retried++;
                let xhr = this.createXhrObject(method, processedUrl, headers);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.onload = () => this.handleLoad(xhr, resolve, redirectToLoginOnUnauthorized);
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
    
    
    public async verifyLogins({ showMsg = true, redirectToLoginOnUnauthorized = false, }: {
        showMsg?: boolean,
        redirectToLoginOnUnauthorized?: boolean
    }) {
        
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
            if (redirectToLoginOnUnauthorized) {
                await this.router.navigate(['/login']);
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
        resolve: any,
        redirectToLoginOnUnauthorized: boolean,
    ) {
        if (this.methodNotAllowedError(xhr) ||
            await this.unauthorizedAccessError(xhr.response, xhr.status, xhr.responseURL,
                resolve, redirectToLoginOnUnauthorized
            )) {
            resolve(false);
            return;
        }
        
        if (xhr.response.reason === 'FRONTEND' || xhr.response.reason === 'SERVER') {
            this.handleErrorResponse(xhr.response, resolve);
            resolve(false);
            return;
        } else {
            resolve(this.utils.transformJsonSnakeCaseToCamelCaseDeep(xhr.response.data));
            return;
        }
    }
    
    
    private handleNetworkError(resolve: any, err: EventTarget | null) {
        toast.error(
            'Network error. Please try again later!'
        );
        resolve(false);
    }
    
    
    private processUrl(url: string, urlParams: Record<string, any>) {
        this.utils.validateApiUrl(url);
        url = this.utils.makeOwnServerUrl(this.utils.makeApiUrl(url));
        return this.utils.makeUrlQueryString(url, urlParams);
    }
    
    
    private async unauthorizedAccessError(
        response: {
            reason: string,
            data: { userDoesNotExist: boolean, moduleNotAllowed: boolean, accountSuspended: boolean }
        },
        status: number,
        url: string,
        resolve: any,
        redirectToLoginOnUnauthorized: boolean,
    ) {
        if (status !== 401) {
            return false;
        }
        
        if (typeof response !== 'object') {
            toast.error('Unauthorized access. Please try again later.');
            console.error('Unknown unauthorized access', url, response);
            resolve(false);
            return true;
        }
        
        let res = this.utils.transformJsonSnakeCaseToCamelCase(response.data) as {
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
            if (redirectToLoginOnUnauthorized) {
                if (!await this.verifyLogins({ showMsg: true, redirectToLoginOnUnauthorized: true })) {
                    resolve(false);
                    return true;
                }
            }
            toast.error(
                'You are not authorized to access this module.',
            );
            resolve(false);
            return true;
            
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
