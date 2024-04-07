import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { RouterLink } from '@angular/router';
import { HtmlService } from '../../../services/html.service';
import { RatingStarsComponent } from '../../../utils/components/rating-stars/rating-stars.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { AppointmentService } from "../../../services/appointment.service";
import { Appointment } from "../../../interfaces/interfaces";
import { AppointmentDurationPipe } from "../../../pipes/appointment-duration.pipe";
import { DatetimePipe } from "../../../pipes/datetime.pipe";
import { FormSubmitButtonComponent } from "../../../utils/components/form-submit-button/form-submit-button.component";
import { DobPipe } from "../../../pipes/dob.pipe";

@Component({
    selector: 'app-completed-appointments',
    standalone: true,
    imports: [
        CommonModule, RouterLink, RatingStarsComponent, FontAwesomeModule, AppointmentDurationPipe, DatetimePipe,
        FormSubmitButtonComponent, DobPipe
    ],
    templateUrl: './completed-appointments.component.html',
    styleUrl: './completed-appointments.component.scss',
})
export class CompletedAppointmentsComponent implements AfterViewInit {
    //
    // icons
    faArrowUpRightFromSquare = faArrowUpRightFromSquare;
    //
    // State variables
    appointments: Appointment[] = [];
    
    
    constructor(
        public commonService: CommonService,
        private html: HtmlService,
        private allAppointments: AppointmentService,
    ) {}
    
    
    ngAfterViewInit(): void {
        this.appointments = this.allAppointments.list.filter(appointment => appointment.status === 'COMPLETED');
        this.allAppointments.change$.subscribe(() => {
            this.appointments = this.allAppointments.list.filter(appointment => appointment.status === 'COMPLETED');
        })
        
        this.html.initTailwindElements();
    }
}
