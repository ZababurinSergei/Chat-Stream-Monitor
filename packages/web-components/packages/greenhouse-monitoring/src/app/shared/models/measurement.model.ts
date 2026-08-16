export interface Measurement {
    id?: number;
    greenhouseId: number;
    type: 'temperature' | 'humidity' | 'acidity' | 'co2' | 'light';
    value: number;
    timestamp: Date;
    unit: string;
    sensorId?: string;
    isValid: boolean;
    editedBy?: string;
    editedAt?: Date;
    originalValue?: number;
}

export interface MeasurementAggregate {
    greenhouseId: number;
    type: 'temperature' | 'humidity' | 'acidity';
    hourly: MeasurementPoint[];
    daily: MeasurementPoint[];
    weekly: MeasurementPoint[];
    monthly: MeasurementPoint[];
    yearly: MeasurementPoint[];
}

export interface MeasurementPoint {
    timestamp: Date;
    value: number;
    min?: number;
    max?: number;
    avg: number;
    count: number;
}

export interface MeasurementRange {
    startDate: Date;
    endDate: Date;
    type?: 'temperature' | 'humidity' | 'acidity';
    aggregation?: 'hour' | 'day' | 'week' | 'month' | 'year';
}

export interface MeasurementEditRequest {
    measurementId: number;
    greenhouseId: number;
    newValue: number;
    comment?: string;
    editedBy: string;
    timestamp: Date;
}

export interface MeasurementEditResponse {
    success: boolean;
    measurement: Measurement;
    previousValue: number;
    editTimestamp: Date;
}

export interface SensorData {
    sensorId: string;
    greenhouseId: number;
    type: 'temperature' | 'humidity' | 'acidity' | 'co2' | 'light';
    lastValue: number;
    lastReading: Date;
    batteryLevel?: number;
    status: 'online' | 'offline' | 'maintenance';
    calibrationDate?: Date;
}

export interface MeasurementStats {
    greenhouseId: number;
    period: 'day' | 'week' | 'month' | 'year';
    temperature: {
        current: number;
        average: number;
        min: number;
        max: number;
        trend: 'up' | 'down' | 'stable';
    };
    humidity: {
        current: number;
        average: number;
        min: number;
        max: number;
        trend: 'up' | 'down' | 'stable';
    };
    acidity: {
        current: number;
        average: number;
        min: number;
        max: number;
        trend: 'up' | 'down' | 'stable';
    };
    lastUpdated: Date;
}

export interface RealTimeMeasurement {
    greenhouseId: number;
    measurements: {
        temperature: number;
        humidity: number;
        acidity: number;
        co2?: number;
        light?: number;
    };
    timestamp: Date;
    sensorStatus: Record<string, 'online' | 'offline'>;
}

export interface MeasurementAlert {
    id: number;
    greenhouseId: number;
    type: 'temperature' | 'humidity' | 'acidity';
    thresholdType: 'min' | 'max';
    thresholdValue: number;
    currentValue: number;
    severity: 'warning' | 'critical';
    timestamp: Date;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
}

export interface MeasurementExport {
    greenhouseId: number;
    startDate: Date;
    endDate: Date;
    types: ('temperature' | 'humidity' | 'acidity')[];
    format: 'csv' | 'json' | 'excel';
    includeMetadata: boolean;
}

export interface MeasurementValidationRule {
    type: 'temperature' | 'humidity' | 'acidity';
    minValue: number;
    maxValue: number;
    allowedDeviation: number;
    required: boolean;
}

export interface MeasurementQuality {
    greenhouseId: number;
    timestamp: Date;
    completeness: number; // 0-100%
    accuracy: number; // 0-100%
    timeliness: number; // 0-100%
    overallScore: number; // 0-100%
    issues: string[];
}