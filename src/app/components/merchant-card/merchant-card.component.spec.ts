import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantCardComponent } from './merchant-card.component';

describe('MerchantCardComponent', () => {
  let component: MerchantCardComponent;
  let fixture: ComponentFixture<MerchantCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
