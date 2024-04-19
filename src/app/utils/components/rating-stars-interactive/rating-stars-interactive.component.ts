import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonService } from "../../../services/common.service";
import { NgClass, NgForOf, NgIf } from "@angular/common";

@Component({
    selector: 'app-rating-stars-interactive',
    standalone: true,
    imports: [
        NgForOf,
        NgIf,
        NgClass
    ],
    templateUrl: './rating-stars-interactive.component.html',
    styleUrl: './rating-stars-interactive.component.scss'
})
export class RatingStarsInteractiveComponent {
    rating: number = 0;
    tempRating: number = 0;
    
    // fire Event for the parent component
    @Output() change = new EventEmitter<number>();
    
    constructor(protected commons: CommonService) {}
    
    
    // on rating click
    rate(rating: number) {
        this.rating = rating;
        this.change.emit(this.rating);
    }
}
