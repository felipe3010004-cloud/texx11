import React, { useState } from "react";
import { authController } from "../controllers/authController";
import { User, Lock, Eye, EyeOff, Shield, ArrowRight, X, Loader2, Phone, Mail, FileText, CheckCircle2 } from "lucide-react";

interface LoginModalViewProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, role: string, status?: string) => void;
}

export const LoginModalView: React.FC<LoginModalViewProps> = ({
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
  const [registrationSuccessMsg, setRegistrationSuccessMsg] = useState("");

  // Registration specific fields
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [countryCode, setCountryCode] = useState("591");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setRegistrationSuccessMsg("");

    setLoading(true);

    try {
      if (isRegisterMode) {
        if (!fullName.trim() || fullName.trim().length < 3) {
          throw new Error("Por favor introduce tu nombre y apellidos completos.");
        }
        if (!regEmail.trim() || !regEmail.includes("@")) {
          throw new Error("Por favor introduce un correo electrónico válido.");
        }
        if (!regPhone.trim() || regPhone.replace(/\D/g, "").length < 7) {
          throw new Error("Por favor introduce un número de celular o WhatsApp válido.");
        }
        if (password.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }
        if (password !== confirmPassword) {
          throw new Error("Las contraseñas no coinciden. Por favor verifícalas.");
        }
        if (!termsAccepted) {
          throw new Error("Debes aceptar los Términos y Condiciones Comerciales de Team Life.");
        }

        const { user, role, status } = await authController.register({
          fullName,
          email: regEmail,
          phone: regPhone,
          countryCode,
          pass: password,
          termsAccepted,
        });

        setRegistrationSuccessMsg(
          "¡Registro enviado con éxito! Tu cuenta ha sido creada en estado PENDIENTE de revisión por el Superadministrador. Podrás acceder pero tus enlaces de comisiones se activarán una vez autorizado."
        );
        setTimeout(() => {
          onLoginSuccess(user, role, status);
          onClose();
        }, 2200);
      } else {
        if (!identifier.trim() || !password) {
          throw new Error("Por favor completa tu usuario/celular y contraseña.");
        }
        const { user, role, status } = await authController.login(identifier, password);
        onLoginSuccess(user, role, status);
        onClose();
      }
    } catch (err: any) {
      const code = err.code || "";
      const msg = err.message || "";
      if (code === "auth/invalid-credential" || msg.includes("invalid-credential")) {
        setErrorMessage(
          "Credenciales inválidas: El correo o la contraseña son incorrectos. Verifica que no haya espacios al inicio o final. Si el correo fue registrado sin arroba, utiliza tu número de celular registrado."
        );
      } else if (code === "auth/user-not-found") {
        setErrorMessage("No existe ninguna cuenta registrada con este correo en Firebase.");
      } else if (code === "auth/wrong-password") {
        setErrorMessage("La contraseña ingresada es incorrecta.");
      } else if (code === "auth/email-already-in-use") {
        setErrorMessage("Este correo ya se encuentra registrado. Inicia sesión o utiliza otro correo.");
      } else if (code === "auth/user-disabled") {
        setErrorMessage("Esta cuenta ha sido inhabilitada en Firebase Authentication.");
      } else if (code === "auth/too-many-requests") {
        setErrorMessage("Demasiados intentos fallidos consecutivos. Por seguridad, espera unos minutos antes de volver a intentar.");
      } else if (code === "auth/network-request-failed") {
        setErrorMessage("Error de conexión con los servidores de Firebase. Verifica tu acceso a internet.");
      } else {
        setErrorMessage(msg || "Error al autenticar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#082836]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg my-6 p-6 sm:p-8 rounded-3xl bg-white border border-[#c8e4ed] shadow-2xl text-[#082836] space-y-4 animate-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c8e4ed]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-[#082836]">
                {isRegisterMode ? "Registro de Distribuidor / Miembro" : "Acceso a la Plataforma"}
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Team Life Company S.R.L. · Bolivia</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cyan-50 hover:bg-cyan-100 text-slate-500 hover:text-[#082836] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed">
            {errorMessage}
          </div>
        )}

        {registrationSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{registrationSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          {isRegisterMode ? (
            <>
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre y Apellidos Completos *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Valeria Roca Morales"
                    className="w-full pl-10 pr-4 py-2.5 bg-cyan-50/40 border border-[#c8e4ed] rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico Oficial *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="distribuidor@teamlife.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-cyan-50/40 border border-[#c8e4ed] rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* International Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Celular / WhatsApp (con código de país) *
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-28 px-2.5 py-2.5 bg-cyan-50/40 border border-[#c8e4ed] rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-cyan-600"
                  >
                    <option value="591">🇧🇴 +591</option>
                    <option value="54">🇦🇷 +54</option>
                    <option value="55">🇧🇷 +55</option>
                    <option value="56">🇨🇱 +56</option>
                    <option value="57">🇨🇴 +57</option>
                    <option value="51">🇵🇪 +51</option>
                    <option value="1">🇺🇸 +1</option>
                    <option value="34">🇪🇸 +34</option>
                  </select>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="71234567"
                      className="w-full pl-10 pr-4 py-2.5 bg-cyan-50/40 border border-[#c8e4ed] rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  En este número recibirás los pedidos y consultas de tus clientes vía WhatsApp individual.
                </span>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-8 py-2.5 bg-cyan-50/40 border border-[#c8e4ed] rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Repetir Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la clave"
                      className="w-full pl-10 pr-8 py-2.5 bg-cyan-50/40 border border-[#c8e4ed] rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-100 space-y-2">
                <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-700 leading-tight">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span>
                    He leído y acepto los <strong>Términos y Condiciones Comerciales</strong>, política de comisiones sin candados y código de ética de Team Life Company S.R.L.
                  </span>
                </label>
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-800">
                  <FileText className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                  <span>Tu solicitud pasará al Superadministrador en estado <strong>Pendiente</strong> para su validación oficial.</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-cyan-50/40 border border-[#c8e4ed] rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                    className="w-full pl-10 pr-10 py-2.5 bg-cyan-50/40 border border-[#c8e4ed] rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-[#0284c7] hover:from-cyan-700 hover:to-[#0369a1] text-white font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegisterMode ? "Enviar Solicitud de Registro" : "Ingresar a mi Cuenta"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 pb-1">
          {isRegisterMode ? (
            <>
              ¿Ya tienes cuenta registrada?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setErrorMessage("");
                }}
                className="text-cyan-700 font-bold hover:underline cursor-pointer"
              >
                Iniciar Sesión
              </button>
            </>
          ) : (
            <>
              ¿Quieres unirte como distribuidor oficial?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMessage("");
                }}
                className="text-cyan-700 font-bold hover:underline cursor-pointer"
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
