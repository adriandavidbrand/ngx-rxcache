export interface GlobalConfig {
    genericError: string;
    errorHandler?: (id: string, error?: any) => string;
}

export const globalConfig: GlobalConfig = {
    genericError: 'An error has occoured'
};