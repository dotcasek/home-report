import { Injectable, signal } from '@angular/core';
import * as XLSX from 'xlsx';
import { Transaction } from '../models/OverviewData';
import { Observable, switchMap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { v4 as uuidv4 } from 'uuid';
import { map } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class FileReaderService {

  private transactions: Transaction[] = [];
  private dateFilter: {start: Date | null, end: Date | null} | null = null;
  private rangeFilter: {start: number, end: number} | null = null;

  dataRange = signal<[number, number]>([0, 100])

  filteredTransactions = signal<Transaction[]>([] as Transaction[]);
  query$ = toObservable(this.filteredTransactions).pipe(
    map(transactions => 
      transactions.filter(transaction => !transaction.isHidden)
    )
  );
  rangeQuery$ = toObservable(this.dataRange);


  
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
                    id: uuidv4(),
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
        const amounts = transactions.map(t => parseFloat(t.amount)).filter(amount => !isNaN(amount));
        const minAmount = Math.min(...amounts);
        const maxAmount = Math.max(...amounts);
        this.dataRange.set([minAmount, maxAmount]);
        
        this.filteredTransactions.set(this.transactions);
        if(this.dateFilter) {
          this.setDateFilter(this.dateFilter.start, this.dateFilter.end)
        }
        // if(this.rangeFilter) {
        //   this.setRangeFilter(this.rangeFilter.start, this.rangeFilter.end)
        // }
        
    };
    fileReader.readAsArrayBuffer(file);
  }

  showHide(id: string) {
    const updatedTransactions = this.filteredTransactions().map(transaction => 
      transaction.id === id ? { ...transaction, isHidden: !transaction.isHidden } : transaction
    );
    this.filteredTransactions.set(updatedTransactions);
  }
  
  setDateFilter(start: Date | null, end: Date | null) {
    this.dateFilter = {start: start, end: end}
    let ft = [...this.transactions]

    if(this.dateFilter?.start) {
      ft = ft.filter(t => 
        t.date >= this.dateFilter!.start!
    )}

    if(this.dateFilter?.end) {
      ft = ft.filter(t => 
        t.date <= this.dateFilter!.end!
    )}
    this.filteredTransactions.set(ft);
  }

  setRangeFilter(start: number, end: number) {
    this.rangeFilter = {start: start, end: end}
    let ft = [...this.transactions]

    if(this.rangeFilter?.start) {
      ft = ft.filter(t => 
        parseFloat(t.amount) >= this.rangeFilter!.start!
    )}

    if(this.rangeFilter?.end) {
      ft = ft.filter(t => 
        parseFloat(t.amount) <= this.rangeFilter!.end!
    )}
    this.filteredTransactions.set(ft);
  }
  
  get transactionsData() {
    return this.filteredTransactions.asReadonly();
  }
  

}

