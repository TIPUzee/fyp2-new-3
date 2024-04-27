import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormTimePickerComponent } from './form-time-picker.component';

describe('FormDatePickerComponent', () => {
    let component: FormTimePickerComponent;
    let fixture: ComponentFixture<FormTimePickerComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormTimePickerComponent]
        })
            .compileComponents();
        
        fixture = TestBed.createComponent(FormTimePickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
