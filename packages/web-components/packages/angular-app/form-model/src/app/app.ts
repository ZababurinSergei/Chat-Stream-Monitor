import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, Field,  required, email, submit } from '@angular/forms/signals';
import { LoginData } from './login-data'

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [Field],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  loginModel = signal<LoginData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.loginForm, async () => {
      const credentials = this.loginModel();
      console.log('Logging in with:', credentials);
      // Add your login logic here
    });
  }

  loginForm = form(this.loginModel, (fieldPath) => {
    required(fieldPath.email, {message: 'Email is required'});
    email(fieldPath.email, {message: 'Enter a valid email address'});
    required(fieldPath.password, {message: 'Password is required'});
  });
}
