import { Injectable, signal } from '@angular/core';
import * as XLSX from 'xlsx';
import { Transaction } from '../models/OverviewData';
import { Observable, switchMap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';


@Injectable({
  providedIn: 'root'
})
export class FileReaderService {
  private delay = 1000; // Simulate network delay

  private transactions: Transaction[] = [];
  private filter: {start: Date | null, end: Date | null} | null = null;
  
  filteredTransactions = signal<Transaction[]>([]);

  query$ = toObservable(this.filteredTransactions);
    
  addFile(inputFile: File) {
    this.transactions = [];
    const file = inputFile;
    const fileReader = new FileReader();
    fileReader.onload = (e: any) => {
        const arrayBuffer = e.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'buffer', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const transactions: Transaction[] = [];
        data.slice(1).forEach((row: any[]) => {
            if (row.length > 0 && row[5]) {
                const transaction: Transaction = {
                    date: new Date(row[0]), // Transaction Date
                    name: row[2] === 2441 ? 'Derek' : 'Madison', // Card No.
                    merchant: row[3], // Description
                    category: row[4], // Category
                    amount: row[5]?.toString() || '', // Debit
                    isHidden: false
                };
                transactions.push(transaction);
            }
        });

        this.transactions = [...transactions];
        this.filteredTransactions.set(this.transactions);
        if(this.filter) {
          this.setDateFilter(this.filter.start, this.filter.end)
        }
        
    };
    fileReader.readAsArrayBuffer(file);
  }

  
  setDateFilter(start: Date | null, end: Date | null) {
    this.filter = {start: start, end: end}
    let ft = [...this.transactions]

    if(this.filter?.start) {
      ft = ft.filter(t => 
        t.date >= this.filter!.start!
    )}

    if(this.filter?.end) {

      ft = ft.filter(t => 
        t.date <= this.filter!.end!
    )}

    this.filteredTransactions.set(ft);

  }
  
  get transactionsData() {
    return this.filteredTransactions.asReadonly();
  }
  

}

