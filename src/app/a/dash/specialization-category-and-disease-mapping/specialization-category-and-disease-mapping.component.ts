import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HtmlService } from '../../../services/html.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-specialization-category-and-disease-mapping',
    standalone: true,
    imports: [FontAwesomeModule, RouterLink, CommonModule, RouterOutlet, RouterLinkActive],
    templateUrl: './specialization-category-and-disease-mapping.component.html',
    styleUrl: './specialization-category-and-disease-mapping.component.scss',
})
export class SpecializationCategoryAndDiseaseMappingComponent implements AfterViewInit {
    @ViewChild('dataTableContainer') dataTableContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('dataTableSearch') dataTableSearch!: ElementRef<HTMLInputElement>;
    @ViewChild('searchBtnsContainer') searchBtnsContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('possibleActionsModal') possibleActionsModal!: ElementRef<HTMLDivElement>;
    
    faCloudArrowUp = faCloudArrowUp;
    faArrowLeft = faArrowLeft;
    
    public dataTableInstance: any = null;
    
    // utils
    Object = Object;
    
    // Datatable
    columns = [
        {
            label: 'ID',
            field: 'id',
            fixed: true,
            width: 65,
        },
        {
            label: 'Specialization Category Title',
            field: 'specialization category title',
        },
        {
            label: 'Predictable Disease Title',
            field: 'predictable disease title',
        },
    ];
    
    
    constructor(private htmlService: HtmlService, public router: Router) {}
    
    
    ngAfterViewInit(): void {
        this.initDataTable();
        this.htmlService.initTailwindElements();
    }
    
    
    //
    // Datatable
    //
    initDataTable(): void {
        const rows = [
            [1, 'Cardiology', 'Drug Reaction'],
            [2, 'Dermatology', 'Dengue'],
            [1, 'Cardiology', 'Drug Reaction'],
            [2, 'Dermatology', 'Dengue'],
            [1, 'Cardiology', 'Drug Reaction'],
            [2, 'Dermatology', 'Dengue'],
            [1, 'Cardiology', 'Drug Reaction'],
            [2, 'Dermatology', 'Dengue'],
            [1, 'Cardiology', 'Drug Reaction'],
            [2, 'Dermatology', 'Dengue'],
            [1, 'Cardiology', 'Drug Reaction'],
            [2, 'Dermatology', 'Dengue'],
            [1, 'Cardiology', 'Drug Reaction'],
            [2, 'Dermatology', 'Dengue'],
            [1, 'Cardiology', 'Drug Reaction'],
            [2, 'Dermatology', 'Dengue'],
            [1, 'Cardiology', 'Drug Reaction'],
            [2, 'Dermatology', 'Dengue'],
            [1, 'Cardiology', 'Drug Reaction'],
            [2, 'Dermatology', 'Dengue'],
            [1, 'Cardiology', 'Drug Reaction'],
            [2, 'Dermatology', 'Dengue'],
            [1, 'Cardiology', 'Drug Reaction'],
            [2, 'Urology', 'Chicken pox'],
            [1, 'Radiology', 'Malaria'],
            [2, 'Dermatology', 'Dengue'],
            [1, 'Cardiology', 'Drug Reaction'],
            [2, 'Dermatology', 'Dengue'],
        ];
        this.dataTableInstance = this.htmlService.createDataTable(
            this.dataTableSearch.nativeElement,
            this.columns,
            undefined,
        );
        
        (
            this.dataTableContainer.nativeElement as any
        ).addEventListener('rowClick.te.datatable', () => {
            this.possibleActionsModal.nativeElement.click();
        });
        this.htmlService.updateDataTable(this.dataTableInstance, rows);
    }
}
