import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { faAngleLeft, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HtmlService } from '../../../services/html.service';
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
    @ViewChild('sidebarToggler') sidebarToggler!: ElementRef<HTMLDivElement>;
    @ViewChild('sidebar') sidebar!: ElementRef<HTMLDivElement>;
    
    faAngleLeft = faAngleLeft;
    faRightFromBracket = faRightFromBracket;
    
    
    constructor(
        private html: HtmlService,
        private utils: UtilFuncService,
        private router: Router
    ) {}
    
    
    ngAfterViewInit(): void {
        this.html.initTailwindElements();
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
