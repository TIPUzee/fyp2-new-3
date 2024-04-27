import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingStarsInteractiveComponent } from './rating-stars-interactive.component';

describe('RatingStarsComponent', () => {
  let component: RatingStarsInteractiveComponent;
  let fixture: ComponentFixture<RatingStarsInteractiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatingStarsInteractiveComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RatingStarsInteractiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
