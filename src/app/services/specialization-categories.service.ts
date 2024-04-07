import { Injectable } from '@angular/core';
import { HTTPService } from "./http.service";
import { Subject } from "rxjs";
import { SpecializationCategory } from "../interfaces/interfaces";
import { LoadSpecializationCategoriesResponse } from "../interfaces/api-response-interfaces";

@Injectable({
    providedIn: 'root'
})
export class SpecializationCategoriesService {
    private change = new Subject<void>();
    change$ = this.change.asObservable();
    
    public list: SpecializationCategory[] = [];
    
    
    constructor(
        private http: HTTPService,
    ) {
        this.load();
    }
    
    
    async load() {
        let res = await this.http.sendRequest({
            url: '/specialization-categories',
            method: 'GET',
        }) as LoadSpecializationCategoriesResponse | false;
        
        if (res === false) {
            return false;
        }
        
        this.list = []
        for (let i = 0; i < res.categories.length; i++) {
            this.list.push({
                id: res.categories[i].id,
                title: res.categories[i].title,
            });
        }
        this.change.next();
        return true;
    };
}
