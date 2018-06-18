export interface RxCacheGlobalConfig {
    genericError: string;
    errorHandler?: (error: any, value?: any) => string;
}

export const globalConfig: RxCacheGlobalConfig = {
    genericError: 'An error has occoured'
};