// src/utils/modalUtils.js
let modalCallback = null;

export const setupModalHandler = (callback) => {
  modalCallback = callback;
};

export const showSessionExpiredModal = () => {
  if (modalCallback) {
    modalCallback({
      title: 'Sesión Expirada',
      message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
      onConfirm: () => {
        localStorage.removeItem('token');
      },
      confirmText: 'Ir a Login'
    });
  } else {
    // Fallback si el modal no está configurado
    if (window.confirm('Tu sesión ha expirado. ¿Deseas ir a la página de login?')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }
};