import { AfterViewInit, Component } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { HTTPService } from "./services/http.service";
import { UtilFuncService } from "./services/util-func.service";
import { NgxSonnerToaster, toast } from 'ngx-sonner';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, NgxSonnerToaster],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
    title = 'AI-Disease Predictor';
    
    
    constructor(
        private scroller: ViewportScroller,
        private router: Router,
        private http: HTTPService,
        private utils: UtilFuncService,
    ) {
        // htmlService.setPrintCurrentBreakPoint();
        scroller.setOffset([200, 200]);
        // htmlService.initConsoleDeveloperDetailsLoop();
        // this.verifyUserLoggedIn();
        this.redirectToHomeOnUnexpectedReload();
        http.verifyLogins({ showMsg: false });
    }
    
    
    ngAfterViewInit(): void {
    }
    
    
    redirectToHomeOnUnexpectedReload() {
        if (this.router.url === '/' || this.router.url === '') {
            // this.router.navigate(['/home']); return;
            if (this.utils.getCurrentUser() === 'd') {
                this.router.navigate(['/d/p-preview']);
            } else if (this.utils.getCurrentUser() === 'p') {
                this.router.navigate(['/p/p']);
            } else {
                this.router.navigate(['/home']);
            }
        }
    }
    
    
}
