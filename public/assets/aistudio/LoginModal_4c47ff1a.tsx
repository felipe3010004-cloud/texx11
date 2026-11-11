import React, { useState } from "react";
import { auth, db, firebase } from "../lib/firebase";
import { User, Lock, Eye, EyeOff, Shield, ArrowRight, X, Loader2, Sparkles } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, role: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const normalizeEmail = (raw: string) => {
    const clean = raw.trim();
    if (clean.includes("@")) return clean.toLowerCase();
    const digits = clean.replace(/\D/g, "");
    return digits ? `${digits}@gmail.com` : "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!identifier.trim() || !password) {
      setErrorMessage("Por favor completa tu usuario/celular y contraseña.");
      return;
    }

    const email = normalizeEmail(identifier);
    if (!email) {
      setErrorMessage("Por favor introduce un correo o celular válido.");
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        if (password.length < 6) {
          setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
          setLoading(false);
          return;
        }

        const cred = await auth.createUserWithEmailAndPassword(email, password);
        const user = cred.user!;
        await db.collection("users").doc(user.uid).set({
          phone: identifier.includes("@") ? "" : identifier.replace(/\D/g, ""),
          email,
          role: "vendedor",
          clics: 0,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        onLoginSuccess(user, "vendedor");
        onClose();
      } else {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        const user = cred.user!;
        let role = "vendedor";

        try {
          const doc = await db.collection("users").doc(user.uid).get();
          if (doc.exists) {
            role = doc.data()?.role || "vendedor";
          }
        } catch (fErr) {
          console.warn("Firestore lookup:", fErr);
        }

        onLoginSuccess(user, role);
        onClose();
      }
    } catch (err: any) {
      console.warn("Auth error:", err.code, err.message);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setErrorMessage("Credenciales no encontradas. Puedes crear tu cuenta o ingresar mediante el Acceso Rápido Demo.");
      } else if (err.code === "auth/email-already-in-use") {
        setErrorMessage("Esta cuenta ya está registrada. Intenta iniciar sesión con tu contraseña.");
      } else {
        setErrorMessage(err.message || "Error al autenticar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#110724] border border-purple-500/40 shadow-2xl text-white space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-amber-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white">
                {isRegisterMode ? "Registro de Distribuidor" : "Acceso a la Plataforma"}
              </h3>
              <span className="text-[11px] text-slate-400">Team Life Oficial</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Celular o Correo Electrónico
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ej. 71234567 o distribuidor@teamlife.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña secreta"
                className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegisterMode ? "Crear Cuenta de Vendedor" : "Ingresar a mi Cuenta"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch Register/Login */}
        <div className="text-center text-xs text-slate-400 pt-2 pb-1">
          {isRegisterMode ? (
            <>
              ¿Ya tienes cuenta registrada?{" "}
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                className="text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Iniciar Sesión
              </button>
            </>
          ) : (
            <>
              ¿Quieres unirte como distribuidor?{" "}
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                className="text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Registrarme aquí
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
