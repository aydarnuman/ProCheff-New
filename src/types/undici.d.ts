declare module 'undici' {
  export type Dispatcher = any;
  export type RequestOptions = {
    method?: string;
    headers?: Record<string, string>;
    body?: string | Buffer | Uint8Array;
    dispatcher?: Dispatcher;
  };
  export type RequestResult = {
    statusCode: number;
    body: {
      text(): Promise<string>;
      json(): Promise<any>;
    };
  };
  export function request(url: string, options?: RequestOptions): Promise<RequestResult>;
}
