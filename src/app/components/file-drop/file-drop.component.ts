import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-file-drop',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './file-drop.component.html',
  styleUrl: './file-drop.component.scss'
})
export class FileDropComponent {

  selectedFile: File | null = null;
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // Handle the file here
      this.selectedFile = file;
      console.log(file);
    }
  }
}
