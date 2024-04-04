import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { faAngleLeft, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PatientProfileService } from '../../../services/patient-profile.service';
import { HtmlService } from '../../../services/html.service';
import { HTTPService } from "../../../services/http.service";
import { UtilFuncService } from "../../../services/util-func.service";
import { FormSubmitButtonComponent } from "../../../utils/components/form-submit-button/form-submit-button.component";
import { ModalComponent } from "../../../utils/components/modal/modal.component";

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, FontAwesomeModule, FormSubmitButtonComponent, ModalComponent],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements AfterViewInit {
    @ViewChild('sidebar_toggler') sidebar_toggler!: ElementRef<HTMLDivElement>;
    @ViewChild('sidebar') sidebar!: ElementRef<HTMLDivElement>;
    
    faAngleLeft = faAngleLeft;
    faRightFromBracket = faRightFromBracket;
    
    
    constructor(
        protected profile: PatientProfileService,
        private html: HtmlService,
        protected http: HTTPService,
        private utils: UtilFuncService,
        private router: Router
    ) {
    }
    
    
    ngAfterViewInit(): void {
        this.enableResponsiveness();
    }
    
    
    enableResponsiveness(): void {
        this.html.addWindowWidthResizeEventListener((h: number, w: number) => {
            if (w < 1280) {
                this.sidebar.nativeElement.classList.add('!w-0');
                this.sidebar_toggler.nativeElement.classList.add('closed');
            } else {
                this.sidebar.nativeElement.classList.remove('!w-0');
                this.sidebar_toggler.nativeElement.classList.remove('closed');
            }
        }, true);
    }
    
    
    logout(): void {
        this.utils.setCurrentUser('g');
        this.utils.setAuthorizationToken('');
        this.router.navigate(['/login']);
    }
}
