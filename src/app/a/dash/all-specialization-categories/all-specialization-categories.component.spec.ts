import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSpecializationCategoriesComponent } from './all-specialization-categories.component';

describe('PatientsComponent', () => {
  let component: AllSpecializationCategoriesComponent;
  let fixture: ComponentFixture<AllSpecializationCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSpecializationCategoriesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllSpecializationCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
