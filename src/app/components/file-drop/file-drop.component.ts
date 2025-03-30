import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { read, writeFileXLSX } from "xlsx";
import { FileReaderService } from '../../services/file-reader.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';

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
    MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './file-drop.component.html',
  styleUrl: './file-drop.component.scss'
})
export class FileDropComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  fileService = inject(FileReaderService)
  selectedFile: File | null = null;
  transactions: any[] = [];
  minAmount: number | null = null;
  maxAmount: number | null = null;
  startValue = 0;
  endValue = 100;

  result = this.fileService.rangeQuery$.subscribe(range => {
    this.minAmount = range[0];
    this.maxAmount = range[1];

    this.startValue = range[0];
    this.endValue = range[1];
  });

  setDateFilter() {
    const start = this.range.get("start")?.value || null;
    const end = this.range.get("end")?.value || null;
    this.fileService.setDateFilter(start, end);
  }

  setRangeFilter() {
    this.fileService.setRangeFilter(this.startValue, this.endValue);
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // Handle the file here
      this.selectedFile = file;
      this.fileService.addFile(file)
    }
  }

  ngOnDestroy() {
    this.result.unsubscribe()
  }

  clearDate() {
    this.range.reset(); // Or this.dateForm.get('selectedDate').reset();
    this.fileService.setDateFilter(null, null);
  }
  
  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return `${value}`;
  }

}
