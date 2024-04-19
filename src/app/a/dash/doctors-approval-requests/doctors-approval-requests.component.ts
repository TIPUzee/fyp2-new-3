import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HtmlService } from '../../../services/html.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DoctorDetailsComponent } from '../../../p/dash/doctor-details/doctor-details.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-doctors-approval-requests',
    standalone: true,
    imports: [
        FontAwesomeModule, RouterLink, CommonModule, DoctorDetailsComponent, RouterOutlet, RouterLinkActive,
        NgxExtendedPdfViewerModule
    ],
    templateUrl: './doctors-approval-requests.component.html',
    styleUrl: './doctors-approval-requests.component.scss',
})
export class DoctorsApprovalRequestsComponent implements AfterViewInit {
    @ViewChild('dataTableContainer') dataTableContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('dataTableSearch') dataTableSearch!: ElementRef<HTMLInputElement>;
    @ViewChild('searchBtnsContainer') searchBtnsContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('possibleActionsModal') possibleActionsModal!: ElementRef<HTMLDivElement>;
    
    currentDocumentSelectedIndex: number = 0;
    
    faCloudArrowUp = faCloudArrowUp;
    faArrowLeft = faArrowLeft;
    
    public dataTableInstance: any = null;
    
    // utils
    Object = Object;
    isShowingFilteredList: boolean = false;
    
    // Datatable
    columns = [
        {
            label: 'ID',
            field: 'id',
            fixed: true,
            width: 65,
        },
        {
            label: 'Name',
            field: 'name',
        },
        {
            label: 'Email',
            field: 'email',
        },
        {
            label: 'Date of birth',
            field: 'date of birth',
        },
        {
            label: 'Password',
            field: 'password',
        },
        {
            label: 'Mobile Number',
            field: 'mobile number',
        },
        {
            label: 'Wallet Amount',
            field: 'wallet amount',
        },
        {
            label: 'Meeting Duration',
            field: 'meeting duration',
        },
        {
            label: 'Appointment Charges',
            field: 'appointment charges',
        },
        {
            label: 'Account Status',
            field: 'account status',
        },
        {
            label: 'Registration Time',
            field: 'registration time',
        },
    ];
    
    
    constructor(private htmlService: HtmlService, public router: Router, public activatedRoute: ActivatedRoute) {
        activatedRoute.queryParams.pipe(takeUntilDestroyed()).subscribe((val: Object) => {
            if (val.hasOwnProperty('spec')) {
                this.isShowingFilteredList = true;
            }
        });
    }
    
    
    ngAfterViewInit(): void {
        this.initDataTable();
        this.htmlService.initTailwindElements();
    }
    
    
    //
    // Datatable
    //
    initDataTable(): void {
        const rows = [
            [1, 'Zeeshan', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [2, 'Zeeshan', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321', '2023-12-06T11:30:00Z'],
            [1, 'John Doe', 'zeeshan@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
            [1, 'John Doe', 'johndoe@example.com', '1990-05-15', 'password123', '+1234567890', '2023-12-06T10:00:00Z'],
            [
                2, 'Jane Smith', 'janesmith@example.com', '1988-09-20', 'securepass', '+1987654321',
                '2023-12-06T11:30:00Z'
            ],
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
