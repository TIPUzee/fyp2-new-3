import { Injectable } from '@angular/core';
import { HTTPService } from "./http.service";
import { Subject } from "rxjs";
import { Language } from "../interfaces/interfaces";
import { LoadLanguagesResponse } from "../interfaces/api-response-interfaces";
import { toast } from "ngx-sonner";

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private change = new Subject<void>();
    public change$ = this.change.asObservable();
    
    public languages: Language[] = [];
    
    
    constructor(
        private http: HTTPService,
    ) {
        this.loadFromServer();
    }
    
    
    public get({ id, title }: { id?: number, title?: string }): Language | undefined {
        if (id) {
            return this.languages.find((lang) => lang.id === id);
        }
        if (title) {
            return this.languages.find((lang) => lang.title === title);
        }
        return undefined;
    }
    
    
    public getAll(): Language[] {
        return this.languages;
    }
    
    
    public has({ id, title }: { id?: number, title?: string }): boolean {
        if (id) {
            return this.languages.some((lang) => lang.id === id);
        }
        if (title) {
            return this.languages.some((lang) => lang.title === title);
        }
        return false;
    }
    
    
    private async loadFromServer() {
        let res = await this.http.sendRequest({
            url: '/languages',
            method: 'GET'
        }) as LoadLanguagesResponse | false;
        
        if (res === false) {
            toast.error('Failed to fetch languages');
            console.error('Error occurred while sending request to /languages', res);
            return;
        }
        
        for (let lang of res.languages) {
            this.languages.push({
                id: lang.id,
                title: lang.title
            });
        }
        this.change.next();
    }
}
