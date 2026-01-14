import { useState, useMemo, useEffect } from "react";
import { useCart } from "../features/cart/cart-context";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../features/auth/auth-context";
import { createAuthedOrder, createGuestOrder } from "../services/orders";
import { getErrorMessage } from "../utils/error";
import { CheckCircle } from "lucide-react";

interface City {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
  cities: City[];
}

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email.trim());
}

function validateRut(rut: string): boolean {
  if (!rut.includes("-")) return false;
  const [body, dv] = rut.split("-");
  if (!body || !dv) return false;
  
  // Clean body just in case points are present but regex below should handle strict checking if we wanted
  const cleanBody = body.replace(/\./g, "");
  if (isNaN(Number(cleanBody))) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = cleanBody.length - 1; i >= 0; i--) {
    sum += Number(cleanBody.charAt(i)) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const result = 11 - (sum % 11);
  let computedDv = result === 11 ? "0" : result === 10 ? "K" : result.toString();
  
  return computedDv.toLowerCase() === dv.toLowerCase();
}

export default function CheckoutPage() {
  const { state, totalPrice, dispatch } = useCart();
  const { isAuthed, user } = useAuth();

  const [availableRegions, setAvailableRegions] = useState<Region[]>([]);

  useEffect(() => {
    fetch("/api/locations")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAvailableRegions(data);
      })
      .catch(err => console.error("Error loading locations", err));
  }, []);

  const items = useMemo(
    () => state.items.map((i) => ({ productId: i.id, qty: i.qty })),
    [state.items]
  );
  
  // State
  const [step, setStep] = useState(1); // 1: Envío, 2: Programación, 3: Pago
  
  // Form State
  const [email, setEmail] = useState(user?.email || "");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("delivery");
  
  const [formData, setFormData] = useState({
    alias: "",
    firstName: "",
    lastName: user?.fullName?.split(" ")[0] || "",
    rut: "",
    region: "",
    city: "",
    street: "",
    extra: "",
    phone: "",
  });

  const availableCities = useMemo(() => {
    const region = availableRegions.find(r => r.name === formData.region);
    return region ? region.cities : [];
  }, [availableRegions, formData.region]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "rut") {
      // Allow only numbers and k/K
      let clean = value.replace(/[^0-9kK]/g, "");
      // Limit to 9 characters (considering the longest RUT is 8 digits + 1 check digit)
      if (clean.length > 9) clean = clean.slice(0, 9);
      
      let formatted = clean;
      if (clean.length > 1) {
        // Automatically insert hyphen before the last character
        formatted = clean.slice(0, -1) + "-" + clean.slice(-1);
      }
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === "firstName" || name === "lastName") {
      // Disallow numbers
      const textOnly = value.replace(/[0-9]/g, "");
      setFormData(prev => ({ ...prev, [name]: textOnly }));
    } else {
      setFormData(prev => {
        if (name === "region") {
          return { ...prev, [name]: value, city: "" };
        }
        return { ...prev, [name]: value };
      });
    }
  };

  const validateStep1 = () => {
    if (!isAuthed && !isValidEmail(email)) {
      alert("Ingresa un email válido");
      return false;
    }
    if (deliveryMethod === "delivery") {
       if (!formData.firstName || !formData.lastName || !formData.rut || !formData.region || !formData.city || !formData.street || !formData.phone) {
         alert("Completa todos los campos obligatorios (*)");
         return false;
       }
       if (!validateRut(formData.rut)) {
          alert("El RUT ingresado no es válido. Formato: 12345678-9");
          return false;
       }
    }
    return true;
  };

  const nextStep = () => {
     if (step === 1) {
       if (validateStep1()) setStep(2);
     } else if (step === 2) {
       setStep(3);
     }
  };

  // Final Action
  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const shippingAddress = {
        ...formData,
        rut: formData.rut.replace(/-/g, ""),
        deliveryMethod,
        email: isAuthed ? user?.email : email,
        fullPhone: `+56${formData.phone}`
      };

      let orderId;
      if (isAuthed) {
         const order = await createAuthedOrder(items, shippingAddress);
         orderId = order.id;
      } else {
         const resp = await createGuestOrder(email, items, shippingAddress);
         orderId = resp.orderId;
      }

      dispatch({ type: "CLEAR" });

      // Initiate Webpay
      const res = await fetch("/api/webpay/create", {
        method: "POST",
        headers: {
           "Content-Type": "application/json",
            ...(isAuthed ? { "Authorization": `Bearer ${localStorage.getItem("token")}` } : {})
        },
        body: JSON.stringify({ orderId })
      });

      if (!res.ok) throw new Error("Error iniciando Webpay");
      const data = await res.json();
      window.location.href = `${data.url}?token_ws=${data.token}`;

    } catch (e: unknown) {
      setError(getErrorMessage(e));
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 40 }}>
      {/* 2 Columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 30 }}>
        
        {/* Left Column: Flow */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
           {/* Step 1: Envío */}
           <div className="card simple">
             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15, cursor: 'pointer' }} onClick={() => setStep(1)}>
               <h2 style={{ fontSize: 20, margin: 0, color: "#034692" }}>Envío</h2>
               {step > 1 && <CheckCircle color="green" />}
             </div>
             
             {step === 1 && (
               <div>
                  {!isAuthed && (
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', marginBottom: 5 }}>Email de contacto *</label>
                      <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
                    </div>
                  )}

                  <p style={{ marginBottom: 10 }}>¿Cómo quieres recibir tu pedido?</p>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 20 }}>
                     <label className="card simple" style={{ cursor: "pointer", border: deliveryMethod === 'pickup' ? '2px solid #034692' : '1px solid #ddd', margin: 0, display: 'flex', gap: 10, alignItems: 'center', background: deliveryMethod === 'pickup' ? 'rgba(3, 70, 146, 0.05)' : 'white' }}>
                        <input type="radio" name="delivery" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} />
                        <div>
                          <div style={{ fontWeight: "bold" }}>Retiro en local</div>
                          <div style={{ fontSize: 13, color: "#666" }}>Gratuito</div>
                        </div>
                     </label>
                     <label className="card simple" style={{ cursor: "pointer", border: deliveryMethod === 'delivery' ? '2px solid #034692' : '1px solid #ddd', margin: 0, display: 'flex', gap: 10, alignItems: 'center', background: deliveryMethod === 'delivery' ? 'rgba(3, 70, 146, 0.05)' : 'white' }}>
                        <input type="radio" name="delivery" checked={deliveryMethod === 'delivery'} onChange={() => setDeliveryMethod('delivery')} />
                        <div>
                          <div style={{ fontWeight: "bold" }}>Despacho a domicilio</div>
                          <div style={{ fontSize: 13, color: "#666" }}>Envío programado</div>
                        </div>
                     </label>
                  </div>

                  {deliveryMethod === 'delivery' && (
                    <div className="form" style={{ maxWidth: '100%' }}>
                        <h4 style={{ margin: "20px 0 10px" }}>Nueva Dirección</h4>
                        
                        <div className="form__row">
                          <label>Nombre dirección *</label>
                          <input className="input" name="alias" value={formData.alias} onChange={handleInputChange} placeholder="Casa, trabajo, oficina, etc..." />
                        </div>
                        
                        <div className="form__row">
                           <label>Nombre *</label>
                           <input className="input" name="firstName" value={formData.firstName} onChange={handleInputChange} maxLength={25} />
                        </div>

                         <div className="form__row">
                           <label>Apellidos *</label>
                           <input className="input" name="lastName" value={formData.lastName} onChange={handleInputChange} maxLength={25} />
                        </div>

                        <div className="form__row">
                           <label>RUT *</label>
                           <input className="input" name="rut" value={formData.rut} onChange={handleInputChange} placeholder="12345678-9" maxLength={10} />
                           <small style={{ color: "#888" }}>Formato: sin puntos, con guion y dígito verificador. Ej: 12345678-9</small>
                        </div>
                        
                        <div className="form__row">
                           <label>Región *</label>
                           <select className="input" name="region" value={formData.region} onChange={handleInputChange}>
                              <option value="">Seleccione Región</option>
                              {availableRegions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                           </select>
                        </div>
                        
                        <div className="form__row">
                           <label>Comuna *</label>
                            <select className="input" name="city" value={formData.city} onChange={handleInputChange} disabled={!formData.region}>
                              <option value="">Seleccione Comuna</option>
                              {availableCities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                           </select>
                        </div>

                        <div className="form__row">
                          <label>Dirección *</label>
                          <input className="input" name="street" value={formData.street} onChange={handleInputChange} placeholder="Av. la Florida 123..." />
                        </div>

                        <div className="form__row">
                           <label>Campo extra para la referencia</label>
                           <input className="input" name="extra" value={formData.extra} onChange={handleInputChange} placeholder="Portón azul, esquina..." />
                        </div>
                        
                        <div className="form__row">
                           <label>Teléfono *</label>
                           <div style={{ display: "flex", gap: 10 }}>
                             <div className="input" style={{ width: 60, textAlign: 'center', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+56</div>
                             <input className="input" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="912345678" style={{ flex: 1 }} type="tel" maxLength={9} />
                           </div>
                           <small style={{ color: '#888' }}>Por favor, introduce un número de teléfono válido</small>
                        </div>

                    </div>
                  )}
                  
                  <div style={{ marginTop: 20, textAlign: 'right' }}>
                     <button className="btn btn--primary" style={{ background: "#d6001c", color: "white", padding: "12px 24px", width: "100%", fontWeight: "bold", fontSize: 16 }} onClick={nextStep}>
                        Siguiente: ir a programación de envíos
                     </button>
                  </div>
               </div>
             )}
           </div>

           {/* Step 2: Programación (Placeholder) */}
           <div className="card simple" style={{ opacity: step < 2 ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <h2 style={{ fontSize: 20, margin: 0, color: step === 2 ? "#034692" : "#888" }}>Programación de envíos</h2>
                  {step > 2 && <CheckCircle color="green" />}
              </div>
              {step === 2 && (
                 <div style={{ marginTop: 20 }}>
                    <p style={{ marginBottom: 15 }}>Selecciona un método para recibir tu pedido.</p>
                    {/* Mock scheduling */}
                    <div style={{ background: '#f9f9f9', padding: 15, borderRadius: 8, border: '1px solid #eee' }}>
                        📅 Entrega estimada: <strong>Mañana, 15 de Enero</strong>
                    </div>
                    <button className="btn btn--primary" style={{ marginTop: 20, width: "100%", fontWeight: 'bold' }} onClick={nextStep}>Continuar para el Pago</button>
                 </div>
              )}
           </div>

           {/* Step 3: Pago */}
            <div className="card simple" style={{ opacity: step < 3 ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <h2 style={{ fontSize: 20, margin: 0, color: step === 3 ? "#034692" : "#888" }}>Pago</h2>
              </div>
              {step === 3 && (
                 <div style={{ marginTop: 20 }}>
                    <p>Serás redirigido a Webpay para completar tu pago de forma segura.</p>
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    <button className="btn btn--primary" style={{ background: "#d6001c", color: "white", width: "100%", padding: 14, fontSize: 16 }} onClick={handlePayment} disabled={loading}>
                       {loading ? "Procesando..." : "Pagar con Webpay"}
                    </button>
                 </div>
              )}
           </div>

        </div>

        {/* Right Column: Summary */}
        <div className="checkout-summary">
           <div className="card simple" style={{ position: "sticky", top: 20, background: '#f5f5f5', border: 'none' }}>
              <h3 style={{ marginTop: 0, borderBottom: '1px dashed #ccc', paddingBottom: 10, textAlign: 'center' }}>Resumen del pedido</h3>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, marginTop: 20 }}>
                 <span className="muted">Subtotal</span>
                 <strong className="muted" style={{ fontWeight: 400 }}>{formatCurrency(totalPrice)}</strong>
              </div>
              {/* Shipping cost logic could be added here */}
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, marginTop: 15, alignItems: 'flex-end' }}>
                 <span style={{ fontWeight: "bold" }}>Total</span>
                 <strong style={{ fontWeight: "bold" }}>{formatCurrency(totalPrice)}</strong>
              </div>
              
              <p className="muted" style={{ fontSize: 11, marginTop: 10, marginBottom: 20 }}>
                * Impuestos incluidos dentro del precio final
              </p>
              
              <div style={{ marginTop: 20, maxHeight: 300, overflowY: 'auto' }}>
                  {state.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: 10, marginBottom: 10, background: 'white', padding: 10, borderRadius: 8 }}>
                       <img src={item.image} alt={item.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                       <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>Cant: {item.qty}</div>
                       </div>
                       <div style={{ fontSize: 13 }}>{formatCurrency(item.price * item.qty)}</div>
                    </div>
                  ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
