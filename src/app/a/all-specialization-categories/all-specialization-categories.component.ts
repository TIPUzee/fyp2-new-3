import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HtmlService } from '../../services/html.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCloudArrowUp, faArrowRotateRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { HTTPService } from "../../services/http.service";
import {
    AdminCreateNewSpecializationCategoryResponse,
    AdminDeleteSpecializationCategoryResponse,
    AdminGetSpecializationCategoriesResponse, AdminUpdateSpecializationCategoryResponse,
} from "../../interfaces/api-response-interfaces";
import { Subject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { UtilFuncService } from "../../services/util-func.service";
import { ModalComponent } from "../../components/modal/modal.component";
import { FormInputComponent } from "../../components/form-input/form-input.component";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators as vl } from "@angular/forms";
import { FormValidatorsService } from "../../services/form-validators.service";
import { FormSelectComponent } from "../../components/form-select/form-select.component";
import { FormSubmitButtonComponent } from "../../components/form-submit-button/form-submit-button.component";
import { toast } from "ngx-sonner";
import {
    FormRefreshButtonComponent
} from "../../components/form-refresh-button/form-refresh-button.component";
import { RouterLink } from "@angular/router";
import {
    FormSmallIconButtonComponent
} from "../../components/form-small-icon-button/form-small-icon-button.component";

