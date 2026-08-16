import { Component, EventEmitter, Output, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-box.component.html',
  styleUrl: './search-box.component.css',
})
export class SearchBoxComponent {
  @Output() search = new EventEmitter<string>();
  @Output() toggleAdvanced = new EventEmitter<void>();

  placeholder = input('Поиск...');
  showAdvancedLink = input(false);
  advancedLabel = input('Расширенный поиск');
  resultsCount = input<number | null>(null);

  searchQuery = signal('');

  onSearch() {
    this.search.emit(this.searchQuery());
  }

  clearSearch() {
    this.searchQuery.set('');
    this.search.emit('');
  }
}