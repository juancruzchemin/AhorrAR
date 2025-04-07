import React from 'react';
import styles from '../../styles/ErrorModal.css'; // Asegúrate de que la ruta sea correcta

const ErrorModal = ({
  isOpen,
  title = 'Error',
  message = 'Ocurrió un error',
  confirmText = 'Aceptar',
  onConfirm,
  isCritical = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="modalOverlay">
      <div className="modalContainer">
        <div className="modalHeader">
          <h3>{title}</h3>
        </div>
        <div className="modalBody">
          <p>{message}</p>
        </div>
        <div className="modalFooter" >
          <button
            onClick={() => {
              onConfirm?.();
            }}
            className="modalConfirmBtn"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;