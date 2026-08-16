import {Component, ChangeDetectionStrategy} from '@angular/core';
import {ArticleComments} from './article-comments/article-comments';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ArticleComments],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
