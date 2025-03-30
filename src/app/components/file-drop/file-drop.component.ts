import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { read, writeFileXLSX } from "xlsx";
import { FileReaderService } from '../../services/file-reader.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import {MatIconModule} from '@angular/material/icon';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';


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

  setDateFilter() {
    const start = this.range.get("start")?.value || null;
    const end = this.range.get("end")?.value || null;
    this.fileService.setDateFilter(start, end);
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
}
