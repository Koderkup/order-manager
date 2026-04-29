'use client';

import { ToastContainer, toast, ToastOptions, Id } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createContext, useContext } from 'react';

type ToastContextType = {
  notifySuccess: (message: string, options?: ToastOptions) => void;
  notifyError: (message: string, options?: ToastOptions) => void;
  notifyInfo: (message: string, options?: ToastOptions) => void;
  notifyWarning: (message: string, options?: ToastOptions) => void;
  notifyProgress: (message: string, progress?: number) => Id;
  updateProgress: (toastId: Id, progress: number, message?: string) => void;
  closeToast: (toastId: Id) => void;
};

const ToastContext = createContext<ToastContextType>({
  notifySuccess: () => {},
  notifyError: () => {},
  notifyInfo: () => {},
  notifyWarning: () => {},
  notifyProgress: () => '',
  updateProgress: () => {},
  closeToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const notifySuccess = (message: string, options?: ToastOptions) =>
    toast.success(message, options);

  const notifyError = (message: string, options?: ToastOptions) =>
    toast.error(message, options);

  const notifyInfo = (message: string, options?: ToastOptions) =>
    toast.info(message, options);

  const notifyWarning = (message: string, options?: ToastOptions) =>
    toast.warning(message, options);

  const notifyProgress = (message: string, initialProgress: number = 0) => {
    return toast.loading(
      <div>
        <div className='mb-2'>{message}</div>
        <div className='w-full bg-gray-200 rounded-full h-2.5'>
          <div
            className='bg-blue-600 h-2.5 rounded-full transition-all duration-300'
            style={{ width: `${initialProgress}%` }}
          />
        </div>
        <div className='text-xs text-gray-500 mt-1'>{initialProgress}%</div>
      </div>,
      {
        position: 'bottom-right',
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      },
    );
  };

  const updateProgress = (toastId: Id, progress: number, message?: string) => {
    toast.update(toastId, {
      render: (
        <div>
          <div className='mb-2'>{message || 'Синхронизация...'}</div>
          <div className='w-full bg-gray-200 rounded-full h-2.5'>
            <div
              className='bg-blue-600 h-2.5 rounded-full transition-all duration-300'
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className='text-xs text-gray-500 mt-1'>{progress}%</div>
        </div>
      ),
      isLoading: progress < 100,
    });
  };

  const closeToast = (toastId: Id) => {
    toast.dismiss(toastId);
  };

  return (
    <ToastContext.Provider
      value={{
        notifySuccess,
        notifyError,
        notifyInfo,
        notifyWarning,
        notifyProgress,
        updateProgress,
        closeToast,
      }}
    >
      {children}
      <ToastContainer position='top-right' autoClose={3000} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
