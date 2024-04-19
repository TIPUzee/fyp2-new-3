import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormRefreshButtonComponent } from './form-refresh-button.component';

describe('FormRefreshButtonComponent', () => {
  let component: FormRefreshButtonComponent;
  let fixture: ComponentFixture<FormRefreshButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormRefreshButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormRefreshButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
