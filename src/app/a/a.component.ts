import { AfterViewInit, Component } from '@angular/core';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ChildrenOutletContexts, RouterOutlet } from '@angular/router';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { blurTransformAnimation } from '../services/animations';
import { HtmlService } from "../services/html.service";

@Component({
    selector: 'app-a',
    standalone: true,
    imports: [SidebarComponent, RouterOutlet, LoadingBarRouterModule],
    templateUrl: './a.component.html',
    styleUrl: './a.component.scss',
    animations: [blurTransformAnimation],
})
export class AComponent implements AfterViewInit {
    constructor(
        private html: HtmlService,
        private contexts: ChildrenOutletContexts
    ) {}
    
    
    ngAfterViewInit(): void {
        this.html.body().classList.remove('lg:pt-[142px]');
        this.html.body().classList.remove('pt-[100px]');
        this.html.body().classList.remove('bg-primarys');
    }
    
    
    getRouteAnimationData() {
        return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
    }
}
