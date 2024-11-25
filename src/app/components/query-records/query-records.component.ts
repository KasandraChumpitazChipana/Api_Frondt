import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { QueryRecordService } from '../../services/query-record.service';
import { QueryRecord } from '../../model/query';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-query-records',
  templateUrl: './query-records.component.html',
  styleUrls: ['./query-records.component.scss'],
})
export class QueryRecordsComponent implements OnInit, AfterViewInit {
  queryRecords: QueryRecord[] = [];
  queryResult: string = '';
  errorMessage: string = '';
  newQuery: string = '';
  isLoading: boolean = false;
  statusFilter: 'A' | 'I' | 'all' = 'A';

  displayedColumns: string[] = ['timestamp', 'query', 'response', 'status', 'actions'];
  dataSource: MatTableDataSource<QueryRecord>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private queryRecordService: QueryRecordService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<QueryRecord>([]);
  }

  ngOnInit(): void {
    this.loadRecords();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Personalizar la función de filtrado
    this.dataSource.filterPredicate = (data: QueryRecord, filter: string) => {
      return data.query.toLowerCase().includes(filter) ||
             data.response.toLowerCase().includes(filter);
    };
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  private extractContent(response: string): string {
    try {
      const parsedResponse = JSON.parse(response);
      return parsedResponse.choices[0].message.content || '';
    } catch (error) {
      console.error("Error al analizar JSON:", error);
      return response;
    }
  }

  loadRecords(): void {
    this.isLoading = true;
    const observable = this.statusFilter === 'all'
      ? this.queryRecordService.getAllQueryRecordsIncludingInactive()
      : this.queryRecordService.getAllQueryRecords();

    observable.subscribe({
      next: (data: QueryRecord[]) => {
        let records = data.map(record => ({
          ...record,
          response: this.extractContent(record.response),
          timestamp: new Date(record.timestamp)
        }));

        if (this.statusFilter !== 'all') {
          records = records.filter(record => record.status === this.statusFilter);
        }

        this.queryRecords = records;
        this.dataSource.data = this.queryRecords;
      },
      error: (error) => {
        this.errorMessage = 'Error al obtener los registros: ' + error.message;
        this.showSnackBar('Error al cargar los registros');
        console.error('Error completo:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  executeQueryAndClear(): void {
    if (!this.newQuery.trim()) {
      this.showSnackBar('Por favor ingrese una consulta');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.queryRecordService.executeQuery(this.newQuery).subscribe({
      next: (response: string) => {
        this.queryResult = this.extractContent(response);
        this.newQuery = '';
      },
      error: (error) => {
        this.errorMessage = 'Error al ejecutar la consulta: ' + error.message;
        this.showSnackBar('Error al ejecutar la consulta');
        console.error('Error completo:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  executeQueryAndStoreAndClear(): void {
    if (!this.newQuery.trim()) {
      this.showSnackBar('Por favor ingrese una consulta');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.queryRecordService.executeQueryAndStore(this.newQuery).subscribe({
      next: (response: QueryRecord) => {
        const processedResponse = {
          ...response,
          response: this.extractContent(response.response),
          timestamp: new Date(response.timestamp)
        };

        this.queryRecords = [processedResponse, ...this.queryRecords];
        this.dataSource.data = this.queryRecords;
        this.newQuery = '';
        this.showSnackBar('Consulta guardada exitosamente');
      },
      error: (error) => {
        this.errorMessage = 'Error al ejecutar y almacenar la consulta: ' + error.message;
        this.showSnackBar('Error al guardar la consulta');
        console.error('Error completo:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  toggleStatus(record: QueryRecord): void {
    const operation = record.status === 'A'
      ? this.queryRecordService.softDeleteQueryRecord(record.id)
      : this.queryRecordService.restoreQueryRecord(record.id);

    operation.subscribe({
      next: () => {
        this.showSnackBar(
          record.status === 'A'
            ? 'Registro desactivado exitosamente'
            : 'Registro restaurado exitosamente'
        );
        this.loadRecords();
      },
      error: (error) => {
        this.showSnackBar('Error al cambiar el estado del registro');
        console.error('Error al cambiar estado:', error);
      }
    });
  }

  updateStatusFilter(): void {
    this.loadRecords();
  }

  viewDetails(record: QueryRecord): void {
    // Aquí puedes implementar la lógica para mostrar los detalles
    // Por ejemplo, abrir un diálogo con MatDialog
    console.log('Detalles del registro:', record);
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }
}
