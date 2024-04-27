import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormSmallIconButtonComponent } from './form-small-icon-button.component';

describe('FormRefreshButtonComponent', () => {
  let component: FormSmallIconButtonComponent;
  let fixture: ComponentFixture<FormSmallIconButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormSmallIconButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormSmallIconButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
