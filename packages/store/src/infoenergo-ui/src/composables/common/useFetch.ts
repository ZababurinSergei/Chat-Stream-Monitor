import { ref } from 'vue';

/**
 * Композабл для выполнения HTTP-запросов с базовой обработкой ошибок и состоянием загрузки
 *
 * @param baseUrl - Базовый URL для всех запросов (по умолчанию http://192.168.47.109:3000)
 *
 * @returns Поля и методы для выполнения запросов
 */
export const useFetch = () => {
    /** Флаг загрузки  */
    const loading = ref<boolean>(false);

    /** Сообщение об ошибке */
    const error = ref<string | null>(null);

    const HOST_1 = 'http://192.168.47.109:3000';
    const HOST_2 = 'http://192.168.47.109:3002';

    const apiHosts = {
        [HOST_1]: [
            'api/table/data/get',
            'api/table/data/set',
            'api/table/popover/data/get',
            'api/table/selector/data/get',
        ],
        [HOST_2]: ['api/table/virtual/data/get'],
    };

    const getApiHost = (endpoint: string) => {
        for (const [host, endpoints] of Object.entries(apiHosts)) {
            if (endpoints.includes(endpoint)) {
                return host;
            }
        }
        throw new Error(`Endpoint ${endpoint} not found`);
    };

    /**
     * Отправляет POST-запрос на указанный эндпоинт
     *
     * @param endpoint - Относительный путь API (добавляется к baseUrl)
     * @param [body] - Тело запроса в формате объекта (сериализуется в JSON)
     * @param [customHeaders] - Дополнительные HTTP-заголовки
     *
     * @returns Результат запроса в виде объекта или null при ошибке
     */
    const send = async (endpoint: string, body: object = {}, customHeaders: object = {}) => {
        loading.value = true;
        error.value = null;

        try {
            const url = `${getApiHost(endpoint)}/${endpoint}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...customHeaders,
                },
                body: JSON.stringify(body),
            });

            if (response.status === 204) {
                return { success: true };
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (err) {
            console.error('POST error:', err);

            if (err instanceof Error) {
                error.value = err.message;
            } else {
                error.value = String(err);
            }

            throw err;
        } finally {
            loading.value = false;
        }
    };

    return {
        loading,
        error,
        send,
    };
};
