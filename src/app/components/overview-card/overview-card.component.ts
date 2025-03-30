import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ChartConfiguration, ChartDataset } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { OverviewData, Transaction } from '../../models/OverviewData';
import { FileReaderService } from '../../services/file-reader.service';

@Component({
  selector: 'app-overview-card',
  imports: [MatCardModule, MatButtonModule, BaseChartDirective],
  templateUrl: './overview-card.component.html',
  styleUrl: './overview-card.component.scss'
})
export class OverviewCardComponent {
  fileService = inject(FileReaderService)

  public barChartLegend = true;
  public barChartPlugins = [];

  overviewData: OverviewData[] = [];
  result = this.fileService.query$.subscribe(e => {
    const groupedData = e.reduce((acc: Record<string, number>, transaction: Transaction) => {
      const key = String(transaction.name);
      acc[key] = (acc[key] || 0) + Number(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    this.overviewData = Object.entries(groupedData).map(([name, spending]) => ({
      name,
      spending
    }));
  });
  private updateBarChartData() {
    let data:ChartDataset<'bar'>[] = []
    if(this.overviewData[0] && this.overviewData[1]) {
      data = [
        {data: [this.overviewData[0]?.spending], label: this.overviewData[0]?.name, },
        {data: [this.overviewData[1]?.spending], label: this.overviewData[1]?.name, }
      ]
    }
    this.barChartData = {
      labels: ['Spending'],
      datasets: data,
      
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
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true
      }
    }

  };

}
