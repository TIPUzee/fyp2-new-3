import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { RouterLink } from '@angular/router';
import { HtmlService } from '../../../services/html.service';
import { RatingStarsComponent } from '../../compo/rating-stars/rating-stars.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { ModalComponent } from '../../../utils/components/modal/modal.component';
import { Appointment } from "../../../interfaces/interfaces";
import { AppointmentService } from "../../../services/appointment.service";
import { DatetimePipe } from "../../../pipes/datetime.pipe";
import { AppointmentDurationPipe } from "../../../pipes/appointment-duration.pipe";

@Component({
    selector: 'app-appointments',
    standalone: true,
    imports: [
        CommonModule, RouterLink, RatingStarsComponent, FontAwesomeModule, ModalComponent, DatetimePipe,
        AppointmentDurationPipe
    ],
    templateUrl: './appointments.component.html',
    styleUrl: './appointments.component.scss',
})
export class AppointmentsComponent implements AfterViewInit {
    //
    // State variables
    selectedAppointmentId: number = -1;
    appointments: Appointment[] = [];
    //
    // Icons
    faCircleQuestion = faCircleQuestion;
    
    
    constructor(
        public common: CommonService,
        protected allAppointments: AppointmentService,
        private html: HtmlService,
    ) {}
    
    
    ngAfterViewInit(): void {
        this.appointments = this.allAppointments.list;
        this.allAppointments.change$.subscribe(() => {
            this.appointments = this.allAppointments.list;
            this.html.initTailwindElements();
        })
        this.html.initTailwindElements();
    }
}
