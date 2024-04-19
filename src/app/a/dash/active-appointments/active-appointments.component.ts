import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HtmlService } from '../../../services/html.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-active-appointments',
    standalone: true,
    imports: [FontAwesomeModule, RouterLink, CommonModule, RouterOutlet, RouterLinkActive],
    templateUrl: './active-appointments.component.html',
    styleUrl: './active-appointments.component.scss',
})
export class ActiveAppointmentsComponent implements AfterViewInit {
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
            label: 'Doctor ID',
            field: 'doctor-details id',
        },
        {
            label: 'Patient ID',
            field: 'patient id',
        },
        {
            label: 'Current Status',
            field: 'current status',
        },
        {
            label: 'Doctor Delay Count',
            field: 'doctor-details delay count',
        },
        {
            label: 'Patient Reschedule Count',
            field: 'patient reschedule count',
        },
        {
            label: 'Requested Time',
            field: 'requested time',
        },
        {
            label: 'Meeting Time From',
            field: 'meeting time from',
        },
        {
            label: 'Meeting Time To',
            field: 'meeting time to',
        },
        {
            label: 'Patient Rating',
            field: 'patient rating',
        },
        {
            label: 'Secret Code',
            field: 'secret code',
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
