import { AfterViewInit, Component } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonService } from '../../../services/common.service';
import { HtmlService } from '../../../services/html.service';
import { RouterLink } from '@angular/router';
import { DiseaseSymptoms } from '../../../constants/disease-symptoms';

@Component({
    selector: 'app-options',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule, RouterLink],
    templateUrl: './options.component.html',
    styleUrl: './options.component.scss',
})
export class OptionsComponent implements AfterViewInit {
    faChevronDown = faChevronDown;
    diseaseSymptoms = DiseaseSymptoms;
    selectedSymptoms: string[] = [];
    
    constructor(
        public commonService: CommonService,
        private htmlService: HtmlService,
        public scroller: ViewportScroller
    ) {}
    
    toggleSymptomSelection(symptom: string): void {
        if (this.selectedSymptoms.includes(symptom)) {
            this.selectedSymptoms = this.selectedSymptoms.filter((s) => s !== symptom);
        } else {
            this.selectedSymptoms.push(symptom);
        }
    }
    
    ngAfterViewInit(): void {
        this.htmlService.scrollToTop();
        this.htmlService.initTailwindElements();
    }
}
