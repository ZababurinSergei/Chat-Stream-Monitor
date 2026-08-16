import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HousingService } from '../housing.service';
import { HousingLocationInfo } from '../housinglocation';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-details',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details implements OnInit {
  route: ActivatedRoute = inject(ActivatedRoute);
  housingLocationId = -1;
  housingService = inject(HousingService);
  housingLocation: HousingLocationInfo | undefined;

  isLoading = signal(true);
  hasError = signal(false);

  applyForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    email: new FormControl(''),
  });

  submitApplication() {
    this.housingService.submitApplication(
        this.applyForm.value.firstName ?? '',
        this.applyForm.value.lastName ?? '',
        this.applyForm.value.email ?? '',
    );
  }

  ngOnInit() {
    const housingLocationId = parseInt(this.route.snapshot.params['id'], 10);
    this.isLoading.set(true);
    this.hasError.set(false);

    this.housingService.getHousingLocationById(housingLocationId).subscribe({
      next: (housingLocation: HousingLocationInfo | undefined) => {
        this.housingLocation = housingLocation;
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error fetching housing location:', error);
        this.isLoading.set(false);
        this.hasError.set(true);
      }
    });
  }
}