import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HtmlService } from '../../../services/html.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCloudArrowUp, faArrowRotateRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { OffcanvasService } from '../../../utils/components/offcanvas/offcanvas.service';
import { HTTPService } from "../../../services/http.service";
import {
    AdminCreateNewLanguageResponse, AdminDeleteLanguageResponse,
    AdminGetLanguagesResponse, AdminUpdateLanguageResponse,
    AdminUpdatePatientResponse,
    GetAllPatientsResponse
} from "../../../interfaces/api-response-interfaces";
import { Subject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { UtilFuncService } from "../../../services/util-func.service";
import { ModalComponent } from "../../../utils/components/modal/modal.component";
import { FormInputComponent } from "../../../utils/components/form-input/form-input.component";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators as vl } from "@angular/forms";
import { FormValidatorsService } from "../../../services/form-validators.service";
import { FormSelectComponent } from "../../../utils/components/form-select/form-select.component";
import { FormSubmitButtonComponent } from "../../../utils/components/form-submit-button/form-submit-button.component";
import { toast } from "ngx-sonner";
import {
    FormRefreshButtonComponent
} from "../../../utils/components/form-refresh-button/form-refresh-button.component";
import { RouterLink } from "@angular/router";
import {
    FormSmallIconButtonComponent
} from "../../../utils/components/form-small-icon-button/form-small-icon-button.component";

