import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { OverviewData } from '../../models/OverviewData';
import { FileReaderService } from '../../services/file-reader.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-monthly',
  imports: [MatCardModule, BaseChartDirective],
  templateUrl: './monthly.component.html',
  styleUrl: './monthly.component.scss'
})
export class MonthlyComponent {
  fileService = inject(FileReaderService)
  private subscription: Subscription = new Subscription();

  public barChartLegend = true;
  public barChartPlugins = [];
  groupedTransactions: Record<string, Record<string, number>> = {};

  overviewData: OverviewData[] = [];
  result = this.fileService.query$.subscribe(transactions => {
    this.groupedTransactions = transactions.reduce((acc, transaction) => {
      const month = new Date(transaction.date).toLocaleString('default', { month: 'long', year: 'numeric' });
      const person = transaction.name || 'Unknown';

      if (!acc[month]) {
        acc[month] = {};
      }
      acc[month][person] = (acc[month][person] || 0) + Number(transaction.amount);

      return acc;
    }, {} as Record<string, Record<string, number>>);
    console.log('month', this.groupedTransactions)
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

    // Sort unique categories (labels) by date
    const sortedCategories = uniqueCategoryies.sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

    this.barChartData = {
      labels: sortedCategories, // Sorted category names
      datasets: Object.entries(top10SpendingPerPerson).map(([person, spending]) => ({
      label: person,
      data: sortedCategories.map(
        category => spending.find(item => item.category === category)?.amount || 0
      )
      }))
    };
  }

  ngOnDestroy() {
    this.result.unsubscribe();
    this.subscription.unsubscribe();
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