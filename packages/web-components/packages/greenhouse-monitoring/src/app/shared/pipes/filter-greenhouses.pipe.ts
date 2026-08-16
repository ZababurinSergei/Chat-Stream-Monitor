import { Pipe, PipeTransform } from '@angular/core';
import { Greenhouse } from '../models/greenhouse.model';

@Pipe({
    name: 'filterGreenhouses',
    standalone: true
})
export class FilterGreenhousesPipe implements PipeTransform {
    transform(greenhouses: Greenhouse[], filter: string): Greenhouse[] {
        if (!filter) return greenhouses;

        const filterLower = filter.toLowerCase();
        return greenhouses.filter(g =>
            g.name.toLowerCase().includes(filterLower) ||
            g.id.toString().includes(filterLower) ||
            g.status.includes(filterLower)
        );
    }
}