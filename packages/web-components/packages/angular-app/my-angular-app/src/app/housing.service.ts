import {Injectable} from '@angular/core';
import {HousingLocationInfo} from "./housinglocation";
import {HttpClient} from '@angular/common/http';
import {Observable, map} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HousingService {
  url = 'http://localhost:3000/locations';
  constructor(private http: HttpClient) { }
  submitApplication(firstName: string, lastName: string, email: string) {
    console.log(
        `Homes application received: firstName: ${firstName}, lastName: ${lastName}, email: ${email}.`,
    );
  }
  getHousingLocationById(id: number): Observable<HousingLocationInfo | undefined> {
    return this.http.get<HousingLocationInfo[]>(`${this.url}?id=${id}`)
        .pipe(
            map(data => data[0] || undefined)
        );
  }

  getAllHousingLocations(): Observable<HousingLocationInfo[]> {
    return this.http.get<HousingLocationInfo[]>(this.url);
  }
}