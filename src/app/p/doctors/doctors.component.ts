import { AfterViewInit, Component } from '@angular/core';
import { HtmlService } from '../../services/html.service';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../services/common.service';
import { RouterLink } from '@angular/router';
import { LanguageService } from "../../services/language.service";
import { Doctor, Language, SpecializationCategory } from "../../interfaces/interfaces";
import { AllDoctorsService } from "../../services/all-doctors.service";
import { SpecializationCategoriesService } from "../../services/specialization-categories.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-doctors',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './doctors.component.html',
    styleUrl: './doctors.component.scss',
})
export class DoctorsComponent implements AfterViewInit {
    //
    // State variables
    languages: Language[] = [];
    selectedLanguage = {
        id: -1,
        select: (id: string) => {
            this.selectedLanguage.id = Number(id);
        }
    }
    doctors = {
        list: [] as Doctor[],
        containsLanguage: (docId: number, langId: number) => {
            const doc = this.doctors.list.find(doc => doc.id === docId);
            if (!doc) return false;
            return doc.languages.some(lang => lang.languageId === langId);
        }
    }
    specializations: SpecializationCategory[] = [];
    
    constructor(
        private html: HtmlService,
        protected common: CommonService,
        allLanguages: LanguageService,
        allDoctors: AllDoctorsService,
        allSpecializations: SpecializationCategoriesService,
    ) {
        // languages
        this.languages = allLanguages.languages;
        allLanguages.change$.pipe(takeUntilDestroyed()).subscribe(() => {
            this.languages = allLanguages.languages;
        })
        // doctors
        this.doctors.list = allDoctors.list;
        allDoctors.change$.pipe(takeUntilDestroyed()).subscribe(() => {
            this.doctors.list = allDoctors.list;
        })
        // specializations
        this.specializations = allSpecializations.list;
        allSpecializations.change$.pipe(takeUntilDestroyed()).subscribe(() => {
            this.specializations = allSpecializations.list;
        })
    }
    
    
    ngAfterViewInit(): void {
        this.html.initTailwindElements();
    }
}
