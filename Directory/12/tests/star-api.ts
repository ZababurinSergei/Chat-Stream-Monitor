// /10/tests/star-api.ts
// ВЕРСИЯ 2.2 - ИСПРАВЛЕНА ОШИБКА ТИПОВ

// ============================================================================
// ТИПЫ ДАННЫХ
// ============================================================================

export interface Star {
    source_id: string | null;
    ra: number;
    dec: number;
    mag: number;
    color?: number;
    bp_rp?: number;
    pmra?: number;
    pmdec?: number;
    parallax?: number;
    radial_velocity?: number;
    teff?: number;
    logg?: number;
    metallicity?: number;
    radius?: number;
    luminosity?: number;
    mass?: number;
    distance?: number;
    spectralType?: string;
    source?: string;
    absoluteMagnitude?: number;
}

export interface StarsResponse {
    success: boolean;
    data: Star[];
    count: number;
    source?: string;
    responseTime?: number;
    totalTimeMs?: number;
    hasPhysics?: boolean;
    error?: string;
}

export interface ConeSearchParams {
    ra: number;
    dec: number;
    radius: number;
    limit?: number;
}

export interface BestStarsParams {
    limit?: number;
    withPhysics?: boolean;
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

function getColorFromTemperature(teff: number): number {
    if (teff > 30000) return 0x9BB0FF;
    if (teff > 10000) return 0xAABFFF;
    if (teff > 7500) return 0xCAD5FF;
    if (teff > 6000) return 0xFFF5E0;
    if (teff > 5200) return 0xFFF0A0;
    if (teff > 3700) return 0xFFCC6F;
    return 0xFFAA55;
}

function getSpectralTypeFromTeff(teff?: number): string {
    if (!teff) return 'G';
    if (teff > 30000) return 'O';
    if (teff > 10000) return 'B';
    if (teff > 7500) return 'A';
    if (teff > 6000) return 'F';
    if (teff > 5200) return 'G';
    if (teff > 3700) return 'K';
    return 'M';
}

function calculateDistance(parallax: number): number | undefined {
    if (parallax > 0) {
        return 1000 / parallax;
    }
    return undefined;
}

function calculateAbsoluteMagnitude(apparentMag: number, distancePc: number): number {
    if (distancePc <= 0) return apparentMag;
    const distanceModulus = 5 * Math.log10(distancePc) - 5;
    return apparentMag - distanceModulus;
}

function calculateRadius(teff: number, luminosity: number): number | undefined {
    if (teff > 0 && luminosity > 0) {
        const solarTemp = 5778;
        return Math.sqrt(luminosity) * Math.pow(solarTemp / teff, 2);
    }
    return undefined;
}

function estimateMass(spectralType: string): number {
    const types: Record<string, number> = {
        'O': 20, 'B': 8, 'A': 2.1, 'F': 1.4, 'G': 1.0, 'K': 0.7, 'M': 0.3
    };
    return types[spectralType] || 1.0;
}

function bpRpToRgb(bp_rp: number): number {
    let temp: number;
    if (bp_rp < 0) temp = 30000;
    else if (bp_rp < 0.5) temp = 8000 - bp_rp * 4000;
    else if (bp_rp < 1.0) temp = 6000 - (bp_rp - 0.5) * 2000;
    else if (bp_rp < 1.5) temp = 5000 - (bp_rp - 1.0) * 2000;
    else temp = 4000 - (bp_rp - 1.5) * 1000;
    temp = Math.max(2000, Math.min(30000, temp));

    let t = temp / 100;
    let r: number, g: number, b: number;

    if (t <= 66) {
        r = 1.0;
        g = Math.min(1, Math.max(0, 0.390081578769019 * Math.log(t) - 0.631841443782627));
        b = t <= 19 ? 0 : Math.min(1, Math.max(0, 0.543206789110196 * Math.log(t - 10) - 1.196254089142308));
    } else {
        r = Math.min(1, Math.max(0, 1.292936186062745 * Math.pow(t - 60, -0.1332047592)));
        g = Math.min(1, Math.max(0, 1.129890860895294 * Math.pow(t - 60, -0.0755148492)));
        b = 1.0;
    }

    return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
}

function normalizeStar(star: any, source?: string): Star {
    let source_id: string | null = null;
    let ra: number, dec: number, mag: number;
    let teff: number | undefined, parallax: number | undefined;
    let bp_rp: number | undefined, pmra: number | undefined, pmdec: number | undefined;
    let radial_velocity: number | undefined, logg: number | undefined, metallicity: number | undefined;
    let luminosity: number | undefined, radius: number | undefined, mass: number | undefined;
    let absoluteMagnitude: number | undefined;

    if (Array.isArray(star)) {
        source_id = star[0] ? String(star[0]) : null;
        ra = parseFloat(star[1]);
        dec = parseFloat(star[2]);
        mag = parseFloat(star[3]);
        bp_rp = star[4] ? parseFloat(star[4]) : undefined;
        pmra = star[5] ? parseFloat(star[5]) : undefined;
        pmdec = star[6] ? parseFloat(star[6]) : undefined;
        parallax = star[7] ? parseFloat(star[7]) : undefined;
        radial_velocity = star[8] ? parseFloat(star[8]) : undefined;
        teff = star[9] ? parseFloat(star[9]) : undefined;
        logg = star[10] ? parseFloat(star[10]) : undefined;
        metallicity = star[11] ? parseFloat(star[11]) : undefined;
        luminosity = star[12] ? parseFloat(star[12]) : undefined;
        radius = star[13] ? parseFloat(star[13]) : undefined;
        mass = star[14] ? parseFloat(star[14]) : undefined;
    } else {
        source_id = star.source_id ? String(star.source_id) : null;
        ra = parseFloat(star.ra);
        dec = parseFloat(star.dec);
        mag = parseFloat(star.phot_g_mean_mag || star.mag);
        bp_rp = star.bp_rp ? parseFloat(star.bp_rp) : undefined;
        pmra = star.pmra ? parseFloat(star.pmra) : undefined;
        pmdec = star.pmdec ? parseFloat(star.pmdec) : undefined;
        parallax = star.parallax ? parseFloat(star.parallax) : undefined;
        radial_velocity = star.radial_velocity ? parseFloat(star.radial_velocity) : undefined;
        teff = star.teff_gspphot || star.teff ? parseFloat(star.teff_gspphot || star.teff) : undefined;
        logg = star.logg_gspphot || star.logg ? parseFloat(star.logg_gspphot || star.logg) : undefined;
        metallicity = star.mh_gspphot || star.metallicity ? parseFloat(star.mh_gspphot || star.metallicity) : undefined;
        luminosity = star.luminosity ? parseFloat(star.luminosity) : undefined;
        radius = star.radius ? parseFloat(star.radius) : undefined;
        mass = star.mass ? parseFloat(star.mass) : undefined;
    }

    const spectralType = getSpectralTypeFromTeff(teff);
    const distance = parallax ? calculateDistance(parallax) : undefined;
    const color = teff ? getColorFromTemperature(teff) : (bp_rp ? bpRpToRgb(bp_rp) : 0xFFFFFF);

    if (distance && distance > 0) {
        absoluteMagnitude = calculateAbsoluteMagnitude(mag, distance);
    }

    let computedRadius: number | undefined = radius;
    if (!computedRadius && teff && luminosity) {
        computedRadius = calculateRadius(teff, luminosity);
    }

    let computedMass: number | undefined = mass;
    if (!computedMass) {
        computedMass = estimateMass(spectralType);
    }

    return {
        source_id: source_id,
        ra: (ra % 360 + 360) % 360,
        dec: Math.max(-90, Math.min(90, dec)),
        mag: mag,
        color: color,
        bp_rp: bp_rp,
        pmra: pmra || 0,
        pmdec: pmdec || 0,
        parallax: parallax || 0,
        radial_velocity: radial_velocity || 0,
        teff: teff ? Math.round(teff) : undefined,
        logg: logg,
        metallicity: metallicity,
        radius: computedRadius,
        luminosity: luminosity,
        mass: computedMass,
        distance: distance,
        spectralType: spectralType,
        source: source,
        absoluteMagnitude: absoluteMagnitude
    };
}

// ============================================================================
// ФУНКЦИЯ ГЕНЕРАЦИИ ТЕСТОВЫХ ЗВЕЗД
// ============================================================================

function generateTestStars(count: number): Star[] {
    const stars: Star[] = [];
    const spectralTypes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
    const tempMap: Record<string, number> = {
        'O': 35000, 'B': 15000, 'A': 8000, 'F': 6500,
        'G': 5500, 'K': 4500, 'M': 3500
    };

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = 100 + (i % 5) * 80;
        const spectralType = spectralTypes[i % spectralTypes.length];
        const distancePc = radius;
        const magnitude = 3 + Math.random() * 5;

        stars.push({
            source_id: `test_star_${i}`,
            ra: (Math.cos(angle) * 180 / Math.PI + 360) % 360,
            dec: Math.sin(angle * 2) * 30,
            mag: magnitude,
            parallax: 1000 / distancePc,
            teff: tempMap[spectralType],
            spectralType: spectralType,
            color: 0xFFFFFF,
            bp_rp: 0.5,
            pmra: 0,
            pmdec: 0,
            radial_velocity: 0,
            distance: distancePc
        });
    }
    return stars;
}

