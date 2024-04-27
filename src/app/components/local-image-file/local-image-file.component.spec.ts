import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalImageFileComponent } from './local-image-file.component';

describe('LocalImageComponent', () => {
    let component: LocalImageFileComponent;
    let fixture: ComponentFixture<LocalImageFileComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LocalImageFileComponent]
        })
            .compileComponents();
        
        fixture = TestBed.createComponent(LocalImageFileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
