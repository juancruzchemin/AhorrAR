import React from 'react';
import '../styles/Modal-Edit.css';

const ModalEdit = ({ children, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

export default ModalEdit;