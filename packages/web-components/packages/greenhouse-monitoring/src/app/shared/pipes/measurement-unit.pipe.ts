import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'measurementUnit',
    standalone: true
})
export class MeasurementUnitPipe implements PipeTransform {
    transform(type: string): string {
        const unitMap: Record<string, string> = {
            'temperature': '°C',
            'humidity': '%',
            'acidity': 'pH',
            'pressure': 'кПа',
            'light': 'лк',
            'co2': 'ppm',
            'soil_moisture': '%',
            'soil_temperature': '°C',
            'wind_speed': 'м/с'
        };
        return unitMap[type] || '';
    }
}