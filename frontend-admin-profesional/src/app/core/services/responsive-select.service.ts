import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, NgZone, OnDestroy, PLATFORM_ID, inject } from '@angular/core';

type SelectOverlayInterface = 'action-sheet' | 'alert' | 'modal' | 'popover';

interface ResponsiveSelectElement extends HTMLElement {
  interface?: SelectOverlayInterface;
  interfaceOptions?: Record<string, unknown>;
  okText?: string;
  cancelText?: string;
  label?: string;
}

@Injectable({ providedIn: 'root' })
export class ResponsiveSelectService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private started = false;
  private observer?: MutationObserver;
  private onPointerDown?: EventListener;
  private onFocusIn?: EventListener;
  private onResize?: () => void;

  start(): void {
    if (this.started || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.started = true;

    this.ngZone.runOutsideAngular(() => {
      this.applyToAllSelects();

      this.onPointerDown = (event: Event) => this.applyFromEvent(event);
      this.onFocusIn = (event: Event) => this.applyFromEvent(event);
      this.onResize = () => this.applyToAllSelects();

      this.document.addEventListener('pointerdown', this.onPointerDown, true);
      this.document.addEventListener('focusin', this.onFocusIn, true);
      window.addEventListener('resize', this.onResize, { passive: true });

      this.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) {
              return;
            }

            if (node.matches('ion-select')) {
              this.applyToSelect(node as unknown as ResponsiveSelectElement);
            }

            node.querySelectorAll('ion-select').forEach((selectNode) => {
              this.applyToSelect(selectNode as unknown as ResponsiveSelectElement);
            });
          });
        });
      });

      if (this.document.body) {
        this.observer.observe(this.document.body, {
          childList: true,
          subtree: true
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.stop();
  }

  stop(): void {
    if (!this.started) {
      return;
    }

    if (this.onPointerDown) {
      this.document.removeEventListener('pointerdown', this.onPointerDown, true);
    }

    if (this.onFocusIn) {
      this.document.removeEventListener('focusin', this.onFocusIn, true);
    }

    if (this.onResize) {
      window.removeEventListener('resize', this.onResize);
    }

    this.observer?.disconnect();
    this.started = false;
  }

  private applyFromEvent(event: Event): void {
    const target = event.target as Element | null;
    const select = target?.closest?.('ion-select');
    if (select) {
      this.applyToSelect(select as unknown as ResponsiveSelectElement);
    }
  }

  private applyToAllSelects(): void {
    this.document.querySelectorAll('ion-select').forEach((selectNode) => {
      this.applyToSelect(selectNode as unknown as ResponsiveSelectElement);
    });
  }

  private applyToSelect(select: ResponsiveSelectElement): void {
    if (this.shouldSkip(select)) {
      return;
    }

    const header = this.resolveHeader(select);
    const isDesktop = window.matchMedia('(min-width: 992px)').matches;

    select.interface = 'modal';
    select.okText = 'Seleccionar';
    select.cancelText = 'Cancelar';
    select.interfaceOptions = isDesktop
      ? {
          header,
          cssClass: 'select-modal-responsive select-modal-desktop'
        }
      : {
          header,
          cssClass: 'select-modal-responsive select-modal-mobile',
          breakpoints: [0, 0.75, 1],
          initialBreakpoint: 0.75,
          backdropBreakpoint: 0.35,
          handle: true
        };
  }

  private shouldSkip(select: ResponsiveSelectElement): boolean {
    if (select.hasAttribute('data-skip-responsive-select')) {
      return true;
    }

    const explicitInterface = (select.getAttribute('interface') ?? '').trim();
    if (!explicitInterface) {
      return false;
    }

    return !['alert', 'action-sheet', 'modal'].includes(explicitInterface);
  }

  private resolveHeader(select: ResponsiveSelectElement): string {
    const label =
      select.getAttribute('label') ??
      select.label ??
      select.getAttribute('aria-label') ??
      'Seleccionar opción';

    const normalizedLabel = String(label).replace('*', '').trim();
    return normalizedLabel || 'Seleccionar opción';
  }
}
