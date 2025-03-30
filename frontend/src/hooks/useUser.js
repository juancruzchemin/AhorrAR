// hooks/useUser.js
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';

const useUser = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // 1. Intentar obtener datos del token
          const decoded = jwtDecode(token);
          
          // 2. Intentar obtener datos adicionales de localStorage
          const userData = localStorage.getItem('userData');
          const fullUserData = userData 
            ? JSON.parse(userData)
            : { _id: decoded.id }; // Usar datos mínimos del token
          
          setUser(fullUserData);
        } catch (error) {
          console.error('Error loading user:', error);
          setUser(null);
        }
      }
    };

    loadUser();

    // Escuchar cambios en el localStorage
    const handleStorageChange = () => loadUser();
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { user };
};

export default useUser;