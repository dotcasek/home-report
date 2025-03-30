import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ChartConfiguration, ChartDataset } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { OverviewData, Transaction } from '../../models/OverviewData';
import { FileReaderService } from '../../services/file-reader.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-category-card',
  imports: [MatCardModule, BaseChartDirective],
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.scss'
})
export class CategoryCardComponent {
  fileService = inject(FileReaderService)
  private subscription: Subscription = new Subscription();
  public barChartLegend = true;
  public barChartPlugins = [];
  groupedTransactions: Record<string, Record<string, number>> = {};

  overviewData: OverviewData[] = [];
  result = this.fileService.query$.subscribe(e => {
    this.groupedTransactions = e.reduce((acc, transaction) => {

      let category = transaction.category;

      const person = transaction.name || 'Unknown';
      if (!acc[category]) {
        acc[category] = {};
      }
      acc[category][person] = (acc[category][person] || 0) + Number(transaction.amount);
      return acc;
    }, {} as Record<string, Record<string, number>>);
  });

  private updateBarChartData() {
    const personSpending: Record<string, Record<string, number>> = {};

    // Iterate over grouped transactions to calculate spending per person
    Object.entries(this.groupedTransactions).forEach(([category, spending]) => {
      Object.entries(spending).forEach(([person, amount]) => {
        if (!personSpending[person]) {
          personSpending[person] = {};
        }
        personSpending[person][category] = (personSpending[person][category] || 0) + amount;
      });
    });

    // Calculate top 10 category for each person
    const top10SpendingPerPerson: Record<string, { category: string; amount: number }[]> = {};
    Object.entries(personSpending).forEach(([person, categorySpending]) => {
      top10SpendingPerPerson[person] = Object.entries(categorySpending)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
    });

    // Update barChartData with the top 10 spending data
    const uniqueCategoryies = Array.from(
      new Set(
      Object.values(top10SpendingPerPerson)
        .flat()
        .map(item => item.category)
      )
    );

    this.barChartData = {
      labels: uniqueCategoryies, // Unique category names
      datasets: Object.entries(top10SpendingPerPerson).map(([person, spending]) => ({
      label: person,
      data: uniqueCategoryies.map(
        category => spending.find(item => item.category === category)?.amount || 0
      )
      }))
    };
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.result.unsubscribe();
  }
  ngOnInit() {
    this.subscription = this.fileService.query$.subscribe(() => {
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
