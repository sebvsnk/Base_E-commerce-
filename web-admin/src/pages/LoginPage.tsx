import { getErrorMessage } from "../utils/error";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import logo from "../assets/logoPicara_minimalista.svg";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Por favor complete todos los campos");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      navigate("/admin/products");
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#ffffff' 
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '40px', 
        textAlign: 'center'
      }}>
        
        {/* Logo */}
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}>
          <img src={logo} alt="Logo" style={{ height: '100px', objectFit: 'contain' }} />
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Email Input */}
          <div style={{ position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              left: '16px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              pointerEvents: 'none' 
            }}>
              <div style={{ 
                border: '2px solid #333', 
                borderRadius: '50%', 
                width: '28px', 
                height: '28px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: '#fff'
              }}>
                <User fill="#333" size={22} style={{ transform: 'translateY(2px)' }} />
              </div>
            </div>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Ingrese su email"
              required
              style={{ 
                width: '100%', 
                padding: '16px 16px 16px 56px', 
                fontSize: '15px',
                border: '1px solid #999',
                borderRadius: '30px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              left: '16px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              pointerEvents: 'none' 
            }}>
              <Lock fill="#333" size={26} />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Ingrese su contraseña"
              required
              style={{ 
                width: '100%', 
                padding: '16px 50px 16px 56px', 
                fontSize: '15px',
                border: '1px solid #999',
                borderRadius: '30px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div 
              style={{ 
                position: 'absolute', 
                right: '16px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                cursor: 'pointer' 
              }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={22} color="#888" /> : <Eye size={22} color="#888" />}
            </div>
          </div>

          {/* Forgot Password Link */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
            <a href="#" style={{ color: '#999', textDecoration: 'none', fontSize: '14px' }}>
              Olvide mi contraseña
            </a>
          </div>

          {error && (
            <div style={{ 
              color: '#dc2626', 
              fontSize: '14px', 
              textAlign: 'center',
              padding: '10px',
              backgroundColor: '#fee2e2',
              borderRadius: '8px'
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              backgroundColor: '#d50063',
              color: 'white', 
              padding: '16px', 
              borderRadius: '30px', 
              fontSize: '17px', 
              fontWeight: '600',
              border: 'none',
              marginTop: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loading ? "Procesando..." : "Iniciar Sesión"}
          </button>

        </form>

      </div>
    </section>
  );
}
