import { Component, effect, inject, Inject, Renderer2, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatCardModule} from '@angular/material/card';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatButtonModule} from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { FileDropComponent } from './components/file-drop/file-drop.component';
import { OverviewCardComponent } from './components/overview-card/overview-card.component';
import { MerchantCardComponent } from './components/merchant-card/merchant-card.component';
import { CategoryCardComponent } from './components/category-card/category-card.component';
import { TransactionListComponent } from "./components/transaction-list/transaction-list.component";
import { MonthlyComponent } from "./components/monthly/monthly.component";
import {BreakpointObserver, LayoutModule} from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [
    MatToolbarModule,
    MatSlideToggleModule,
    MatButtonModule,
    FormsModule,
    FileDropComponent,
    OverviewCardComponent,
    MerchantCardComponent,
    MonthlyComponent,
    CategoryCardComponent,
    TransactionListComponent,
    MonthlyComponent,
    LayoutModule,
    CommonModule
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'home-report';
  darkMode = signal(false);
  breakpointObserver = inject(BreakpointObserver)
  isMobile = signal(false);

  constructor() {
    this.breakpointObserver.observe('(max-width: 599px)').subscribe(result => {
      this.isMobile.set(result.matches);
    });
  }

  applyDarkMode = effect(() => {
    const darkMode = this.darkMode();
    document.body.classList.toggle('darkMode', darkMode);
  });

}
