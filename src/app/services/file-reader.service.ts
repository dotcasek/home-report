import { Injectable, signal } from '@angular/core';
import * as XLSX from 'xlsx';
import { Transaction } from '../models/OverviewData';
import { toObservable } from '@angular/core/rxjs-interop';
import { v4 as uuidv4 } from 'uuid';
import { map } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class FileReaderService {

  private transactions: Transaction[] = [];
  private dateFilter: { start: Date | null, end: Date | null } | null = null;
  private rangeFilter: { start: number, end: number } | null = null;

  private categoryFilter: string[] = [];
  private merchantFilter: string[] = [];

  dataRange = signal<[number, number]>([0, 100])

  displayCategories = signal<string[]>([]);
  displayMerchants = signal<string[]>([]);

  filteredTransactions = signal<Transaction[]>([] as Transaction[]);
  query$ = toObservable(this.filteredTransactions).pipe(
    map(transactions =>
      transactions.filter(transaction => !transaction.isHidden)
    )
  );

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

          let merchant: string = row[3];
          merchant = merchant.replace('SQ *', '')
          merchant = merchant.replace('TST* ', '')
          merchant = merchant.replace('SP ', '')

          if (merchant.toUpperCase().includes('AMAZON') || merchant.toUpperCase().includes('AMZN')) {
            merchant = 'AMAZON'
          }
          if (merchant.toUpperCase().includes('JETBLUE')) {
            merchant = 'JETBLUE'
          }
          if (merchant.toUpperCase().includes('FEDEX')) {
            merchant = 'FEDEX'
          }
          if (merchant.toUpperCase().includes('CVS')) {
            merchant = 'CVS'
          }
          if (merchant.toUpperCase().includes('TATTE')) {
            merchant = 'TATTE'
          }

          let category: string = row[4] || 'Uncategorized';
          if (merchant.toUpperCase().includes('STOP & SHOP') ||
            merchant.toUpperCase().includes('WHOLEFDS') ||
            merchant.toUpperCase().includes('RANDALLS') ||
            merchant.toUpperCase().includes('CROSBY\'S') ||
            merchant.toUpperCase().includes('H-E-B') ||
            merchant.toUpperCase().includes('TRADER JOE') ||
            merchant.toUpperCase().includes('SHUBIE\'S') ||
            merchant.toUpperCase().includes('GROVE MARKET') ||
            merchant.toUpperCase().includes('CENTRAL MARKET') 
          ) {
            category = 'GROCERIES'
          }

          const transaction: Transaction = {
            id: uuidv4(),
            date: new Date(row[0]), // Transaction Date
            name: row[2] === 2441 || row[2] === 1234? 'Derek' : 'Madison', // Card No.
            merchant: merchant, // Description
            category: category, // Category
            amount: row[5]?.toString() || '', // Debit
            isHidden: false
          };
          transactions.push(transaction);
        }
      });

      this.transactions = [...transactions];
      this.getDataRange(this.transactions);

      this.filteredTransactions.set(this.transactions);
      this.dateFilter = null;
      this.rangeFilter = null;
      this.categoryFilter = [];

      this.applyFilters()
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
    this.dateFilter = { start: start, end: end };
    this.applyFilters();
  }

  setRangeFilter(start: number, end: number) {
    this.rangeFilter = { start: start, end: end };
    this.applyNoRangeFilters();
  }

  setCategoryFilter(categories: string[]) {
    this.categoryFilter = [...categories]
    this.applyFiltersFromCategory();
  }

  setMerchantFilter(merchants: string[]) {
    this.merchantFilter = [...merchants];
    this.applyFiltersFromMerchant();
  }

  private applyMerchantFilter(ft: Transaction[]): Transaction[] {
    if (this.merchantFilter.length > 0) {
      ft = ft.filter(t => this.merchantFilter.includes(t.merchant));
    }
    return ft;
  }

  private applyCategoryFilter(ft: Transaction[]): Transaction[] {
    if (this.categoryFilter.length > 0) {
      ft = ft.filter(t => this.categoryFilter.includes(t.category));
    }
    return ft;
  }
  private applyFilters() {
    let ft = [...this.transactions];

    ft = this.applyDateFilter(ft);

    ft = this.applyMerchantFilter(ft);
    ft = this.applyCategoryFilter(ft);

    this.displayMerchants.set(this.getMerchants(ft));
    this.displayCategories.set(this.getCategories(ft));

    this.getDataRange(ft);
    ft = this.applyRangeFilter(ft);

    this.filteredTransactions.set(ft);
  }

  private applyFiltersFromCategory() {
    let ft = [...this.transactions];

    ft = this.applyDateFilter(ft);
    ft = this.applyMerchantFilter(ft);

    this.displayCategories.set(this.getCategories(ft));
    ft = this.applyCategoryFilter(ft);

    this.displayMerchants.set(this.getMerchants(ft));

    this.getDataRange(ft);
    ft = this.applyRangeFilter(ft);

    this.filteredTransactions.set(ft);
  }

  private applyFiltersFromMerchant() {
    let ft = [...this.transactions];

    ft = this.applyDateFilter(ft);
    ft = this.applyCategoryFilter(ft);

    this.displayMerchants.set(this.getMerchants(ft));
    ft = this.applyMerchantFilter(ft);

    this.displayCategories.set(this.getCategories(ft));

    this.getDataRange(ft);
    ft = this.applyRangeFilter(ft);

    this.filteredTransactions.set(ft);
  }

  private applyDateFilter(ft: Transaction[]): Transaction[] {

    if (this.dateFilter?.start) {
      ft = ft.filter(t =>
        t.date >= this.dateFilter!.start!
      )
    }

    if (this.dateFilter?.end) {
      ft = ft.filter(t =>
        t.date <= this.dateFilter!.end!
      )
    }

    return ft;
  }

  private applyRangeFilter(ft: Transaction[]): Transaction[] {

    if (this.rangeFilter?.start) {
      ft = ft.filter(t =>
        parseFloat(t.amount) >= this.rangeFilter!.start!
      )
    }

    if (this.rangeFilter?.end) {
      ft = ft.filter(t =>
        parseFloat(t.amount) <= this.rangeFilter!.end!
      )
    }
    return ft
  }

  private applyNoRangeFilters() {
    let ft = [...this.transactions];

    ft = this.applyDateFilter(ft);
    ft = this.applyCategoryFilter(ft);
    this.displayCategories.set(this.getCategories(ft));

    if (this.rangeFilter) {
      ft = ft.filter(t => {
        const amount = parseFloat(t.amount);
        return amount >= this.rangeFilter!.start && amount <= this.rangeFilter!.end;
      });
    }

    this.filteredTransactions.set(ft);
  }

  private getDataRange(ft: Transaction[]) {
    const amounts = ft.map(t => parseFloat(t.amount)).filter(amount => !isNaN(amount));
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);

    this.dataRange.set([minAmount, maxAmount]);
  }

  getCategories(ft: Transaction[]) {
    return [...new Set(ft.map(transaction => transaction.category))].sort((a, b) => a.localeCompare(b));
  }

  getMerchants(ft: Transaction[]) {
    return [...new Set(ft.map(transaction => transaction.merchant))].sort((a, b) => a.localeCompare(b));
  }

  get transactionsData() {
    return this.filteredTransactions.asReadonly();
  }


}