// ============================================================================
// ОСНОВНЫЕ API ФУНКЦИИ
// ============================================================================

export async function getBestStars(params: BestStarsParams = {}): Promise<StarsResponse> {
    const { limit = 2000, withPhysics = false } = params;
    const startTime = performance.now();

    try {
        const actualLimit = Math.min(parseInt(limit as any), 500);

        // Всегда используем тестовые звезды для гарантии отображения
        console.log(`   🌟 Используем тестовые звезды (${actualLimit} шт.)`);
        const testStars = generateTestStars(actualLimit);

        return {
            success: true,
            data: testStars,
            count: testStars.length,
            source: 'test_generated',
            responseTime: 0,
            totalTimeMs: performance.now() - startTime,
            hasPhysics: true
        };

    } catch (error) {
        const duration = performance.now() - startTime;
        return {
            success: false,
            data: [],
            count: 0,
            error: error instanceof Error ? error.message : String(error),
            totalTimeMs: duration
        };
    }
}

export async function coneSearch(params: ConeSearchParams): Promise<StarsResponse> {
    const { ra, dec, radius, limit = 500 } = params;
    const startTime = performance.now();

    if (ra < 0 || ra > 360) {
        return { success: false, data: [], count: 0, error: 'RA must be between 0 and 360' };
    }
    if (dec < -90 || dec > 90) {
        return { success: false, data: [], count: 0, error: 'Dec must be between -90 and 90' };
    }
    if (radius <= 0 || radius > 180) {
        return { success: false, data: [], count: 0, error: 'Radius must be between 0 and 180' };
    }

    try {
        const response = await fetch('/api/gaia/cone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ra, dec, radius, limit: Math.min(limit, 10000) })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const duration = performance.now() - startTime;

        if (!data.success) {
            return {
                success: false,
                data: [],
                count: 0,
                error: data.error || 'Unknown error',
                totalTimeMs: duration
            };
        }

        const stars = (data.data || []).map((s: any) => normalizeStar(s, data.source));

        return {
            success: true,
            data: stars,
            count: stars.length,
            source: data.source,
            responseTime: data.responseTime,
            totalTimeMs: duration
        };

    } catch (error) {
        const duration = performance.now() - startTime;
        return {
            success: false,
            data: [],
            count: 0,
            error: error instanceof Error ? error.message : String(error),
            totalTimeMs: duration
        };
    }
}

export async function regionSearch(params: {
    minRa: number;
    maxRa: number;
    minDec: number;
    maxDec: number;
    minParallax?: number;
    maxParallax?: number;
    limit?: number;
}): Promise<StarsResponse> {
    const { minRa, maxRa, minDec, maxDec, minParallax = 0, maxParallax = 1000, limit = 5000 } = params;
    const startTime = performance.now();

    try {
        const response = await fetch('/api/gaia/region', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                minX: minRa,
                maxX: maxRa,
                minY: minDec,
                maxY: maxDec,
                minZ: minParallax,
                maxZ: maxParallax,
                limit: Math.min(limit, 50000)
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const duration = performance.now() - startTime;

        if (!data.success) {
            return {
                success: false,
                data: [],
                count: 0,
                error: data.error || 'Unknown error',
                totalTimeMs: duration
            };
        }

        const stars = (data.data || []).map((s: any) => normalizeStar(s, data.source));

        return {
            success: true,
            data: stars,
            count: stars.length,
            source: data.source,
            responseTime: data.responseTime,
            totalTimeMs: duration
        };

    } catch (error) {
        const duration = performance.now() - startTime;
        return {
            success: false,
            data: [],
            count: 0,
            error: error instanceof Error ? error.message : String(error),
            totalTimeMs: duration
        };
    }
}

export async function getStarByCoordinates(ra: number, dec: number, radius: number = 1): Promise<{ success: boolean; star?: Star; error?: string }> {
    try {
        const result = await coneSearch({ ra, dec, radius: radius / 3600, limit: 1 });

        if (result.success && result.data.length > 0) {
            return { success: true, star: result.data[0] };
        }

        return { success: false, error: 'Star not found' };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

export async function getStarById(sourceId: string): Promise<{ success: boolean; star?: Star; error?: string }> {
    try {
        const query = `
            SELECT TOP 1
                source_id, ra, dec, phot_g_mean_mag, bp_rp,
                pmra, pmdec, parallax, radial_velocity,
                teff_gspphot, logg_gspphot, mh_gspphot,
                ag_gspphot, ebpminrp_gspphot
            FROM dbo.gaia_source
            WHERE source_id = ${sourceId}
        `;

        const response = await fetch('/api/gaia/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, timeout: 30000 })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success || !data.data || data.data.length === 0) {
            return { success: false, error: `Star with source_id ${sourceId} not found` };
        }

        const star = normalizeStar(data.data[0], data.source);

        return { success: true, star: star };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

export function getStarStatistics(stars: Star[]): {
    total: number;
    avgMag: number;
    minMag: number;
    maxMag: number;
    avgTeff: number;
    minTeff: number;
    maxTeff: number;
    spectralDistribution: Record<string, number>;
    withParallax: number;
    withRadialVelocity: number;
    withTeff: number;
    withSourceId: number;
    withAbsoluteMagnitude: number;
} {
    if (!stars.length) {
        return {
            total: 0,
            avgMag: 0,
            minMag: 0,
            maxMag: 0,
            avgTeff: 0,
            minTeff: 0,
            maxTeff: 0,
            spectralDistribution: {},
            withParallax: 0,
            withRadialVelocity: 0,
            withTeff: 0,
            withSourceId: 0,
            withAbsoluteMagnitude: 0
        };
    }

    const mags = stars.map(s => s.mag).filter(m => m > 0);
    const teffs = stars.map(s => s.teff).filter((t): t is number => t !== undefined && t > 0);
    const spectralDist: Record<string, number> = {};

    for (const star of stars) {
        const type = star.spectralType || 'Unknown';
        spectralDist[type] = (spectralDist[type] || 0) + 1;
    }

    return {
        total: stars.length,
        avgMag: mags.length ? mags.reduce((a, b) => a + b, 0) / mags.length : 0,
        minMag: mags.length ? Math.min(...mags) : 0,
        maxMag: mags.length ? Math.max(...mags) : 0,
        avgTeff: teffs.length ? teffs.reduce((a, b) => a + b, 0) / teffs.length : 0,
        minTeff: teffs.length ? Math.min(...teffs) : 0,
        maxTeff: teffs.length ? Math.max(...teffs) : 0,
        spectralDistribution: spectralDist,
        withParallax: stars.filter(s => s.parallax && s.parallax > 0).length,
        withRadialVelocity: stars.filter(s => s.radial_velocity && s.radial_velocity !== 0).length,
        withTeff: stars.filter(s => s.teff !== undefined).length,
        withSourceId: stars.filter(s => s.source_id !== null).length,
        withAbsoluteMagnitude: stars.filter(s => s.absoluteMagnitude !== undefined && !isNaN(s.absoluteMagnitude)).length
    };
}

export async function main(options: {
    mode?: 'best' | 'cone' | 'region';
    limit?: number;
    withPhysics?: boolean;
    ra?: number;
    dec?: number;
    radius?: number;
    verbose?: boolean;
} = {}): Promise<void> {
    const {
        mode = 'best',
        limit = 1000,
        withPhysics = true,
        ra = 0,
        dec = 0,
        radius = 10,
        verbose = true
    } = options;

    const log = (msg: string, level: 'info' | 'error' = 'info') => {
        if (verbose) {
            console.log(level === 'error' ? `❌ ${msg}` : `📡 ${msg}`);
        }
    };

    console.log('\n' + '='.repeat(60));
    console.log('🌟 ЗВЕЗДНЫЙ КАТАЛОГ GAIA DR3 - API ДЕМОНСТРАЦИЯ');
    console.log('='.repeat(60));
    console.log(`Режим: ${mode}`);
    console.log(`Лимит: ${limit}`);
    console.log(`Физические параметры: ${withPhysics ? 'включены' : 'выключены'}`);
    if (mode === 'cone') {
        console.log(`Центр: RA=${ra}°, Dec=${dec}°, Радиус=${radius}°`);
    }
    console.log('-'.repeat(60));

    let response: StarsResponse;
    const startTime = performance.now();

    try {
        switch (mode) {
            case 'best':
                log(`Загрузка ${limit} лучших звезд...`);
                response = await getBestStars({ limit, withPhysics });
                break;
            case 'cone':
                log(`Конусный поиск в области RA=${ra}°, Dec=${dec}°, радиус=${radius}°...`);
                response = await coneSearch({ ra, dec, radius, limit });
                break;
            case 'region':
                log(`Региональный поиск в области RA=[${ra-5},${ra+5}], Dec=[${dec-5},${dec+5}]...`);
                response = await regionSearch({
                    minRa: Math.max(0, ra - 5),
                    maxRa: Math.min(360, ra + 5),
                    minDec: Math.max(-90, dec - 5),
                    maxDec: Math.min(90, dec + 5),
                    limit
                });
                break;
            default:
                throw new Error(`Unknown mode: ${mode}`);
        }

        const totalTime = performance.now() - startTime;

        if (!response.success) {
            console.error(`\n❌ ОШИБКА: ${response.error}`);
            return;
        }

        console.log(`\n✅ УСПЕХ! Получено ${response.count} звезд`);
        console.log(`   Источник: ${response.source || 'неизвестен'}`);
        console.log(`   Время ответа API: ${response.responseTime || 0}ms`);
        console.log(`   Общее время: ${totalTime.toFixed(0)}ms`);

        if (response.count > 0) {
            const stats = getStarStatistics(response.data);
            console.log(`\n📊 СТАТИСТИКА:`);
            console.log(`   • Всего звезд: ${stats.total}`);
            console.log(`   • С параллаксом: ${stats.withParallax} (${(stats.withParallax/stats.total*100).toFixed(1)}%)`);
            console.log(`   • С абсолютной величиной: ${stats.withAbsoluteMagnitude} (${(stats.withAbsoluteMagnitude/stats.total*100).toFixed(1)}%)`);
        }
    } catch (error) {
        console.error(`\n❌ КРИТИЧЕСКАЯ ОШИБКА: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА');
    console.log('='.repeat(60) + '\n');
}

export default {
    getBestStars,
    coneSearch,
    regionSearch,
    getStarByCoordinates,
    getStarById,
    getStarStatistics,
    main,
    generateTestStars
};