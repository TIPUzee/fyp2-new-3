import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientWithdrawalsComponent } from './patient-withdrawals.component';

describe('PatientsComponent', () => {
  let component: PatientWithdrawalsComponent;
  let fixture: ComponentFixture<PatientWithdrawalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientWithdrawalsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PatientWithdrawalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
