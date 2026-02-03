"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/ui/reports/analysis-beta/ui/toast"

export function Toaster() {
  const { toasts, toast } = useToast()

  // Escuchar eventos personalizados de toast desde el store
  useEffect(() => {
    const handleCustomToast = (event: CustomEvent) => {
      const { title, description, variant } = event.detail;
      toast({
        title,
        description,
        variant: variant || 'default',
      });
    };

    window.addEventListener('show-toast' as any, handleCustomToast);

    return () => {
      window.removeEventListener('show-toast' as any, handleCustomToast);
    };
  }, [toast]);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
