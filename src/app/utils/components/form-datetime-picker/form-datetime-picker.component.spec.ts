import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDatetimePickerComponent } from './form-datetime-picker.component';

describe('FormDatePickerComponent', () => {
  let component: FormDatetimePickerComponent;
  let fixture: ComponentFixture<FormDatetimePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormDatetimePickerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormDatetimePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
