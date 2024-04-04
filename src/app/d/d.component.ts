import { AfterViewInit, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HtmlService } from '../services/html.service';
import { UtilFuncService } from '../services/util-func.service';

@Component({
    selector: 'app-d',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './d.component.html',
    styleUrl: './d.component.scss',
})
export class DComponent implements AfterViewInit {
    constructor(private htmlService: HtmlService, private utilsService: UtilFuncService) {
    }
    
    
    ngAfterViewInit(): void {
        this.htmlService.body().classList.remove('lg:pt-[142px]');
        this.htmlService.body().classList.remove('pt-[100px]');
        this.htmlService.body().classList.remove('bg-primarys');
    }
}
