import { Component, inject, OnInit, signal } from '@angular/core';
import { HousingLocation } from '../housing-location/housing-location';
import { HousingLocationInfo } from '../housinglocation';
import { HousingService } from '../housing.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-home',
    imports: [HousingLocation, CommonModule],
    templateUrl: './home.html',
    styleUrl: './home.css',
})

export class Home implements OnInit {
    housingLocationList: HousingLocationInfo[] = [];
    housingService: HousingService = inject(HousingService);
    filteredLocationList: HousingLocationInfo[] = [];
    isLoading = signal(true);
    hasError = signal(false);

    filterResults(text: string) {
        if (!text) {
            this.filteredLocationList = this.housingLocationList;
            return;
        }
        this.filteredLocationList = this.housingLocationList.filter((housingLocation) =>
            housingLocation?.city.toLowerCase().includes(text.toLowerCase()),
        );
    }

    ngOnInit(): void {
        this.housingService.getAllHousingLocations().subscribe({
            next: (data: HousingLocationInfo[]) => {
                this.housingLocationList = data;
                this.filteredLocationList = data;
                this.isLoading.set(false);
                this.hasError.set(false);
                console.log('Data loaded:', data);
            },
            error: (error: any) => {
                console.error('Error loading data:', error);
                this.isLoading.set(false);
                this.hasError.set(true);
            }
        });
    }
}