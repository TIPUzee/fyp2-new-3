import { AfterViewInit, Component } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonService } from '../../../services/common.service';
import { HtmlService } from '../../../services/html.service';
import { Router, RouterLink } from '@angular/router';
import { DiseaseSymptoms } from '../../../constants/disease-symptoms';
import { DiseasePredictorService } from "../service/disease-predictor.service";
import { FormSubmitButtonComponent } from "../../../components/form-submit-button/form-submit-button.component";
import { toast } from "ngx-sonner";

@Component({
    selector: 'app-options',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule, RouterLink, FormSubmitButtonComponent],
    templateUrl: './options.component.html',
    styleUrl: './options.component.scss',
})
export class OptionsComponent implements AfterViewInit {
    //
    // Static
    static selectedSymptoms: string[] = [];
    // Icons
    faChevronDown = faChevronDown;
    //
    diseaseSymptoms = DiseaseSymptoms;
    //
    // State
    loading = false;
    class = OptionsComponent;
    
    
    constructor(
        public common: CommonService,
        private html: HtmlService,
        public scroller: ViewportScroller,
        private diseaseService: DiseasePredictorService,
        private router: Router,
    ) {}
    
    
    ngAfterViewInit(): void {
        this.html.scrollToTop();
        this.html.initTailwindElements();
    }
    
    
    async predict() {
        if (OptionsComponent.selectedSymptoms.length < 4) {
            toast.warning('Please select at least 4 symptoms to proceed.');
            return;
        }
        
        this.loading = true;
        await this.diseaseService.predictDisease(OptionsComponent.selectedSymptoms);
        
        await this.router.navigate(['m', 'd-p', 'r']);
        this.loading = false;
    }
    
    
    toggleSymptomSelection(symptom: string): void {
        if (OptionsComponent.selectedSymptoms.includes(symptom)) {
            OptionsComponent.selectedSymptoms = OptionsComponent.selectedSymptoms.filter((s) => s !== symptom);
        } else {
            OptionsComponent.selectedSymptoms.push(symptom);
        }
    }
}
