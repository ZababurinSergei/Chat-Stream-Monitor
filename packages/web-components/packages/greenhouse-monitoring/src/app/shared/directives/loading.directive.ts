import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appLoading]',
  standalone: true
})
export class LoadingDirective {
  private hasView = false;
  private loadingTemplate!: TemplateRef<any>;

  @Input() set appLoading(condition: boolean) {
    if (condition && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.loadingTemplate);
      this.hasView = true;
    } else if (!condition && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  @Input() set appLoadingTemplate(template: TemplateRef<any>) {
    this.loadingTemplate = template;
  }

  constructor(
      private templateRef: TemplateRef<any>,
      private viewContainer: ViewContainerRef
  ) {}
}