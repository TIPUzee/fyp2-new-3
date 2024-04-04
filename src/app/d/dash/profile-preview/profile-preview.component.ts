import { Component } from '@angular/core';
import { DoctorDetailsComponent } from '../../../p/dash/doctor-details/doctor-details.component';
import { DoctorProfileService } from "../../../services/doctor-profile.service";

@Component({
    selector: 'app-profile-preview',
    standalone: true,
    imports: [DoctorDetailsComponent],
    templateUrl: './profile-preview.component.html',
    styleUrl: './profile-preview.component.scss',
})
export class ProfilePreviewComponent {
    //
    // State variables
    doctorId: number = -1;
    constructor(protected profile: DoctorProfileService) {
        this.doctorId = this.profile.details.id;
        this.profile.change$.subscribe(() => {
            this.doctorId = this.profile.details.id;
        })
    }
}
