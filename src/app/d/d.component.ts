import { AfterViewInit, Component } from '@angular/core';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ChildrenOutletContexts, RouterOutlet } from '@angular/router';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { blurTransformAnimation } from '../services/animations';
import { HtmlService } from "../services/html.service";

@Component({
    selector: 'app-d',
    standalone: true,
    imports: [NavbarComponent, SidebarComponent, RouterOutlet, LoadingBarRouterModule],
    templateUrl: './d.component.html',
    styleUrl: './d.component.scss',
    animations: [blurTransformAnimation],
})
export class DComponent implements AfterViewInit {
    constructor(
        private html: HtmlService,
        private contexts: ChildrenOutletContexts
    ) {
    }
    
    
    public ngAfterViewInit(): void {
        this.html.body().classList.remove('lg:pt-[142px]');
        this.html.body().classList.remove('pt-[100px]');
        this.html.body().classList.remove('bg-primarys');
    }
    
    
    getRouteAnimationData() {
        return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
    }
}
