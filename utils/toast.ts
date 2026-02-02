// Singleton pattern for toast that can be called from anywhere
// This is a fallback if ToastProvider is not available in the component tree

let toastInstance: ((message: string, type?: 'success' | 'error' | 'info') => void) | null = null;

export function setToastInstance(instance: (message: string, type?: 'success' | 'error' | 'info') => void) {
  toastInstance = instance;
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (toastInstance) {
    toastInstance(message, type);
  } else {
    // Fallback to console if toast is not initialized
    console.log(`[Toast ${type.toUpperCase()}]: ${message}`);
  }
}
