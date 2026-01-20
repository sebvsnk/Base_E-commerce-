import { getErrorMessage } from "../utils/error";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import { User, Lock, Eye, EyeOff, Check, Circle } from "lucide-react";
import logo from "../assets/logoPicara_minimalista.svg";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper for formatting phone with unerasable +56 prefix and spaces
  // Stored state: only digits (after +56). 
  // Wait, if we use state as just digits, validation and submit is easier.
  // Visual: "+56 " + digits
  
  // Actually, to make "+56" part of the input but unerasable, we can just prepend it
  // on every change if it's missing, but better is to put it outside the input box visually.
  
  // User asked: 'El "+56 no se podra borrar"' and 'El numero se vera asi: +56 X XXXX XXXX'
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Strip everything that is not a digit
    const rawDigits = e.target.value.replace(/\D/g, "");
    
    // 2. Limit to 9 digits maximum
    const digits = rawDigits.slice(0, 9);
    
    // 3. Set state to just digits for cleaner storage/logic (or maybe formatted?)
    //    Actually, reusing `phone` properly for display vs internal value
    //    Here we will store the raw digits in state, but format the input's VALUE
    setPhone(digits);
  };

  // Helper to format the digits like "X XXXX XXXX"
  const getFormattedPhone = (digits: string) => {
    if (!digits) return "";
    // 9 1234 5678
    // Char 0   -> 1st block
    // Char 1-4 -> 2nd block
    // Char 5-8 -> 3rd block
    
    const part1 = digits.slice(0, 1);
    const part2 = digits.slice(1, 5);
    const part3 = digits.slice(5, 9);

    if (digits.length <= 1) return part1;
    if (digits.length <= 5) return `${part1} ${part2}`;
    return `${part1} ${part2} ${part3}`;
  };



  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email inválido");
      return;
    }
    
    // Password Validation: Min 8 chars, 1 uppercase, 1 number
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("La contraseña debe tener al menos una mayúscula");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("La contraseña debe tener al menos un número");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setError("Nombre es requerido");
        return;
      }
      if (!lastName.trim()) {
         setError("Apellido es requerido");
         return;
      }
      
      // Phone validation
      if (phone.length !== 9) {
        setError("El teléfono debe tener 9 dígitos (ej: 912345678)");
        return;
      }
    }

    try {
      setLoading(true);
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        // Send +56 prefix
        const fullPhone = "+56" + phone;
        await register(email.trim(), password, name.trim(), lastName.trim(), fullPhone);
      }
      // Redirect to the page they were on before, or home
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '70vh', 
      backgroundColor: 'var(--bg-body)' 
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '500px', 
        padding: '40px', 
        border: '1px solid #ccc',
        backgroundColor: 'var(--bg-card, #fff)',
        textAlign: 'center',
        borderRadius: '20px'
      }}>
        
        {/* Logo */}
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
          <img src={logo} alt="Logo" style={{ height: '80px', objectFit: 'contain' }} />
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {mode === "register" && (
            <>
              {/* Name */}
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value.replace(/[0-9]/g, "").toUpperCase())} 
                  placeholder="Nombre"
                  maxLength={25}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    fontSize: '16px',
                    border: '1px solid #888',
                    borderRadius: '10px'
                }}
                />
              </div>

              {/* Last Name */}
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value.replace(/[0-9]/g, "").toUpperCase())} 
                  placeholder="Apellido"
                  maxLength={25}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    fontSize: '16px',
                    border: '1px solid #888',
                    borderRadius: '10px'
                }}
                />
              </div>

               {/* Phone */}
               <div style={{ position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '1px', 
                    top: '1px', 
                    bottom: '1px',
                    width: '45px',
                    backgroundColor: '#eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRight: '1px solid #888',
                    borderRadius: '9px 0 0 9px',
                    color: '#000',
                    fontSize: '16px',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                    +56
                  </div>
                <input 
                  type="text" 
                  value={getFormattedPhone(phone)} 
                  onChange={handlePhoneChange} 
                  placeholder="9 1234 5678"
                  style={{ 
                    width: '100%', 
                    padding: '12px 12px 12px 58px', // Space for +56
                    fontSize: '16px',
                    border: '1px solid #888',
                    borderRadius: '10px'
                }}
                />
              </div>


            </>
          )}

          {/* Email Input */}
          <div style={{ position: 'relative' }}>
            {mode === 'login' && (
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <div style={{ 
                  border: '2px solid #000', 
                  borderRadius: '50%', 
                  width: '26px', 
                  height: '26px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <User fill="#000" size={24} style={{ transform: 'translateY(2px)' }} />
                </div>
              </div>
            )}
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Ingrese su email"
              style={{ 
                width: '100%', 
                padding: mode === 'login' ? '12px 12px 12px 50px' : '12px', 
                fontSize: '16px',
                border: '1px solid #666',
                borderRadius: '10px'
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ position: 'relative' }}>
            {mode === 'login' && (
             <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Lock fill="#000" size={24} />
             </div>
            )}
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Ingrese su contraseña"
              style={{ 
                width: '100%', 
                padding: mode === 'login' ? '12px 40px 12px 50px' : '12px 40px 12px 12px', 
                fontSize: '16px',
                border: '1px solid #666',
                borderRadius: '10px'
              }}
            />
            <div 
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                cursor: 'pointer' 
              }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} color="#888" /> : <Eye size={20} color="#888" />}
            </div>
          </div>
          
          {/* Password Checklist */}
          {mode === 'register' && (
            <div style={{ marginTop: '10px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: password.length >= 8 ? 'green' : '#888' }}>
                  {password.length >= 8 ? <Check size={16} /> : <Circle size={12} fill={password.length >= 8 ? "green" : "#888"} />}
                  Mínimo 8 caracteres
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: /[A-Z]/.test(password) ? 'green' : '#888' }}>
                  {/[A-Z]/.test(password) ? <Check size={16} /> : <Circle size={12} fill={/[A-Z]/.test(password) ? "green" : "#888"} />}
                  Al menos una mayúscula
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: /[0-9]/.test(password) ? 'green' : '#888' }}>
                  {/[0-9]/.test(password) ? <Check size={16} /> : <Circle size={12} fill={/[0-9]/.test(password) ? "green" : "#888"} />}
                  Al menos un número
               </div>
            </div>
          )}

          {/* Forgot Password Link */}
           {mode === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-10px' }}>
                <a href="#" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>
                   Olvide mi contraseña
                </a>
              </div>
           )}

          {error && (
            <div style={{ color: 'red', fontSize: '14px', textAlign: 'left' }}>
              Error: {error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
            style={{ 
              backgroundColor: '#d50063', // Approximate pink color from image
              color: 'white', 
              padding: '12px', 
              borderRadius: '25px', 
              fontSize: '18px', 
              fontWeight: 'bold',
              border: 'none',
              marginTop: '10px',
              cursor: 'pointer'
            }}
          >
             {loading ? "Procesando..." : mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </button>

        </form>

        {/* Toggle Mode */}
        <div style={{ marginTop: '25px', color: '#888', fontSize: '16px' }}>
          <span 
             style={{ cursor: 'pointer' }}
             onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
             {mode === 'login' ? "¿Nuevo Cliente? Crear Cuenta" : "¿Ya tienes cuenta? Iniciar Sesión"}
          </span>
        </div>

      </div>
    </section>
  );
}
