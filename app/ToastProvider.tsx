"use client";

import { ToastContainer, toast, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createContext, useContext } from "react";

type ToastContextType = {
  notifySuccess: (message: string, options?: ToastOptions) => void;
  notifyError: (message: string, options?: ToastOptions) => void;
  notifyInfo: (message: string, options?: ToastOptions) => void;
  notifyWarning: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextType>({
  notifySuccess: () => {},
  notifyError: () => {},
  notifyInfo: () => {},
  notifyWarning: () => {},
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

  return (
    <ToastContext.Provider
      value={{ notifySuccess, notifyError, notifyInfo, notifyWarning }}
    >
      {children}
      <ToastContainer position="top-right" autoClose={3000} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
