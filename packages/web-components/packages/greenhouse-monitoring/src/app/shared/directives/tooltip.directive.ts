import { Directive, Input, HostListener, ElementRef, ComponentRef,
  ApplicationRef, Injector, ComponentFactoryResolver,
  ViewContainerRef } from '@angular/core';
import { TooltipComponent } from '../components/tooltip/tooltip.component';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective {
  @Input() appTooltip = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

  private tooltipRef: ComponentRef<TooltipComponent> | null = null;

  constructor(
      private elementRef: ElementRef,
      private appRef: ApplicationRef,
      private injector: Injector,
      private resolver: ComponentFactoryResolver,
      private viewContainerRef: ViewContainerRef
  ) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    if (this.appTooltip && !this.tooltipRef) {
      this.showTooltip();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.hideTooltip();
  }

  private showTooltip() {
    const factory = this.resolver.resolveComponentFactory(TooltipComponent);
    this.tooltipRef = factory.create(this.injector);

    this.tooltipRef.instance.text = this.appTooltip;
    this.tooltipRef.instance.position = this.tooltipPosition;

    this.appRef.attachView(this.tooltipRef.hostView);

    const hostElement = this.elementRef.nativeElement;
    const tooltipElement = (this.tooltipRef.hostView as any).rootNodes[0];

    document.body.appendChild(tooltipElement);
    this.positionTooltip(hostElement, tooltipElement);
  }

  private hideTooltip() {
    if (this.tooltipRef) {
      this.appRef.detachView(this.tooltipRef.hostView);
      this.tooltipRef.destroy();
      this.tooltipRef = null;
    }
  }

  private positionTooltip(hostElement: HTMLElement, tooltipElement: HTMLElement) {
    const hostRect = hostElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (this.tooltipPosition) {
      case 'top':
        top = hostRect.top - tooltipRect.height - 10;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + 10;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - 10;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + 10;
        break;
    }

    tooltipElement.style.top = `${Math.max(0, top)}px`;
    tooltipElement.style.left = `${Math.max(0, left)}px`;
  }
}