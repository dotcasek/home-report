import { Component, effect, inject, Signal, signal, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FileReaderService } from '../../services/file-reader.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import {MatExpansionModule} from '@angular/material/expansion';
import { Transaction } from '../../models/OverviewData';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatListModule, MatSelectionList, MatSelectionListChange} from '@angular/material/list';

@Component({
  selector: 'app-file-drop',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSliderModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatListModule,
    MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './file-drop.component.html',
  styleUrl: './file-drop.component.scss'
})
export class FileDropComponent {
  @ViewChild('merchantList') merchantList!: MatSelectionList;
  @ViewChild('categoryList') categoryList!: MatSelectionList;


  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  fileService = inject(FileReaderService)
  selectedFile: File | null = null;
  transactions: Transaction[] = [];
  minAmount = signal(0);
  maxAmount = signal(0);
  startValue = signal(0);
  endValue = signal(0);

  visibleMerchants = signal<string[]>([]);
  itemsToShow = signal(20);
  currentMerchantIndex = 0;
  showMoreMerchantsButton = signal(true);
  showLessMerchantsButton = signal(false);

  constructor() {
    const filePath = '/test.csv';
    fetch(filePath)
      .then(response => response.blob())
      .then(blob => {
        const file = new File([blob], 'test.csv', { type: blob.type });
        this.fileService.addFile(file);
      })
      .catch(error => console.error('Error loading file:', error));

    effect(() => {
      const range = this.fileService.dataRange();
      this.minAmount.set(Math.floor(range[0]));
      this.maxAmount.set(Math.ceil(range[1]));
      this.startValue.set(Math.floor(range[0]));
      this.endValue.set(Math.ceil(range[1]));
    });
  }

  resultData = this.fileService.query$.subscribe(transactions => {
    this.transactions = transactions;
    this.visibleMerchants.set(this.fileService.displayMerchants().slice(0, this.itemsToShow()));
    this.showMoreMerchantsButton.set(this.fileService.displayMerchants().length > this.itemsToShow());
  });

  showMoreMerchants() {
    const merchants = this.fileService.displayMerchants();
    const nextIndex = this.visibleMerchants.length + this.itemsToShow();
    this.visibleMerchants.set(merchants.slice(0, nextIndex));
    this.currentMerchantIndex = this.visibleMerchants.length;

    this.showMoreMerchantsButton.set(this.currentMerchantIndex < merchants.length);
    this.showLessMerchantsButton.set(true);
  }

  showLessMerchants() {
    const previousIndex = this.currentMerchantIndex - this.itemsToShow();
    const merchants = this.fileService.displayMerchants();
    this.visibleMerchants.set(merchants.slice(0, previousIndex));
    this.currentMerchantIndex = previousIndex;

    this.showMoreMerchantsButton.set(true);
    this.showLessMerchantsButton.set(this.currentMerchantIndex > this.itemsToShow());
  }

  setDateFilter() {
    const start = this.range.get("start")?.value || null;
    const end = this.range.get("end")?.value || null;
    this.fileService.setDateFilter(start, end);
  }

  setRangeFilter() {
    this.fileService.setRangeFilter(this.startValue(), this.endValue());
  }

  setMerchantFilter() {
    const selectedMerchantss = this.merchantList.selectedOptions.selected.map(option => option.value);
    this.fileService.setMerchantFilter(selectedMerchantss);
  }

  setCategoryFilter() {
    const selectedCategories = this.categoryList.selectedOptions.selected.map(option => option.value);
    this.fileService.setCategoryFilter(selectedCategories);
  }

  clearCategorySelection() {
    this.categoryList.deselectAll()
    this.fileService.setCategoryFilter([]);
  }

  clearMerchantSelection() {
    this.merchantList.deselectAll()
    this.fileService.setMerchantFilter([]);
  }

  selectAllCategories() {
    this.categoryList.selectAll();
    const selectedCategories = this.categoryList.selectedOptions.selected.map(option => option.value);
    this.fileService.setCategoryFilter(selectedCategories);
  }

  selectAllMerchants() {
    this.merchantList.selectAll();
    const seletedMerchants = this.merchantList.selectedOptions.selected.map(option => option.value);
    this.fileService.setCategoryFilter(seletedMerchants);
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // Handle the file here
      this.selectedFile = file;
      this.fileService.addFile(file)
    }
  }

  clearDate() {
    this.range.reset(); // Or this.dateForm.get('selectedDate').reset();
    this.fileService.setDateFilter(null, null);
  }
  
  readonly formattedStartValue = signal(() => {
    const value = this.startValue();
    return value >= 1000 ? Math.round(value / 1000) + 'k' : `${value}`;
  });

  readonly formattedEndValue = signal(() => {
    const value = this.endValue();
    return value >= 1000 ? Math.round(value / 1000) + 'k' : `${value}`;
  });
  readonly formattedMinAmount = signal(() => {
    const value = this.minAmount();
    return value >= 1000 ? Math.round(value / 1000) + 'k' : `${value}`;
  });

  readonly formattedMaxAmount = signal(() => {
    const value = this.maxAmount();
    return value >= 1000 ? Math.round(value / 1000) + 'k' : `${value}`;
  });

}
