import { AfterViewInit, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HtmlService } from '../services/html.service';
import { UtilFuncService } from '../services/util-func.service';
import { PatientProfileService } from "../services/patient-profile.service";

@Component({
    selector: 'app-p',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './p.component.html',
    styleUrl: './p.component.scss',
})
export class PComponent implements AfterViewInit {
    constructor(
        private htmlService: HtmlService,
        private patient: PatientProfileService,
        private utilsService: UtilFuncService
    ) {
    }
    
    
    async ngAfterViewInit() {
        this.htmlService.body().classList.remove('lg:pt-[142px]');
        this.htmlService.body().classList.remove('pt-[100px]');
        this.htmlService.body().classList.remove('bg-primarys');
    }
}
