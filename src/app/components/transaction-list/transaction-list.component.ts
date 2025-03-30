import { Component, computed, inject, resource, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import { FileReaderService } from '../../services/file-reader.service';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import { Transaction } from '../../models/OverviewData';
import { CommonModule } from '@angular/common';
import {MatSort, MatSortModule} from '@angular/material/sort';

@Component({
  selector: 'app-transaction-list',
  imports: [MatCardModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatTableModule, CommonModule, MatSortModule],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss'
})
export class TransactionListComponent {
  fileService = inject(FileReaderService)

  displayedColumns: string[] = ['date', 'name', 'merchant', 'category', 'amount'];
  
  // transactionResource = resource({
  //   loader: () => this.fileService.getTransactions()
  // })

  result = this.fileService.query$.subscribe(e => this.dataSource.data = e);
  
  dataSource = new MatTableDataSource<Transaction>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getFilteredAndPagedData(): Transaction[] {
    const filteredData = this.dataSource.filteredData;
    if (!this.paginator) {
      return filteredData;
    }
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return filteredData.slice(startIndex, startIndex + this.paginator.pageSize);
  }

  getTotalCost() {
    return this.getFilteredAndPagedData()
      .map(t => Number(t.amount))
      .reduce((acc, value) => acc + value, 0);
  }

}
