import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { OverviewData } from '../../models/OverviewData';
import { FileReaderService } from '../../services/file-reader.service';

@Component({
  selector: 'app-merchant-card',
  imports: [MatCardModule, BaseChartDirective],
  templateUrl: './merchant-card.component.html',
  styleUrl: './merchant-card.component.scss'
})
export class MerchantCardComponent {
  fileService = inject(FileReaderService)

  public barChartLegend = true;
  public barChartPlugins = [];
  groupedTransactions: Record<string, Record<string, number>> = {};

  overviewData: OverviewData[] = [];
  result = this.fileService.query$.subscribe(e => {
    this.groupedTransactions = e.reduce((acc, transaction) => {

      let merchant = transaction.merchant;
      merchant = merchant.replace('SQ *', '')
      merchant = merchant.replace('TST* ', '')
      merchant = merchant.replace('SP ', '')
      
      if (transaction.merchant.toUpperCase().includes('AMAZON') || transaction.merchant.toUpperCase().includes('AMZN')) {
        merchant = 'AMAZON'
      }
      if (transaction.merchant.toUpperCase().includes('JETBLUE') ) {
        merchant = 'JETBLUE'
      }
      if (transaction.merchant.toUpperCase().includes('FEDEX') ) {
        merchant = 'FEDEX'
      }
      if (transaction.merchant.toUpperCase().includes('CVS') ) {
        merchant = 'CVS'
      }
      if (transaction.merchant.toUpperCase().includes('TATTE') ) {
        merchant = 'TATTE'
      }
      const person = transaction.name || 'Unknown';
      if (!acc[merchant]) {
        acc[merchant] = {};
      }
      acc[merchant][person] = (acc[merchant][person] || 0) + Number(transaction.amount);
      return acc;
    }, {} as Record<string, Record<string, number>>);
  });

  private updateBarChartData() {
    const personSpending: Record<string, Record<string, number>> = {};

    // Iterate over grouped transactions to calculate spending per person
    Object.entries(this.groupedTransactions).forEach(([merchant, spending]) => {
      Object.entries(spending).forEach(([person, amount]) => {
        if (!personSpending[person]) {
          personSpending[person] = {};
        }
        personSpending[person][merchant] = (personSpending[person][merchant] || 0) + amount;
      });
    });

    // Calculate top 10 merchants for each person
    const top10SpendingPerPerson: Record<string, { merchant: string; amount: number }[]> = {};
    Object.entries(personSpending).forEach(([person, merchantSpending]) => {
      top10SpendingPerPerson[person] = Object.entries(merchantSpending)
        .map(([merchant, amount]) => ({ merchant, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
    });
    // Update barChartData with the top 10 spending data
    const uniqueMerchants = Array.from(
      new Set(
      Object.values(top10SpendingPerPerson)
        .flat()
        .map(item => item.merchant)
      )
    );

    this.barChartData = {
      labels: uniqueMerchants, // Unique merchant names
      datasets: Object.entries(top10SpendingPerPerson).map(([person, spending]) => ({
      label: person,
      data: uniqueMerchants.map(
        merchant => spending.find(item => item.merchant === merchant)?.amount || 0
      )
      }))
    };
  }

  ngOnInit() {
    this.fileService.query$.subscribe(() => {
      this.updateBarChartData();
    });
  }

  constructor() {
    this.result.add(() => {
      this.updateBarChartData();
    });
  }
  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    // indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true
      }
    }

  };

}
