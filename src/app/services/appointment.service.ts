import { Injectable } from '@angular/core';
import { HTTPService } from "./http.service";
import { UtilFuncService } from "./util-func.service";
import { Subject } from "rxjs";
import { toast } from "ngx-sonner";
import { Appointment, AppointmentStatus } from "../interfaces/interfaces";
import { LoadAppointmentsResponse } from "../interfaces/api-response-interfaces";

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {
    private change = new Subject<void>();
    public change$ = this.change.asObservable();
    
    public list: Appointment[] = [];
    
    
    constructor(
        private http: HTTPService,
        private utils: UtilFuncService
    ) {
        this.loadFromServer();
    }
    
    
    public async loadFromServer(
        { id, status } : { id?: number[], status?: AppointmentStatus[] } = {}
    ) {

        let data = {
            id,
            status,
        };
        
        let res = await this.http.sendRequest({
            url: '/appointments',
            method: 'POST',
            jsonData: data,
        }) as LoadAppointmentsResponse | false;

        if (res === false) {
            toast.error('Failed to load some data');
            console.error('Error occurred while sending request to /appointments', data, res);
            return;
        }
        
        for (const appointment of res.appointments) {
            // check if the appointment is already in the list
            // remove the current appointment from the list
            if (this.list.some((a) => a.id === appointment.id)) {
                this.list = this.list.filter((a) => a.id !== appointment.id);
            }
            
            let doctor = appointment.hasOwnProperty('doctor') ? appointment['doctor'] : null;
            let patient = appointment.hasOwnProperty('patient') ? appointment['patient'] : null;
            this.list.push({
                id: appointment.id,
                doctorId: appointment.doctorId,
                patientId: appointment.patientId,
                symptomDescription: appointment.symptomDescription,
                timeFrom: new Date(appointment.timeFrom),
                timeTo: new Date(appointment.timeTo),
                paidAmount: appointment.paidAmount,
                status: appointment.status,
                statusChangeTime: new Date(appointment.statusChangeTime),
                delayCountByDoc: appointment.delayCountByDoc,
                rescheduleCountByPat: appointment.rescheduleCountByPat,
                paymentTime: new Date(appointment.paymentTime),
                doctorReport: appointment.doctorReport,
                patientReview: appointment.patientReview,
                rating: appointment.rating,
                secretCode: appointment.hasOwnProperty('secretCode') ? appointment.secretCode : '',
                refundedAmount: appointment.refundedAmount,
                doctor: doctor ? {
                    id: doctor.id,
                    name: doctor.name,
                } : null,
                patient: patient ? {
                    id: patient.id,
                    name: patient.name,
                    whatsappNumber: patient.whatsappNumber,
                    dob: this.utils.convertToDMTDateObject(
                        // @ts-ignore
                        patient.dob
                    ),
                } : null
            });
        }
        this.change.next();
    }
}
