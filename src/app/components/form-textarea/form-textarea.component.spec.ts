import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormTextareaComponent } from './form-textarea.component';

describe('TextInputField1Component', () => {
    let component: FormTextareaComponent;
    let fixture: ComponentFixture<FormTextareaComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormTextareaComponent]
        })
            .compileComponents();
        
        fixture = TestBed.createComponent(FormTextareaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