@Component({
    selector: 'app-all-languages',
    standalone: true,
    imports: [
        FontAwesomeModule, CommonModule, ModalComponent, FormInputComponent,
        ReactiveFormsModule, FormSelectComponent, FormSubmitButtonComponent, FormRefreshButtonComponent, FormsModule,
        RouterLink, FormSmallIconButtonComponent
    ],
    templateUrl: './all-languages.component.html',
    styleUrl: './all-languages.component.scss',
})
export class AllLanguagesComponent implements AfterViewInit {
    //
    // Static variables
    static allObjs: AdminGetLanguagesResponse['languages'] = [];
    static loading = false;
    static searched = {
        changeSearch$: new Subject<void>(),
        list: [] as string[],
        query: '',
        selectKey: (key: string) => {
            if (AllLanguagesComponent.searched.list.includes(key)) {
                AllLanguagesComponent.searched.list = AllLanguagesComponent.searched.list.filter(k => k !== key);
            } else {
                AllLanguagesComponent.searched.list.push(key);
            }
            AllLanguagesComponent.searched.changeSearch$.next();
        },
        search: (q: string) => {
            AllLanguagesComponent.searched.query = q;
            AllLanguagesComponent.searched.changeSearch$.next();
        },
    };
    //
    // State Variables
    change$ = new Subject<void>();
    dataTableInstance: any = null;
    selectedObj: AdminGetLanguagesResponse['languages'][0] = {
        id: 0,
        title: '',
        creationTime: new Date(),
    }
    mainClass = AllLanguagesComponent;
    //
    // View Elements
    @ViewChild('dataTableContainer') dataTableContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('dataTableSearch') dataTableSearch!: ElementRef<HTMLInputElement>;
    @ViewChild('searchButtonsContainer') searchButtonsContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('possibleActionsModal') possibleActionsModal!: ModalComponent;
    @ViewChild('createNewLanguageModal') createNewLanguageModal!: ModalComponent;
    @ViewChild('deleteLanguageModal') deleteLanguageModal!: ModalComponent;
    //
    // Icons
    faCloudArrowUp = faCloudArrowUp;
    faArrowRotateRight = faArrowRotateRight;
    faPlus = faPlus;
    //
    // Forms
    selectedObjectForm = {
        loading: false,
        fg: this._fb.group({
            id: [1, vl.required],
            title: ['', vl.compose([vl.required, vl.minLength(3), vl.maxLength(32)])]
        }),
        errors: {
            id: {
                required: 'ID is required',
            },
            title: {
                required: 'Title is required',
                minlength: 'Title must be at least 3 characters long',
                maxlength: 'Title must be at most 32 characters long'
            }
        },
        accountStatusOptions: [
            { label: 'Suspended', value: 'ACCOUNT_SUSPENDED' },
            { label: 'Active', value: 'ACCOUNT_NOT_SUSPENDED' }
        ],
        validate: () => {
            if (this.selectedObjectForm.fg.invalid) {
                this.selectedObjectForm.fg.markAllAsTouched();
                this.selectedObjectForm.fg.patchValue(this.selectedObjectForm.fg.value);
                toast.warning('Please fill in all required fields');
                return false;
            }
            return true;
        },
        create: async () => {
            if (this.selectedObjectForm.loading || !this.selectedObjectForm.validate()) return;
            
            const data = this.selectedObjectForm.fg.value;
            this.selectedObjectForm.loading = true;
            
            const res = await this.http.sendRequest({
                method: 'POST',
                url: '/a/language',
                jsonData: data,
            }) as AdminCreateNewLanguageResponse | false;
            
            this.selectedObjectForm.loading = false;
            
            if (!res) {
                return;
            } else if (res.titleAlreadyExists) {
                toast.error('The language already exists');
                this.load({ id: Number(res.existsAsId) });
            } else if (res.languageCreated) {
                toast.success('Language created');
                this.load({ id: Number(res.existsAsId) });
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while creating the language. Please try again.'
                });
            }
            this.createNewLanguageModal.close();
        },
        update: async () => {
            if (this.selectedObjectForm.loading || !this.selectedObjectForm.fg.valid) return;
            
            const data = this.selectedObjectForm.fg.value;
            this.selectedObjectForm.loading = true;
            
            const res = await this.http.sendRequest({
                method: 'PUT',
                url: `/a/language/${ data.id }`,
                jsonData: data,
            }) as AdminUpdateLanguageResponse | false;
            
            this.selectedObjectForm.loading = false;
            
            if (!res) {
                return;
            } else if (res.titleAlreadyExists) {
                toast.error('Language already exists', {
                    description: 'The title you are trying to update the language to already exist in the database. Please try again with a different title.'
                });
            } else if (res.languageDoesNotExist) {
                toast.error('Language does not exist', {
                    description: 'The language you are trying to update does not exist in the database. Please try again.'
                });
                this.possibleActionsModal.close();
            } else if (res.updated) {
                toast.success('Language updated');
                this.possibleActionsModal.close();
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while updating the language. Please try again.'
                });
            }
            
            await this.load({ id: data.id || 1 });
        },
        delete: async () => {
            if (this.selectedObjectForm.loading) return;
            
            const data = this.selectedObjectForm.fg.value;
            this.selectedObjectForm.loading = true;
            
            const res = await this.http.sendRequest({
                method: 'DELETE',
                url: `/a/language/${ data.id }`,
            }) as AdminDeleteLanguageResponse | false;
            
            this.selectedObjectForm.loading = false;
            
            if (!res) {
                return;
            } else if (res.languageDoesNotExist) {
                toast.error('Language does not exist', {
                    description: 'The language you are trying to delete has already been deleted'
                });
            } else if (res.languageDeleted) {
                toast.success('Language deleted');
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while deleting the language. Please try again.'
                });
            }
            
            this.deleteLanguageModal.close();
            this.possibleActionsModal.close();
            await this.load({ id: data.id || 1 });
        }
    };
    //
    // Datatable
    columns = [
        {
            label: 'ID',
            field: 'id',
            fixed: true,
            width: 65,
        },
        {
            label: 'Title',
            field: 'title',
        },
        {
            label: 'Creation Time',
            field: 'creationTime',
            format: (ele: HTMLTableCellElement, a: any) => {
                ele.textContent = this.utils.convertDateToDefinedDateTimeFormat(a);
            }
        },
    ];
    
    
    constructor(
        private html: HtmlService,
        public offcanvas: OffcanvasService,
        private http: HTTPService,
        private utils: UtilFuncService,
        private _fb: FormBuilder,
        private _fvs: FormValidatorsService,
    ) {
        this.change$.pipe(takeUntilDestroyed()).subscribe(() => {
            this.updateDataTable();
        })
        AllLanguagesComponent.searched.changeSearch$.pipe(takeUntilDestroyed()).subscribe(() => {
            let list = AllLanguagesComponent.searched.list.map(l => l);
            if (list.length === 0) {
                for (const col of this.columns) {
                    if (col?.field) {
                        list.push(col.field);
                    }
                }
            }
            this.html.dataTableSearch(
                this.dataTableInstance,
                AllLanguagesComponent.searched.query,
                list
            );
        })
    }
    
    
    async ngAfterViewInit() {
        this.initDataTable();
        this.html.initTailwindElements();
        await this.load();
        this.searchByUrlQueryParam();
    }
    
    
    initDataTable(): void {
        const rows = [
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
        this.dataTableInstance = this.html.createDataTable(
            this.dataTableContainer.nativeElement,
            this.columns,
            undefined,
        );
        
        (
            this.dataTableContainer.nativeElement as any
        ).addEventListener('rowClick.te.datatable', ({ row }: { row: { id: number } }) => {
            const { id } = row;
            this.selectedObj = AllLanguagesComponent.allObjs.find(l => l.id === id) || this.selectedObj;
            this.selectedObjectForm.fg.controls.id.setValue(this.selectedObj.id);
            this.selectedObjectForm.fg.controls.title.setValue(this.selectedObj.title);
            this.possibleActionsModal.open();
        });
    }
    
    
    async load({ id, force }: { id?: number, force?: boolean } = {}) {
        if (AllLanguagesComponent.allObjs.length && !id && !force) {
            this.change$.next();
            return;
        }
        
        if (AllLanguagesComponent.loading) return;
        
        AllLanguagesComponent.loading = true;
        
        let url = '/a/languages';
        if (id) {
            url = `/a/language/${ id }`;
        }
        
        const res = await this.http.sendRequest({
            method: 'GET',
            url: url,
        }) as AdminGetLanguagesResponse | false;
        
        AllLanguagesComponent.loading = false;
        
        if (!res) return;
        
        // convert date strings to Date objects
        res.languages.forEach(l => {
            l.creationTime = new Date(l.creationTime);
        });
        
        if (id) {
            if (res.languages.length === 0) {
                AllLanguagesComponent.allObjs = AllLanguagesComponent.allObjs.filter(p => p.id !== id);
            } else {
                const language = res.languages[0];
                const index = AllLanguagesComponent.allObjs.findIndex(p => p.id === id);
                if (index !== -1) {
                    AllLanguagesComponent.allObjs[index] = language;
                } else {
                    AllLanguagesComponent.allObjs.push(language);
                }
            }
        } else {
            AllLanguagesComponent.allObjs = res.languages;
        }
        
        this.change$.next();
    }
    
    
    searchByUrlQueryParam() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // loop through columns and check if the column is in the url query param
        for (const col of this.columns) {
            if (urlParams.has(col.field)) {
                AllLanguagesComponent.searched.list = [col.field];
                AllLanguagesComponent.searched.query = urlParams.get(col.field) || '';
                AllLanguagesComponent.searched.changeSearch$.next();
                break;
            }
        }
    }
    
    
    updateDataTable() {
        // [id, name, email, dob, password, whatsappNumber, status, refundableAmount, registrationTime]
        const rows = AllLanguagesComponent.allObjs.map(l => [
            l.id,
            l.title,
            l.creationTime,
        ]);
        this.html.updateDataTable(this.dataTableInstance, rows);
    }
}
