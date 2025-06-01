declare module 'react-hot-toast' {
  interface Toast {
    (message: string, options?: any): string;
    (options: { id: string, message?: string, type?: string, icon?: string }): string;
    (options: { id?: string, loading?: boolean, success?: string, error?: string }): string;
    (options: { id?: string, loading?: boolean, success?: (data: any) => string, error?: (err: any) => string }): string;
    (options: { id?: string, loading?: string, success?: string, error?: string }): string;
    (options: { id?: string, loading?: string, success?: (data: any) => string, error?: (err: any) => string }): string;
    (options: { id?: string, loading?: string, success?: string, error?: (err: any) => string }): string;
    (options: { id?: string, loading?: string, success?: (data: any) => string, error?: string }): string;
    (options: { id?: string, loading?: (data: any) => string, success?: string, error?: string }): string;
    (options: { id?: string, loading?: (data: any) => string, success?: (data: any) => string, error?: string }): string;
    (options: { id?: string, loading?: (data: any) => string, success?: string, error?: (err: any) => string }): string;
    (options: { id?: string, loading?: (data: any) => string, success?: (data: any) => string, error?: (err: any) => string }): string;

    success: (message: string, options?: any) => string;
    error: (message: string, options?: any) => string;
    loading: (message: string, options?: any) => string;
    custom: (message: React.ReactNode, options?: any) => string;
    dismiss: (toastId?: string) => void;
    remove: (toastId?: string) => void;
    promise: <T>(promise: Promise<T>, msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }, opts?: any) => Promise<T>;
  }

  export interface ToasterProps {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    toastOptions?: any;
    reverseOrder?: boolean;
    gutter?: number;
    containerStyle?: React.CSSProperties;
    containerClassName?: string;
    children?: (props: any) => React.ReactNode;
  }

  export const Toaster: React.FC<ToasterProps>;

  const toast: Toast;
  export default toast;
  export { toast };
}
