import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginInputField } from '../components/LoginInputField';
import { LoginLoader } from '../components/LoginLoader';
import { LoginRoleSelect } from '../components/LoginRoleSelect';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  KeyRound,
  Network,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

const featureItems = [
  { icon: ShieldCheck, text: 'Secure member access' },
  { icon: UsersRound, text: 'Two-account access model' },
  { icon: BadgeCheck, text: 'Professional workspace' },
];

export const Login = () => {
  const { requestOtp, verifyOtp } = useAuth();
  const [form, setForm] = useState({
    role: 'USER',
    username: '',
    password: '',
    remember: true,
  });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [authEmployeeId, setAuthEmployeeId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const errors = useMemo(() => ({
    username:
      form.username.trim().length === 0
        ? 'Username is required.'
        : form.username.trim().length < 3
          ? 'Use at least 3 characters.'
          : '',
    password:
      form.password.length === 0
        ? 'Password is required.'
        : form.password.length < 6
          ? 'Password must be at least 6 characters.'
          : '',
    otp:
      otp.length === 0
        ? 'Verification code is required.'
        : otp.length < 6
          ? 'Enter the 6-digit code.'
          : '',
  }), [form.password, form.username, otp]);

  const updateField = (field) => (event) => {
    const value = field === 'remember' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setErrorMessage('');
  };

  const markTouched = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleCredentials = async (event) => {
    event.preventDefault();
    setTouched({ username: true, password: true });

    if (errors.username || errors.password) return;

    setLoading(true);
    setErrorMessage('');

    const result = await requestOtp(form.username.trim(), form.password);

    if (result.success) {
      if (result.otp) setOtpHint(result.otp);
      setAuthEmployeeId(result.employeeId || form.username.trim());
      setStep(2);
    } else {
      setErrorMessage(result.message);
    }

    setLoading(false);
  };

  const handleVerification = async (event) => {
    event.preventDefault();
    setTouched((current) => ({ ...current, otp: true }));

    if (errors.otp) return;

    setLoading(true);
    setErrorMessage('');

    const result = await verifyOtp(authEmployeeId || form.username.trim(), otp, form.role);

    if (!result.success) {
      setErrorMessage(result.message);
    }

    setLoading(false);
  };

  const resetToCredentials = () => {
    setStep(1);
    setOtp('');
    setErrorMessage('');
    setTouched((current) => ({ ...current, otp: false }));
  };

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#f7f4ec] px-5 py-6 text-black sm:px-8 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.95),transparent_34%),linear-gradient(rgba(45,40,32,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(45,40,32,0.045)_1px,transparent_1px)] bg-[size:100%_100%,54px_54px,54px_54px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-black/15" />
      <div className="absolute bottom-0 left-0 right-0 h-52 bg-[linear-gradient(to_top,#fffdf8,rgba(255,253,248,0))]" />

      <section className="relative z-10 m-auto grid w-full max-w-6xl items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
        <div className="max-w-xl">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-black/10 bg-[#fffdf8]/90 px-4 py-2 text-sm font-medium text-zinc-700 shadow-[0_18px_48px_rgba(62,52,38,0.12)] backdrop-blur">
            <Network size={18} className="text-black" />
            Global Success Network
          </div>

          <h1 className="text-6xl font-semibold leading-[0.96] tracking-normal text-black sm:text-7xl">
            GSN
          </h1>
          <p className="mt-5 text-2xl font-medium text-zinc-800">
            Connect. Collaborate. Grow.
          </p>
          <p className="mt-5 max-w-lg text-base leading-7 text-zinc-600">
            A focused member gateway for trusted teams, with access reduced to two clean roles: admin and user.
          </p>

          <div className="mt-8 grid gap-4 text-sm text-zinc-700 sm:grid-cols-3 lg:grid-cols-1">
            {featureItems.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-black/10 bg-[#fffdf8] text-black shadow-sm">
                  <Icon size={18} />
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={step === 1 ? handleCredentials : handleVerification}
          className="glass-panel w-full rounded-[2rem] p-6 sm:p-8"
        >
          <div className="mb-8 text-center lg:text-left">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-black text-white shadow-[0_16px_36px_rgba(0,0,0,0.18)] lg:mx-0">
              <BriefcaseBusiness size={24} />
            </div>
            <h2 className="text-3xl font-semibold tracking-normal">
              {step === 1 ? 'Welcome back' : 'Verify access'}
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              {step === 1 ? 'Sign in to your GSN workspace.' : 'Enter the secure code to continue.'}
            </p>
          </div>

          <div className="space-y-5">
            {step === 1 ? (
              <>
                <LoginInputField
                  id="username"
                  label="Username"
                  value={form.username}
                  error={touched.username ? errors.username : ''}
                  onChange={updateField('username')}
                  onBlur={() => markTouched('username')}
                  autoComplete="username"
                />

                <LoginInputField
                  id="password"
                  label="Password"
                  value={form.password}
                  error={touched.password ? errors.password : ''}
                  onChange={updateField('password')}
                  onBlur={() => markTouched('password')}
                  autoComplete="current-password"
                  showToggle
                  isVisible={showPassword}
                  onToggle={() => setShowPassword((current) => !current)}
                />

                <LoginRoleSelect
                  value={form.role}
                  onChange={updateField('role')}
                />

                <div className="flex items-center justify-between gap-4 text-sm">
                  <label className="flex cursor-pointer items-center gap-3 text-zinc-700">
                    <input
                      type="checkbox"
                      checked={form.remember}
                      onChange={updateField('remember')}
                      className="h-4 w-4 rounded border-black/20 bg-white text-black accent-black"
                    />
                    Remember me
                  </label>
                  <span className="inline-flex items-center gap-2 text-zinc-500">
                    <KeyRound size={14} />
                    Secure access
                  </span>
                </div>
              </>
            ) : (
              <>
                {otpHint && (
                  <div className="rounded-xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                    Dev Mode OTP: {otpHint}
                  </div>
                )}

                <LoginInputField
                  id="otp"
                  label="Verification code"
                  value={otp}
                  error={touched.otp ? errors.otp : ''}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
                    setErrorMessage('');
                  }}
                  onBlur={() => markTouched('otp')}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                />
              </>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-black text-sm font-bold text-white shadow-[0_26px_80px_rgba(62,52,38,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-[0_16px_36px_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? (
                <LoginLoader />
              ) : (
                <>
                  {step === 1 ? 'Login to GSN' : 'Verify and enter'}
                  <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                </>
              )}
            </button>

            {step === 2 && (
              <button
                type="button"
                onClick={resetToCredentials}
                className="inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-black"
              >
                <ArrowLeft size={16} />
                Back to credentials
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
};
