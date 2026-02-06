import React, { createContext, useCallback, useContext, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';

type ToastType = 'error' | 'success' | 'info';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<ToastType>('error');

  const showToast = useCallback((msg: string, t: ToastType = 'error') => {
    setMessage(msg);
    setType(t);
    const timer = setTimeout(() => {
      setMessage(null);
      clearTimeout(timer);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message != null && (
        <View style={[styles.toast, type === 'error' && styles.toastError, type === 'success' && styles.toastSuccess]}>
          <Text style={styles.toastText} numberOfLines={3}>
            {message}
          </Text>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'web' ? 24 : 80,
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.3)' } as any,
      default: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
    }),
  },
  toastError: {
    backgroundColor: '#b91c1c',
  },
  toastSuccess: {
    backgroundColor: '#15803d',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
  },
});
