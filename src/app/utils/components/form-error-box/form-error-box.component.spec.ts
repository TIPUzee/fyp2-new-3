import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormErrorBoxComponent } from './form-error-box.component';

describe('TextInputField1Component', () => {
    let component: FormErrorBoxComponent;
    let fixture: ComponentFixture<FormErrorBoxComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormErrorBoxComponent]
        })
            .compileComponents();
        
        fixture = TestBed.createComponent(FormErrorBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
