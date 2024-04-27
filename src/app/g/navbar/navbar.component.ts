import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, ViewportScroller } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFacebookF, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faBars, faXmark, faTerminal } from '@fortawesome/free-solid-svg-icons';
import anime from 'animejs/lib/anime.es.js';
import { AnimeInstance } from 'animejs';
import { HtmlService } from '../../services/html.service';
import { RouterLink } from '@angular/router';
import { UtilFuncService } from "../../services/util-func.service";

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [FontAwesomeModule, RouterLink, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements AfterViewInit {
    //
    // Icons
    faTwitter = faTwitter;
    faFacebookF = faFacebookF;
    faBars = faBars;
    faXmark = faXmark;
    faTerminal = faTerminal;
    
    @ViewChild('navbar') navbar!: ElementRef<HTMLDivElement>;
    @ViewChild('navbar_popup') navbarPopup!: ElementRef<HTMLDivElement>;
    @ViewChild('body') body!: ElementRef<HTMLBodyElement>;
    
    animationNavbarPopup!: AnimeInstance;
    
    
    constructor(
        public htmlService: HtmlService,
        public scroller: ViewportScroller,
        protected utils: UtilFuncService
    ) {}
    
    
    ngAfterViewInit(): void {
        this.htmlService.onWindowScrollY((y: number) => {
            if (y > 400) {
            } else {
            }
            if (y > 20) {
                this.navbar.nativeElement.classList.add('!py-0');
                this.navbar.nativeElement.classList.add('shadow-lg');
                // this.navbar.nativeElement.classList.add('!bg-primary-300');
            } else {
                this.navbar.nativeElement.classList.remove('!py-0');
                this.navbar.nativeElement.classList.remove('shadow-lg');
                // this.navbar.nativeElement.classList.remove('!bg-primary-300');
            }
        });
        this.animateElements();
    }
    
    
    animateElements(): void {
        this.htmlService.onInView(
            this.navbar.nativeElement,
            0,
            0,
            () => {
                anime({
                    targets: '.navbar .animated',
                    top: [{ value: -50 }, { value: 0, duration: 600 }],
                    opacity: [{ value: 0 }, { value: 1, duration: 200 }],
                    easing: 'easeOutQuad',
                    delay: anime.stagger(150),
                });
            },
            true,
        );
    }
    
    
    animateNarbarPopupClosing(): void {
        this.animationNavbarPopup.reverse();
        this.animationNavbarPopup.play();
        // this.animateNarbarPopupOpening();
    }
    
    
    animateNarbarPopupOpening(): void {
        if (!this.animationNavbarPopup) {
            this.animationNavbarPopup = anime({
                targets: '.navbar .navbar-popup',
                scale: [0.9, 1],
                opacity: [
                    { value: 0, duration: 0 },
                    { value: 1, duration: 300 },
                ],
                translateY: [
                    { value: -100, duration: 0 },
                    { value: 0, duration: 100 },
                ],
                borderBottomLeftRadius: [
                    { value: '100%', duration: 0 },
                    { value: 0, duration: 400 },
                ],
                borderBottomRightRadius: [
                    { value: '100%', duration: 0 },
                    { value: 0, duration: 400 },
                ],
                easing: 'easeOutQuad',
                duration: 400,
                begin: anim => {
                    if (this.navbarPopup!.nativeElement!.classList.contains('active')) {
                        this.navbarPopup!.nativeElement!.classList.add('!block');
                        this.htmlService.bodyOverflowY(false);
                    }
                },
                complete: anim => {
                    if (!this.navbarPopup!.nativeElement!.classList.contains('active')) {
                        this.navbarPopup!.nativeElement!.classList.remove('!block');
                        this.htmlService.bodyOverflowY(true);
                    }
                },
            });
        } else {
            this.animationNavbarPopup.reverse();
            this.animationNavbarPopup.play();
        }
    }
}
