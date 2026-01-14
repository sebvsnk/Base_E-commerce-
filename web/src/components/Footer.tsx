import { MapPin } from "lucide-react";
import logo from "../assets/logoPicara.svg";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        {/* Column 1: Localiza tu tienda */}
        <div className="footer-col">
          <h3 className="footer-heading">
            <MapPin size={20} className="footer-icon" />
            Localiza tu tienda
          </h3>
          <p className="footer-text">
            Somos un emprendimiento 100% chileno, con tiendas físicas en Santiago. ¡Visítanos y conoce más sobre nosotros!
          </p>
        </div>

        {/* Column 2: Mi cuenta */}
        <div className="footer-col">
          <h3 className="footer-heading">Mi cuenta</h3>
          <ul className="footer-links">
            <li><a href="#">Entrar en mi cuenta</a></li>
            <li><a href="#">Mis pedidos</a></li>
          </ul>
        </div>

        {/* Column 3: Guía de Compra */}
        <div className="footer-col">
          <h3 className="footer-heading">Guía de Compra</h3>
          <ul className="footer-links">
            <li><a href="#">Info de Envío</a></li>
            <li><a href="#">Preguntas Frecuentes</a></li>
            <li><a href="#">Términos y condiciones</a></li>
            <li><a href="#">Bases de concursos</a></li>
            <li><a href="#">Ganadores sorteos</a></li>
          </ul>
        </div>

        {/* Column 4: Contacto */}
        <div className="footer-col">
          <h3 className="footer-heading">Contacto</h3>
          <ul className="footer-links contact-list">
            <li>Mail: ventas@picara.cl</li>
            <li>WhatsApp: +56 9 3380 4472</li>
            <li>Servicio de atención:</li>
            <li className="bullet-item">Lunes a Domingo 9:00 a 20:00.</li>
          </ul>
        </div>

        {/* Column 5: SuperZoo */}
        <div className="footer-col">
          
          <ul className="footer-links">
            <li><a href="#">Acerca de Picara</a></li>

          </ul>
          
        </div>
        <img src={logo} alt="Logo Picara" className="footer-logo" style={{ maxWidth: "200px", height: "auto" }} />
      </div>
    </footer>
  );
}
