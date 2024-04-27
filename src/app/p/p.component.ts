import { AfterViewInit, Component } from '@angular/core';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ChildrenOutletContexts, RouterOutlet } from '@angular/router';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { blurTransformAnimation } from '../services/animations';
import { HtmlService } from "../services/html.service";

@Component({
    selector: 'app-p',
    standalone: true,
    imports: [NavbarComponent, SidebarComponent, RouterOutlet, LoadingBarRouterModule],
    templateUrl: './p.component.html',
    styleUrl: './p.component.scss',
    animations: [blurTransformAnimation],
})
export class PComponent implements AfterViewInit {
    oldRouterAnimationState = false;
    
    
    constructor(
        private html: HtmlService,
        private contexts: ChildrenOutletContexts
    ) {
    }
    
    
    ngAfterViewInit(): void {
        this.html.body().classList.remove('lg:pt-[142px]');
        this.html.body().classList.remove('pt-[100px]');
        this.html.body().classList.remove('bg-primarys');
    }
    
    
    getRouteAnimationData() {
        // this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation']
        if (this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'] == 'login') {
            return this.oldRouterAnimationState;
        } else {
            this.oldRouterAnimationState = this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
            return this.oldRouterAnimationState;
        }
    }
}
