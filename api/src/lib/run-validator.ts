/**
 * Validador de RUN chileno (Rol Único Nacional)
 * Utiliza el algoritmo módulo 11 para verificar el dígito verificador
 */

/**
 * Limpia el RUN removiendo puntos y guiones
 * @param run - RUN con o sin formato (ej: "12.345.678-9" o "123456789")
 * @returns RUN limpio en mayúsculas (ej: "123456789")
 */
export function cleanRun(run: string): string {
    return run.replace(/[.\-]/g, "").toUpperCase();
}

/**
 * Calcula el dígito verificador de un RUN chileno
 * @param runBody - Número del RUN sin dígito verificador
 * @returns Dígito verificador (0-9 o K)
 */
export function calculateVerifier(runBody: number): string {
    let sum = 0;
    let multiplier = 2;

    // Recorrer los dígitos de derecha a izquierda
    let current = runBody;
    while (current > 0) {
        sum += (current % 10) * multiplier;
        current = Math.floor(current / 10);
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = 11 - (sum % 11);

    if (remainder === 11) return "0";
    if (remainder === 10) return "K";
    return remainder.toString();
}

/**
 * Valida si un RUN chileno es válido
 * @param run - RUN a validar (acepta formatos: "12345678-9", "12.345.678-9", "123456789")
 * @returns true si el RUN es válido, false en caso contrario
 */
export function isValidRun(run: string): boolean {
    if (!run || typeof run !== "string") {
        return false;
    }

    const cleaned = cleanRun(run);

    // Validar formato: 7-9 dígitos seguidos de un dígito verificador (0-9 o K)
    const runRegex = /^(\d{7,9})([0-9K])$/;
    const match = cleaned.match(runRegex);

    if (!match) {
        return false;
    }

    const runBody = parseInt(match[1], 10);
    const providedVerifier = match[2];
    const calculatedVerifier = calculateVerifier(runBody);

    return providedVerifier === calculatedVerifier;
}

/**
 * Formatea un RUN limpio a formato con puntos y guión
 * @param run - RUN limpio (ej: "123456789")
 * @returns RUN formateado (ej: "12.345.678-9")
 */
export function formatRun(run: string): string {
    const cleaned = cleanRun(run);

    if (cleaned.length < 2) {
        return cleaned;
    }

    const body = cleaned.slice(0, -1);
    const verifier = cleaned.slice(-1);

    // Agregar puntos cada 3 dígitos desde la derecha
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return `${formatted}-${verifier}`;
}
