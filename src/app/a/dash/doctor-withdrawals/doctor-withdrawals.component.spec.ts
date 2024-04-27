import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorWithdrawalsComponent } from './doctor-withdrawals.component';

describe('PatientsComponent', () => {
  let component: DoctorWithdrawalsComponent;
  let fixture: ComponentFixture<DoctorWithdrawalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorWithdrawalsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DoctorWithdrawalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
