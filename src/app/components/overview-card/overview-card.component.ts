import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Chart, ChartConfiguration, ChartDataset } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { OverviewData, Transaction } from '../../models/OverviewData';
import { FileReaderService } from '../../services/file-reader.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-overview-card',
  imports: [MatCardModule, MatButtonModule, BaseChartDirective],
  templateUrl: './overview-card.component.html',
  styleUrl: './overview-card.component.scss'
})
export class OverviewCardComponent {
  fileService = inject(FileReaderService)
  private subscription: Subscription = new Subscription();

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
    if (this.overviewData.length === 0) {
      data = [{ data: [0], label: 'No Data' }];
    } else {
      data = this.overviewData.map(d => {
        return { data: [d.spending], label: d.name };
      });
    }
    this.barChartData = {
      labels: ['Spending'],
      datasets: data,
      
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
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        labels: {
          generateLabels: (chart) => {
            return Chart.defaults.plugins.legend.labels.generateLabels(chart).map((label, i) => {
              const value = chart.data.datasets[i]?.data[0] as number; // Assuming single data point per dataset
                return {
                ...label,
                text: `${label.text}: ${value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
                };
            });
          }
        }
      }
    }
  };

}
