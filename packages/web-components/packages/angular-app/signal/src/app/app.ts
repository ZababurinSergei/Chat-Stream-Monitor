import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
  linkedSignal,
  resource,
  model,
  inject,
  viewChild,
  effect
} from '@angular/core';
import {loadUser} from './user-api';
import {ProductCard} from './product-card';
import {CustomCheckbox} from './custom-checkbox';
import {CartStore} from './cart-store';
import {CartDisplay} from './cart-display';
import {HighlightDirective} from './highlight-directive';
import {CartSummary} from './cart-summary';

@Component({
  standalone: true,
  imports: [ProductCard, CustomCheckbox, CartDisplay, HighlightDirective, CartSummary],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  cartQuantity = signal(2);
  firstProduct = viewChild(ProductCard);
  cartSummary = viewChild(CartSummary);
  cartStore = inject(CartStore);
// Now with linkedSignal - same expression, but writable:
  agreedToTerms = model(false);
  enableNotifications = model(true);
// Methods to test two-way binding
  theme = signal<'light' | 'dark'>('light');
  username = signal('Guest');
  isLoggedIn = signal(false);

  themeClass = computed(() => `theme-${this.theme()}`);

  constructor() {
    effect(() => {
      localStorage.setItem('theme', this.theme());
      console.log('Theme saved to localStorage:', this.theme());
    });

    effect(() => {
      const status = this.isLoggedIn() ? 'logged in' : 'logged out';
      const user = this.username();
      console.log(`User ${user} is ${status}`);
    });

    effect((onCleanup) => {
      const interval = setInterval(() => {
        console.log('Timer tick - Current theme:', this.theme());
      }, 5000);
      // Clean up the interval when the effect is destroyed
      onCleanup(() => {
        clearInterval(interval);
        console.log('Timer cleaned up');
      });
    });
  }

  toggleTheme() {
    this.theme.set(this.theme() === 'light' ? 'dark' : 'light');
  }

  login() {
    this.username.set('John Doe');
    this.isLoggedIn.set(true);
  }

  logout() {
    this.username.set('Guest');
    this.isLoggedIn.set(false);
  }

  totalPrice = computed(() => {
    return this.cartQuantity() * 999;
  });

  updateQuantity(change: number) {
    const newQuantity = this.cartQuantity() + change;
    if (newQuantity >= 0 && newQuantity <= 10) {
      this.cartQuantity.set(newQuantity);
    }
  }

  showFirstProductDetails() {
    const product = this.firstProduct();
    if (product) {
      product.highlight();
    }
  }

  initiateCheckout() {
    const summary = this.cartSummary();
    if (summary) {
      summary.initiateCheckout();
    }
  }

  toggleTermsFromParent() {
    this.agreedToTerms.set(!this.agreedToTerms());
  }
  resetAll() {
    this.agreedToTerms.set(false);
    this.enableNotifications.set(false);
  }

  productName = signal('Demo Product');
  productPrice = signal(99);
  productAvailable = signal(true);
  isLoading = computed(() => this.userResource.status() === 'loading');
  hasError = computed(() => this.userResource.status() === 'error');

  userId = signal(1);

  updateProduct() {
    this.productName.set('Updated Product');
    this.productPrice.set(149);
  }

  toggleAvailability() {
    this.productAvailable.set(!this.productAvailable());
  }

  userResource = resource({
    params: () => ({ id: this.userId() }),
    loader: (params) => loadUser(params.params.id)
  });

  loadUser(id: number) {
    this.userId.set(id);
  }

  reloadUser() {
    this.userResource.reload();
  }
  toggleNotifications() {
    this.notificationsEnabled.set(!this.notificationsEnabled());
  };
  notificationsEnabled = linkedSignal(() => {
    return this.userStatus() === 'online'
  });
  isWithinWorkingHours = computed(() => {
    const now = new Date();
    const hour = now.getHours();
    const isWeekday = now.getDay() > 0 && now.getDay() < 6;
    return isWeekday && hour >= 9 && hour < 17 && this.userStatus() !== 'offline';
  });
  statusMessage = computed(() => {
    const status = this.userStatus();
    switch (status) {
      case 'online': return 'Available for meetings and messages';
      case 'away': return 'Temporarily away, will respond soon';
      case 'offline': return 'Not available, check back later';
      default: return 'Status unknown';
    }
  });
  userStatus = signal<'online' | 'offline' | 'away'>('offline');
  count = signal(0);

  isEven = computed(() => this.count() % 2 === 0);

  toggleStatus() {
    this.userStatus.update(current => current === 'online' ? 'offline' : 'online');
  }

  goAway() {
    this.userStatus.set('away');
  }

  goOnline() {
    this.userStatus.set('online');
  }

  goOffline() {
    this.userStatus.set('offline');
  }

  increment() {
    this.count.set(this.count() + 1);
  }

  decrement() {
    this.count.set(this.count() - 1);
  }
}
