import { Injectable } from '@angular/core';
import { HTTPService } from "./http.service";
import { UtilFuncService } from "./util-func.service";
import { toast} from "ngx-sonner";

@Injectable({
    providedIn: 'root'
})
export class AvailabilityDurationsService {
    
    constructor(
        private http: HTTPService,
        private utils: UtilFuncService
    ) { }
    
    
    public async retrieve(
        doctorId: number,
        callback: (durations: {
            doctorId: number,
            from: number,
            to: number,
            enabled: boolean
        }[] | false) => void
    ) {
        let jsonData: any = { doctorIds: [doctorId] };
        jsonData = this.utils.transformJsonCamelCaseToSnakeCase(jsonData);
        
        let res = await this.http.sendRequest({
            url: '/availability-durations',
            method: 'POST',
            jsonData: jsonData
        })
        if (!res) {
            toast.error(
                'Failed to fetch doctor-details\'s availability durations'
            )
            return;
        }
        let durations: {
            m_id: number,
            m_doctor_id: number,
            m_from: number,
            m_to: number,
            m_enabled: boolean
        }[] = res['durations'];
        
        if (durations.length === 0) {
            return callback(false);
        } else {
            let ret: {
                doctorId: number,
                from: number,
                to: number,
                enabled: boolean
            }[] = [];
            durations.forEach((d) => {
                ret.push({
                    doctorId: d.m_doctor_id,
                    from: d.m_from,
                    to: d.m_to,
                    enabled: d.m_enabled
                });
            });
            return callback(ret);
        }
    }
    
}
