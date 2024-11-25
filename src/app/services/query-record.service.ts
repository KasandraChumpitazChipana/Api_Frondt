import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { QueryRecord } from '../model/query';

@Injectable({
  providedIn: 'root'
})
export class QueryRecordService {
  private baseUrl = 'https://fantastic-space-succotash-6746996vqw724jr4-8085.app.github.dev/api';
  private timeoutDuration = 30000; // 30 segundos timeout

  constructor(private http: HttpClient) {}

  // Headers comunes
  private getHeaders(contentType: 'text/plain' | 'application/json' = 'text/plain'): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': contentType,
      'Accept': 'application/json'
    });
  }

  // Manejo de errores mejorado
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error en la solicitud';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else if (error.status === 0) {
      // Error de conexión
      errorMessage = 'No se pudo conectar con el servidor. Por favor, verifique su conexión.';
    } else if (error.status === 404) {
      errorMessage = 'El recurso solicitado no fue encontrado.';
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor.';
    } else {
      errorMessage = `Error del servidor: ${error.status}, mensaje: ${error.message}`;
    }

    console.error('Error detallado:', error);
    return throwError(() => new Error(errorMessage));

  }

  // Ejecutar consulta
  executeQuery(query: string): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/groq/query`, query, {
      headers: this.getHeaders('text/plain'),
      responseType: 'text' as 'json'
    }).pipe(
      timeout(this.timeoutDuration),
      catchError(this.handleError)
    );
  }

  // Ejecutar y almacenar consulta
  executeQueryAndStore(query: string): Observable<QueryRecord> {
    return this.http.post<QueryRecord>(`${this.baseUrl}/groq/query-and-store`, query, {
      headers: this.getHeaders('text/plain')
    }).pipe(
      timeout(this.timeoutDuration),
      map(response => this.processQueryRecord(response)),
      catchError(this.handleError)
    );
  }

  // Obtener todos los registros activos
  getAllQueryRecords(): Observable<QueryRecord[]> {
    return this.http.get<QueryRecord[]>(`${this.baseUrl}/query-records`).pipe(
      timeout(this.timeoutDuration),
      map(records => records
        .map(record => this.processQueryRecord(record))
        .filter(record => record.status === 'A')
      ),
      catchError(this.handleError)
    );
  }

  // Obtener registro por ID (solo activos)
  getQueryRecordById(id: string): Observable<QueryRecord | null> {
    return this.http.get<QueryRecord>(`${this.baseUrl}/query-records/${id}`).pipe(
      timeout(this.timeoutDuration),
      map(record => {
        const processedRecord = this.processQueryRecord(record);
        return processedRecord.status === 'A' ? processedRecord : null;
      }),
      catchError(this.handleError)
    );
  }

  // Borrado lógico
  softDeleteQueryRecord(id: string): Observable<QueryRecord> {
    return this.http.patch<QueryRecord>(
      `${this.baseUrl}/query-records/${id}/status`,
      { status: 'I' },
      { headers: this.getHeaders('application/json') }
    ).pipe(
      timeout(this.timeoutDuration),
      map(record => this.processQueryRecord(record)),
      catchError(this.handleError)
    );
  }

  // Restaurar registro
  restoreQueryRecord(id: string): Observable<QueryRecord> {
    return this.http.patch<QueryRecord>(
      `${this.baseUrl}/query-records/${id}/status`,
      { status: 'A' },
      { headers: this.getHeaders('application/json') }
    ).pipe(
      timeout(this.timeoutDuration),
      map(record => this.processQueryRecord(record)),
      catchError(this.handleError)
    );
  }

  // Obtener todos los registros (incluyendo inactivos)
  getAllQueryRecordsIncludingInactive(): Observable<QueryRecord[]> {
    return this.http.get<QueryRecord[]>(`${this.baseUrl}/query-records/all`).pipe(
      timeout(this.timeoutDuration),
      map(records => records.map(record => this.processQueryRecord(record))),
      catchError(this.handleError)
    );
  }

  // Cambiar estado de registro
  toggleStatus(id: string, newStatus: 'A' | 'I'): Observable<QueryRecord> {
    return this.http.patch<QueryRecord>(
      `${this.baseUrl}/query-records/${id}/status`,
      { status: newStatus },
      { headers: this.getHeaders('application/json') }
    ).pipe(
      timeout(this.timeoutDuration),
      map(record => this.processQueryRecord(record)),
      catchError(this.handleError)
    );
  }

  // Procesar registro de consulta
  private processQueryRecord(record: QueryRecord): QueryRecord {
    return {
      ...record,
      timestamp: new Date(record.timestamp),
      status: record.status || 'A' // Valor por defecto 'A' si no existe
    };
  }

  // Método para verificar la conexión con el servidor
  checkServerConnection(): Observable<boolean> {
    return this.http.get(`${this.baseUrl}/health-check`).pipe(
      timeout(5000), // Timeout más corto para verificación de conexión
      map(() => true),
      catchError(() => {
        console.error('No se pudo establecer conexión con el servidor');
        return throwError(() => new Error('Error de conexión con el servidor'));
      })
    );
  }
}
