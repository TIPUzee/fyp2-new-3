import { AfterViewInit, Component } from '@angular/core';
import { HtmlService } from '../../services/html.service';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../services/common.service';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-suggested-doctors',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './suggested-doctors.component.html',
    styleUrl: './suggested-doctors.component.scss',
})
export class SuggestedDoctorsComponent implements AfterViewInit {
    constructor(private htmlService: HtmlService, public commonService: CommonService) {}
    
    
    ngAfterViewInit(): void {
        this.htmlService.initTailwindElements();
    }
}
