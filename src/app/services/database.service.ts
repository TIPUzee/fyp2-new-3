import { Injectable } from '@angular/core';
import { SpecializationCategoriesService } from "./specialization-categories.service";
import { AvailabilityDurationsService } from "./availability-durations.service";

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {
    
    constructor(
        public specializationCategories: SpecializationCategoriesService,
        public availabilityDurations: AvailabilityDurationsService
    ) { }
}
