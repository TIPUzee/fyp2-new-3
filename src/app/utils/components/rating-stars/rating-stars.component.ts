import { Component, Input } from '@angular/core';
import { CommonService } from "../../../services/common.service";
import { NgClass, NgForOf, NgIf } from "@angular/common";

@Component({
    selector: 'app-rating-stars',
    standalone: true,
    imports: [
        NgForOf,
        NgIf,
        NgClass
    ],
    templateUrl: './rating-stars.component.html',
    styleUrl: './rating-stars.component.scss'
})
export class RatingStarsComponent {
    @Input({ required: false }) rating: number = 0;
    
    
    constructor(protected commons: CommonService) {}
}
