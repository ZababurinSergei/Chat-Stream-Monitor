import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusHistory } from '../../models/greenhouse.model';

@Component({
  selector: 'app-history-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './status-history-table.component.html',
  styleUrl: './status-history-table.component.css'
})
export class HistoryTableComponent {
  @Input() history: StatusHistory[] = [];
  @Input() canAddComments = false;
  @Input() enablePagination = true;
  @Input() enableExport = true;
  @Input() showDetailsButton = false;
  @Input() showSummary = true;
  @Input() pageSize = 10;

  @Output() commentUpdated = new EventEmitter<{id: number, comment: string}>();
  @Output() showDetails = new EventEmitter<StatusHistory>();
  @Output() exportRequested = new EventEmitter<void>();

  // Сигналы для фильтрации
  selectedStatus = signal<string>('');
  userFilter = signal<string>('');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  // Сигналы для пагинации
  currentPage = signal<number>(1);
  totalItems = computed(() => this.filteredHistory().length);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize));

  // Сигналы для редактирования
  editingId = signal<number | null>(null);
  editCommentText = signal<string>('');

  // Вычисляемые сигналы
  filteredHistory = computed(() => {
    let filtered = [...this.history];

    // Фильтр по статусу
    if (this.selectedStatus()) {
      filtered = filtered.filter(item => item.status === this.selectedStatus());
    }

    // Фильтр по пользователю
    if (this.userFilter()) {
      const userFilterLower = this.userFilter().toLowerCase();
      filtered = filtered.filter(item =>
          item.changedBy.toLowerCase().includes(userFilterLower)
      );
    }

    // Фильтр по дате
    if (this.dateFrom()) {
      const fromDate = new Date(this.dateFrom());
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(item => new Date(item.changedAt) >= fromDate);
    }

    if (this.dateTo()) {
      const toDate = new Date(this.dateTo());
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => new Date(item.changedAt) <= toDate);
    }

    return filtered;
  });

  // Отсортированная и пагинированная история
  sortedHistory = computed(() => {
    const filtered = this.filteredHistory();

    // Сортировка по дате (новые сверху)
    const sorted = filtered.sort((a, b) =>
        new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
    );

    // Применение пагинации
    if (this.enablePagination) {
      const start = (this.currentPage() - 1) * this.pageSize;
      const end = start + this.pageSize;
      return sorted.slice(start, end);
    }

    return sorted;
  });

  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize);
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize, this.totalItems()));

  // Методы

  // Начать редактирование комментария
  startEditing(item: StatusHistory): void {
    if (this.canAddComments) {
      this.editingId.set(item.id);
      this.editCommentText.set(item.comment || '');

      // Фокус на textarea через setTimeout
      setTimeout(() => {
        const textarea = document.querySelector('.comment-edit') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          textarea.select();
        }
      }, 0);
    }
  }

  // Сохранить комментарий
  saveComment(item: StatusHistory): void {
    if (this.editingId() === item.id && this.editCommentText() !== item.comment) {
      this.commentUpdated.emit({
        id: item.id,
        comment: this.editCommentText()
      });
    }
    this.editingId.set(null);
  }

  // Применить фильтры
  applyFilters(): void {
    this.currentPage.set(1); // Сброс на первую страницу при фильтрации
  }

  // Сбросить фильтры
  resetFilters(): void {
    this.selectedStatus.set('');
    this.userFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
  }

  // Проверить, есть ли активные фильтры
  hasActiveFilters(): boolean {
    return !!this.selectedStatus() || !!this.userFilter() || !!this.dateFrom() || !!this.dateTo();
  }

  // Пагинация
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }

  onPageSizeChange(): void {
    this.currentPage.set(1);
  }

  // Экспорт в CSV
  exportToCSV(): void {
    this.exportRequested.emit();

    // Создание CSV контента
    const headers = ['Дата', 'Статус', 'Изменил', 'Комментарий'];
    const rows = this.filteredHistory().map(item => [
      new Date(item.changedAt).toLocaleString('ru-RU'),
      this.getStatusText(item.status),
      item.changedBy,
      item.comment || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Создание и скачивание файла
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `history_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Получить количество записей по статусу
  getStatusCount(status: string): number {
    return this.filteredHistory().filter(item => item.status === status).length;
  }

  // Текстовое представление статуса
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'normal': 'Норма',
      'warning': 'Предупреждение',
      'emergency': 'Авария',
      'critical': 'Критический'
    };
    return statusMap[status] || status;
  }

  // Отслеживание изменений входных данных
  ngOnChanges(): void {
    // Сброс пагинации при изменении данных
    this.currentPage.set(1);
  }
}