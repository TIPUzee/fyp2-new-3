import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { faAngleLeft, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HtmlService } from '../../../services/html.service';
import { DoctorProfileService } from '../../../services/doctor-profile.service';
import { ModalComponent } from "../../../utils/components/modal/modal.component";
import { FormSubmitButtonComponent } from "../../../utils/components/form-submit-button/form-submit-button.component";
import { UtilFuncService } from "../../../services/util-func.service";

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, FontAwesomeModule, ModalComponent, FormSubmitButtonComponent],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements AfterViewInit {
    //
    // Icons
    faAngleLeft = faAngleLeft;
    faRightFromBracket = faRightFromBracket;
    //
    // State variables
    name: string = '';
    nameFirstLetter: string = '';
    //
    // View Child Elements
    @ViewChild('sidebarToggler') sidebarToggler!: ElementRef<HTMLDivElement>;
    @ViewChild('sidebar') sidebar!: ElementRef<HTMLDivElement>;
    
    
    
    constructor(
        public profile: DoctorProfileService,
        private router: Router,
        private html: HtmlService,
        private utils: UtilFuncService,
    ) {
        this.name = this.profile.details.name;
        if (this.name) {
            this.nameFirstLetter = this.name[0].toUpperCase();
        }
        this.profile.change$.subscribe(() => {
            this.name = this.profile.details.name;
            if (this.name) {
                this.nameFirstLetter = this.name[0].toUpperCase();
            }
        })
    }
    
    
    ngAfterViewInit(): void {
        this.enableResposiveness();
    }
    
    
    enableResposiveness(): void {
        this.html.addWindowWidthResizeEventListener((h: number, w: number) => {
            if (w < 1280) {
                this.sidebar.nativeElement.classList.add('!w-0');
                this.sidebarToggler.nativeElement.classList.add('closed');
            } else {
                this.sidebar.nativeElement.classList.remove('!w-0');
                this.sidebarToggler.nativeElement.classList.remove('closed');
            }
        }, true);
    }
    
    
    logout(): void {
        this.utils.setCurrentUser('g');
        this.utils.setAuthorizationToken('');
        this.router.navigate(['/login']);
    }
}
