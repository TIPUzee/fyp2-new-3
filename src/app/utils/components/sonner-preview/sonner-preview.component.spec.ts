import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SonnerPreviewComponent } from './sonner-preview.component';

describe('SonnerPreviewComponent', () => {
  let component: SonnerPreviewComponent;
  let fixture: ComponentFixture<SonnerPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SonnerPreviewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SonnerPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
