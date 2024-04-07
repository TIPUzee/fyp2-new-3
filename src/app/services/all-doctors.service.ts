import { Injectable } from '@angular/core';
import { HTTPService } from "./http.service";
import { Doctor } from "../interfaces/interfaces";
import { Subject } from "rxjs";
import { GetAllDoctorsResponse } from "../interfaces/api-response-interfaces";
import { UtilFuncService } from "./util-func.service";

@Injectable({
    providedIn: 'root'
})
export class AllDoctorsService {
    private change = new Subject<void>();
    change$ = this.change.asObservable();
    
    list: Doctor[] = [];
    
    
    constructor(
        private http: HTTPService,
        private utils: UtilFuncService,
    ) {
        this.loadFromServer();
    }
    
    
    async loadFromServer() {
        const res = await this.http.sendRequest({
            method: 'GET',
            url: '/doctors',
        }) as GetAllDoctorsResponse | false;
        
        if (!res) return false;
        
        this.list = res.list;
        for (let i = 0; i < this.list.length; i++) {
            this.list[i].profilePicFilename = this.utils.makeOwnServerUrl(`/api/file/${ this.list[i].profilePicFilename }`);
            this.list[i].coverPicFilename = this.utils.makeOwnServerUrl(`/api/file/${ this.list[i].coverPicFilename }`);
        }
        this.change.next();
        return true;
    }
}
