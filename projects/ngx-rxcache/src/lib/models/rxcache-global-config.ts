export interface RxCacheGlobalConfig {
    genericError: string;
    errorHandler?: (id: string, error?: any) => string;
}

export const globalConfig: RxCacheGlobalConfig = {
    genericError: 'An error has occoured'
};