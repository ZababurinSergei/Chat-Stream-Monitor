export interface Region {
    id: number;
    name: string;
    greenhouses: Greenhouse[];
}

export interface Greenhouse {
    id: number;
    name: string;
    status: 'normal' | 'warning' | 'emergency';
    lastUpdated: Date;
    regionId?: number;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    sensorCount?: number;
    measurements?: Measurement[];
    history?: StatusHistory[];
    recalculations?: RecalculationRequest[];
}

export interface Measurement {
    id?: number;
    greenhouseId: number;
    type: 'temperature' | 'humidity' | 'acidity';
    value: number;
    timestamp: Date;
    unit?: string;
    isCorrected?: boolean;
    correctedBy?: string;
    correctedAt?: Date;
    originalValue?: number;
}

export interface StatusHistory {
    id: number;
    greenhouseId: number;
    previousStatus: string;
    newStatus: string;
    changedAt: Date;
    comment: string;
    changedBy: string;
    measurementSnapshot?: {
        temperature: number;
        humidity: number;
        acidity: number;
    };
}

export interface RecalculationRequest {
    id: string;
    greenhouseId: number;
    requestedAt: Date;
    estimatedCompletion: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedBy: string;
    result?: {
        calculatedStatus: string;
        confidence: number;
        recommendations: string[];
    };
    errorMessage?: string;
}

export interface PollingRequest {
    id: string;
    greenhouseId: number;
    requestedAt: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    sensors: string[];
    completedAt?: Date;
    measurements?: Measurement[];
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'specialist' | 'senior-specialist';
    regionAccess: number[];
    lastLogin: Date;
}

export interface ChartTimeRange {
    label: string;
    value: 'day' | 'week' | 'month' | 'year';
    interval: 'hour' | 'day' | 'week' | 'month';
    dataPoints: number;
}

export interface GreenhouseStats {
    total: number;
    byStatus: {
        normal: number;
        warning: number;
        emergency: number;
    };
    byRegion: Array<{
        regionId: number;
        regionName: string;
        count: number;
        statusCount: {
            normal: number;
            warning: number;
            emergency: number;
        };
    }>;
    lastUpdated: Date;
}

export interface Alert {
    id: number;
    greenhouseId: number;
    greenhouseName: string;
    regionName: string;
    type: 'warning' | 'emergency';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
}

export interface Comment {
    id: number;
    greenhouseId: number;
    userId: number;
    userName: string;
    userRole: string;
    text: string;
    timestamp: Date;
    isEdited: boolean;
    editedAt?: Date;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface FilterOptions {
    regionId?: number;
    status?: string[];
    dateRange?: {
        from: Date;
        to: Date;
    };
    searchText?: string;
    sortBy?: 'name' | 'status' | 'lastUpdated';
    sortOrder?: 'asc' | 'desc';
}

export interface MeasurementStatistics {
    greenhouseId: number;
    type: 'temperature' | 'humidity' | 'acidity';
    min: number;
    max: number;
    avg: number;
    median: number;
    stdDev: number;
    last24hTrend: 'rising' | 'falling' | 'stable';
    optimalRange: {
        min: number;
        max: number;
    };
    isOptimal: boolean;
}

export interface GreenhouseHealthReport {
    greenhouseId: number;
    reportDate: Date;
    overallStatus: string;
    score: number;
    measurements: {
        temperature: MeasurementStatistics;
        humidity: MeasurementStatistics;
        acidity: MeasurementStatistics;
    };
    recommendations: string[];
    generatedBy: string;
    generationTime: Date;
}

export interface SystemConfig {
    measurementIntervals: {
        normal: number;
        warning: number;
        emergency: number;
    };
    recalculationThresholds: {
        maxProcessingTime: number;
        retryAttempts: number;
        batchSize: number;
    };
    notificationSettings: {
        emailNotifications: boolean;
        pushNotifications: boolean;
        alertThresholds: {
            temperature: number;
            humidity: number;
            acidity: number;
        };
    };
}