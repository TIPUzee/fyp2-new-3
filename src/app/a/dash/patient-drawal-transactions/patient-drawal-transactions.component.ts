import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HtmlService } from '../../../services/html.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-patient-drawal-transactions',
    standalone: true,
    imports: [FontAwesomeModule, RouterLink, CommonModule, RouterOutlet, RouterLinkActive],
    templateUrl: './patient-drawal-transactions.component.html',
    styleUrl: './patient-drawal-transactions.component.scss',
})
export class PatientDrawalTransactionsComponent implements AfterViewInit {
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
            label: 'Patient ID',
            field: 'patient id',
        },
        {
            label: 'Withdrawal Amount',
            field: 'withdrawal amount',
        },
        {
            label: 'Receiver Easypaisa Number',
            field: 'receiver easypaisa number',
        },
        {
            label: 'Receiver Easypaisa Username',
            field: 'receiver easypaisa username',
        },
        {
            label: 'Sender Easypaisa Number',
            field: 'sender Easypaisa number',
        },
        {
            label: 'Sender Easypaisa Username',
            field: 'sender Easypaisa username',
        },
        {
            label: 'Transaction ID By Easypaisa',
            field: 'transaction id by easypaisa',
        },
        {
            label: 'Transaction Time',
            field: 'transaction time',
        },
        {
            label: 'Requested Time',
            field: 'requested time',
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
            [1], [2], [1], [2], [1], [2], [1], [2], [1], [2], [1], [2], [1], [2], [1], [2], [1], [2], [1], [2], [1],
            [2], [1], [2], [1], [2], [1], [2]
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