@Component({
    selector: 'app-all-specialization-categories',
    standalone: true,
    imports: [
        FontAwesomeModule, CommonModule, ModalComponent, FormInputComponent,
        ReactiveFormsModule, FormSelectComponent, FormSubmitButtonComponent, FormRefreshButtonComponent, FormsModule,
        RouterLink, FormSmallIconButtonComponent
    ],
    templateUrl: './all-specialization-categories.component.html',
    styleUrl: './all-specialization-categories.component.scss',
})
export class AllSpecializationCategoriesComponent implements AfterViewInit {
    //
    // Static variables
    static allObjs: AdminGetSpecializationCategoriesResponse['specializationCategories'] = [];
    static loading = false;
    static searched = {
        changeSearch$: new Subject<void>(),
        list: [] as string[],
        query: '',
        selectKey: (key: string) => {
            if (AllSpecializationCategoriesComponent.searched.list.includes(key)) {
                AllSpecializationCategoriesComponent.searched.list
                    = AllSpecializationCategoriesComponent.searched.list.filter(k => k !== key);
            } else {
                AllSpecializationCategoriesComponent.searched.list.push(key);
            }
            AllSpecializationCategoriesComponent.searched.changeSearch$.next();
        },
        search: (q: string) => {
            AllSpecializationCategoriesComponent.searched.query = q;
            AllSpecializationCategoriesComponent.searched.changeSearch$.next();
        },
    };
    //
    // State Variables
    change$ = new Subject<void>();
    dataTableInstance: any = null;
    selectedObj: AdminGetSpecializationCategoriesResponse['specializationCategories'][0] = {
        id: 0,
        title: '',
        creationTime: new Date(),
    }
    mainClass = AllSpecializationCategoriesComponent;
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
            title: ['', vl.compose([vl.required, vl.minLength(3), vl.maxLength(64)])]
        }),
        errors: {
            id: {
                required: 'ID is required',
            },
            title: {
                required: 'Title is required',
                minlength: 'Title must be at least 3 characters long',
                maxlength: 'Title must be at most 64 characters long'
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
                url: '/a/specialization-category',
                jsonData: data,
            }) as AdminCreateNewSpecializationCategoryResponse | false;
            
            this.selectedObjectForm.loading = false;
            
            if (!res) {
                return;
            } else if (res.titleAlreadyExists) {
                toast.error('The category already exists');
                this.load({ id: Number(res.existsAsId) });
            } else if (res.specializationCategoryCreated) {
                toast.success('Category created');
                this.load({ id: Number(res.existsAsId) });
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while creating the specialization category. Please try again.'
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
                url: `/a/specialization-category/${ data.id }`,
                jsonData: data,
            }) as AdminUpdateSpecializationCategoryResponse | false;
            
            this.selectedObjectForm.loading = false;
            
            if (!res) {
                return;
            } else if (res.titleAlreadyExists) {
                toast.error('Specialization category already exists', {
                    description: 'The title you are trying to update the category to already exist in the database.' +
                        ' Please try again with a different title.'
                });
            } else if (res.specializationCategoryDoesNotExist) {
                toast.error('Category does not exist', {
                    description: 'The specialization you are trying to update does not exist in the database. Please' +
                        ' try again.'
                });
                this.possibleActionsModal.close();
            } else if (res.updated) {
                toast.success('Category updated');
                this.possibleActionsModal.close();
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while updating the specialization category. Please try again.'
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
                url: `/a/specialization-category/${ data.id }`,
            }) as AdminDeleteSpecializationCategoryResponse | false;
            
            this.selectedObjectForm.loading = false;
            
            if (!res) {
                return;
            } else if (res.specializationCategoryDoesNotExist) {
                toast.error('Specialization category does not exist', {
                    description: 'The category you are trying to delete has already been deleted'
                });
            } else if (res.specializationCategoryDeleted) {
                toast.success('Specialization category deleted');
            } else {
                toast.error('An error occurred', {
                    description: 'An error occurred while deleting the specialization category. Please try again.'
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
        private http: HTTPService,
        private utils: UtilFuncService,
        private _fb: FormBuilder,
        private _fvs: FormValidatorsService,
    ) {
        this.change$.pipe(takeUntilDestroyed()).subscribe(() => {
            this.updateDataTable();
        })
        AllSpecializationCategoriesComponent.searched.changeSearch$.pipe(takeUntilDestroyed()).subscribe(() => {
            let list = AllSpecializationCategoriesComponent.searched.list.map(l => l);
            if (list.length === 0) {
                for (const col of this.columns) {
                    if (col?.field) {
                        list.push(col.field);
                    }
                }
            }
            this.html.dataTableSearch(
                this.dataTableInstance,
                AllSpecializationCategoriesComponent.searched.query,
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
        this.dataTableInstance = this.html.createDataTable(
            this.dataTableContainer.nativeElement,
            this.columns,
            undefined,
        );
        
        (
            this.dataTableContainer.nativeElement as any
        ).addEventListener('rowClick.te.datatable', ({ row }: { row: { id: number } }) => {
            const { id } = row;
            this.selectedObj = AllSpecializationCategoriesComponent.allObjs.find(l => l.id === id) || this.selectedObj;
            this.selectedObjectForm.fg.controls.id.setValue(this.selectedObj.id);
            this.selectedObjectForm.fg.controls.title.setValue(this.selectedObj.title);
            this.possibleActionsModal.open();
        });
    }
    
    
    async load({ id, force }: { id?: number, force?: boolean } = {}) {
        if (AllSpecializationCategoriesComponent.allObjs.length && !id && !force) {
            this.change$.next();
            return;
        }
        
        if (AllSpecializationCategoriesComponent.loading) return;
        
        AllSpecializationCategoriesComponent.loading = true;
        
        let url = '/a/specialization-categories';
        if (id) {
            url = `/a/specialization-category/${ id }`;
        }
        
        const res = await this.http.sendRequest({
            method: 'GET',
            url: url,
        }) as AdminGetSpecializationCategoriesResponse | false;
        
        AllSpecializationCategoriesComponent.loading = false;
        
        if (!res) return;
        
        // convert date strings to Date objects
        res.specializationCategories.forEach(l => {
            l.creationTime = new Date(l.creationTime);
        });
        
        if (id) {
            if (res.specializationCategories.length === 0) {
                AllSpecializationCategoriesComponent.allObjs
                    = AllSpecializationCategoriesComponent.allObjs.filter(p => p.id !== id);
            } else {
                const language = res.specializationCategories[0];
                const index = AllSpecializationCategoriesComponent.allObjs.findIndex(p => p.id === id);
                if (index !== -1) {
                    AllSpecializationCategoriesComponent.allObjs[index] = language;
                } else {
                    AllSpecializationCategoriesComponent.allObjs.push(language);
                }
            }
        } else {
            AllSpecializationCategoriesComponent.allObjs = res.specializationCategories;
        }
        
        this.change$.next();
    }
    
    
    searchByUrlQueryParam() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // loop through columns and check if the column is in the url query param
        for (const col of this.columns) {
            if (urlParams.has(col.field)) {
                AllSpecializationCategoriesComponent.searched.list = [col.field];
                AllSpecializationCategoriesComponent.searched.query = urlParams.get(col.field) || '';
                AllSpecializationCategoriesComponent.searched.changeSearch$.next();
                break;
            }
        }
    }
    
    
    updateDataTable() {
        // [id, name, email, dob, password, whatsappNumber, status, refundableAmount, registrationTime]
        const rows = AllSpecializationCategoriesComponent.allObjs.map(l => [
            l.id,
            l.title,
            l.creationTime,
        ]);
        this.html.updateDataTable(this.dataTableInstance, rows);
    }
}
