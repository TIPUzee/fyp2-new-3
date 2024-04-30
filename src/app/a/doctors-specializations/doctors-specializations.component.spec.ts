import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorsSpecializationsComponent } from './doctors-specializations.component';

describe('DoctorsSpecializationsComponent', () => {
    let component: DoctorsSpecializationsComponent;
    let fixture: ComponentFixture<DoctorsSpecializationsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DoctorsSpecializationsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DoctorsSpecializationsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
