//models/Inversion.js

class Inversion {
    constructor(nombre, montoActual, precioCompra, precioActual, fechaCompra, precioVenta, fechaVenta, categoria, subcategoria) {
      this.nombre = nombre;
      this.montoActual = montoActual; // Monto acumulado
      this.precioCompra = precioCompra;
      this.precioActual = precioActual;
      this.fechaCompra = fechaCompra;
      this.precioVenta = precioVenta;
      this.fechaVenta = fechaVenta;
      this.categoria = categoria;
      this.subcategoria = subcategoria;
    }
  }
  
  export default Inversion;