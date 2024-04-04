import { AfterViewInit, Component } from '@angular/core';
import { HtmlService } from '../../services/html.service';
import anime from 'animejs';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-reset',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './reset.component.html',
    styleUrl: './reset.component.scss',
})
export class ResetComponent implements AfterViewInit {
    constructor(private htmlService: HtmlService) {
        // initTE({ Input, Ripple });
    }
    
    
    ngAfterViewInit(): void {
        this.htmlService.initTailwindElements();
        this.htmlService.scrollToTop();
    }
    
    
    animateDropdown(): void {
        anime({
            targets: '[data-te-select-dropdown-container-ref=""]',
            translateX: [{ value: -80 }, { value: 0, duration: 700 }],
            opacity: [{ value: 0 }, { value: 1, duration: 300 }],
            easing: 'easeOutQuad',
        });
    }
}
