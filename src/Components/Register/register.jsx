import React, { useState } from "react";
import "./register.css";
import "./login-redesign.css";
import api from "../../services/api";

import {
  FaApple,
  FaArrowLeft,
  FaArrowRight,
  FaBroadcastTower,
  FaChartLine,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
  FaHeadphones,
  FaLock,
  FaQuestionCircle,
  FaUser,
  FaUsers,
} from "react-icons/fa";

import { FcGoogle } from "react-icons/fc";
import EchooLogoImage from "../Assets/Echoo_logo.jpeg";

import LoadingButton from "../UI/LoadingButton";
import SuccessState from "../UI/SuccessState";
import StepProgress from "../UI/StepProgress";
import Toast from "../UI/Toast";

import "../../styles/echoo-onboarding.css";
import EchoAmbient from "../EchooSystem/EchoAmbient";

const waveformBars = [
  9, 16, 23, 12, 28, 18, 32, 14, 26, 20, 35, 17, 29, 13,
  24, 19, 31, 15, 27, 11, 22, 16, 30, 18, 25, 13, 21, 16,
  28, 14, 23, 18, 32, 12, 26, 16, 29, 14, 20, 17, 25, 12,
  22, 15, 28, 17, 24, 13, 19, 16, 26, 14, 21, 18, 29, 13,
  24, 16, 20, 11,
];

const LoginBrand = ({ mobile = false }) => (
  <div
    className={
      mobile
        ? "echoo-login-mobile-brand"
        : "echoo-login-brand"
    }
  >
    <img
      src={EchooLogoImage}
      alt="Echoo"
      className="echoo-login-brand-mark"
    />

    <div className="echoo-login-brand-copy">
      <span className="echoo-login-brand-name">Echoo</span>
      <span className="echoo-login-brand-subtitle">
        Live Audio Platform
      </span>
    </div>
  </div>
);

const LoginLiveCard = () => (
  <div className="echoo-login-live-card" aria-hidden="true">
    <div className="echoo-login-artwork">
      <span className="echoo-login-artwork-title">
        SUNSET
        <br />
        SESSIONS
      </span>
      <span className="echoo-login-artwork-volume">VOL. 7</span>
    </div>

    <div className="echoo-login-live-card-body">
      <div className="echoo-login-live-meta">
        <span className="echoo-login-live-badge">
          <span className="echoo-login-live-dot" />
          LIVE
        </span>

        <span className="echoo-login-listeners">
          <FaUsers />
          <strong>1,284</strong>
          listening
        </span>
      </div>

      <h2>Sunset Sessions Vol. 7</h2>
      <p>with Joseph Okunlola</p>

      <div className="echoo-login-waveform">
        {waveformBars.map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="echoo-login-wave-bar"
            style={{ height: `${height}px` }}
          />
        ))}
      </div>

      <div className="echoo-login-live-tags">
        <span className="echoo-login-live-tag">
          <FaHeadphones />
          Chill / Downtempo
        </span>
        <span className="echoo-login-live-tag">
          <FaUsers />
          1.2K Followers
        </span>
      </div>
    </div>
  </div>
);

const Register = ({
  onAccountCreated,
  onLoginSuccess,
}) => {
  const [action, setAction] = useState("Login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginNotice, setLoginNotice] = useState("");

  const [successState, setSuccessState] = useState(null);
  const [successUser, setSuccessUser] = useState(null);

  const [toast, setToast] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    if (action === "Login") {
      setLoginError("");
      setLoginNotice("");
    }
  };

  const formIsComplete = () => {
    if (action === "Sign Up") {
      return (
        formData.fullname.trim() !== "" &&
        formData.username.trim() !== "" &&
        formData.email.trim() !== "" &&
        formData.password.trim() !== ""
      );
    }

    if (action === "Login") {
      return (
        formData.username.trim() !== "" &&
        formData.password.trim() !== ""
      );
    }

    if (action === "Forgot Password") {
      return formData.email.trim() !== "";
    }

    return false;
  };

  const saveSession = (response) => {
    const {
      user,
      accessToken,
      refreshToken,
    } = response.data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));

    return user;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formIsComplete() || loading) {
      return;
    }

    setLoading(true);
    setLoginError("");
    setLoginNotice("");

    try {
      if (action === "Sign Up") {
        const response = await api.auth.register({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          displayName: formData.fullname.trim(),
        });

        const user = saveSession(response);

        setSuccessUser(user);
        setSuccessState("signup");
        return;
      }

      if (action === "Login") {
        const response = await api.auth.login({
          username: formData.username.trim(),
          password: formData.password,
        });

        const user = saveSession(response);

        setSuccessUser(user);
        setSuccessState("login");
        return;
      }

      if (action === "Forgot Password") {
        setToast({
          open: true,
          type: "info",
          title: "Password recovery is not available yet",
          message:
            "Echoo has not enabled password-reset email yet. Please contact support or your administrator if you cannot access your account.",
        });

        return;
      }
    } catch (error) {
      if (action === "Login") {
        const isCredentialError =
          error?.status === 401 ||
          error?.status === 403 ||
          [
            "INVALID_CREDENTIALS",
            "AUTH_INVALID",
            "LOGIN_FAILED",
          ].includes(error?.code);

        setLoginError(
          isCredentialError
            ? "Incorrect username or password. Please check your details and try again."
            : error?.message ||
                "We couldn't sign you in. Please try again."
        );
        return;
      }

      setToast({
        open: true,
        type: "error",
        title:
          action === "Sign Up"
            ? "Could not create account"
            : "Could not send reset email",
        message:
          error.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const switchToLogin = () => {
    setAction("Login");
    setShowPassword(false);
    setSuccessState(null);
    setLoginError("");
    setLoginNotice("");
  };

  const switchToSignUp = () => {
    setAction("Sign Up");
    setShowPassword(false);
    setSuccessState(null);
    setLoginError("");
    setLoginNotice("");
  };

  if (successState === "signup") {
    return (
      <div
        id="echoo-main-content"
        role="main"
        tabIndex="-1"
        className="auth-page echoo-onboarding-page"
      >
        <EchoAmbient
          density="low"
          className="echoo-onboarding-ambient"
        />
        <div className="auth-card compact-card">
          <SuccessState
            title="Account created"
            message="Your Echoo account is ready. Let's set up your profile."
            autoContinue
            duration={900}
            onContinue={() => {
              if (onAccountCreated) {
                onAccountCreated(successUser);
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (successState === "login") {
    return (
      <div className="auth-page">
        <div className="auth-card compact-card">
          <SuccessState
            title="Welcome back"
            message="Opening your Echoo account..."
            autoContinue
            duration={700}
            onContinue={() => {
              if (onLoginSuccess) {
                onLoginSuccess(successUser);
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (action === "Forgot Password") {
    return (
      <div className="auth-page">
        <Toast
          open={toast.open}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() =>
            setToast((current) => ({
              ...current,
              open: false,
            }))
          }
        />

        <div className="auth-card compact-card">
          <div className="top-nav">
            <button
              type="button"
              className="back-button"
              onClick={switchToLogin}
              aria-label="Back to sign in"
            >
              <FaArrowLeft />
            </button>
          </div>

          <div className="logo-container">
            <img
              src={EchooLogoImage}
              alt="Echoo Logo"
              className="echoo-logo-image"
            />
          </div>

          <div className="auth-header forgot-header">
            <h1>Forgot Password</h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="auth-form compact-form"
          >
            <p className="forgot-description">
              Enter the email address associated with your account,
              and we'll send you a verification code.
            </p>

            <div className="input-container">
              <div className="input">
                <input
                  className="forminput"
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Sending..."
              disabled={!formIsComplete()}
              className={`main-button ${
                formIsComplete() ? "active" : ""
              }`}
            >
              Send
            </LoadingButton>
          </form>
        </div>
      </div>
    );
  }

  if (action === "Login") {
    const showSocialNotice = (provider) => {
      setLoginError("");
      setLoginNotice(
        `${provider} sign-in is not enabled on the current Echoo backend yet. Please use your Echoo username and password.`
      );
    };

    return (
      <main className="echoo-login-page">
        <section className="echoo-login-hero" aria-label="About Echoo">
          <LoginBrand />

          <div className="echoo-login-hero-copy">
            <h1>
              Your voice.
              <br />
              Your audience.
              <br />
              <span className="echoo-login-live-word">Live.</span>
            </h1>

            <p>
              Broadcast live audio, build your community, and stay
              connected with the conversations that matter.
            </p>
          </div>

          <LoginLiveCard />

          <div className="echoo-login-features" aria-hidden="true">
            <div className="echoo-login-feature">
              <div className="echoo-login-feature-icon">
                <FaBroadcastTower />
              </div>
              <div>
                <strong>Go live</strong>
                <span>
                  Reach listeners
                  <br />
                  in real time
                </span>
              </div>
            </div>

            <div className="echoo-login-feature">
              <div className="echoo-login-feature-icon">
                <FaUsers />
              </div>
              <div>
                <strong>Grow your audience</strong>
                <span>
                  Build community
                  <br />
                  that engages
                </span>
              </div>
            </div>

            <div className="echoo-login-feature">
              <div className="echoo-login-feature-icon">
                <FaChartLine />
              </div>
              <div>
                <strong>Track &amp; improve</strong>
                <span>
                  Insights to help
                  <br />
                  you grow
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="echoo-login-panel" aria-labelledby="echoo-login-title">
          <button
            type="button"
            className="echoo-login-help"
            onClick={() => {
              setLoginError("");
              setLoginNotice(
                "The Help Center is not connected in this frontend yet."
              );
            }}
          >
            <FaQuestionCircle />
            Help Center
          </button>

          <div className="echoo-login-form-wrap">
            <LoginBrand mobile />

            <header className="echoo-login-heading">
              <h1 id="echoo-login-title">Welcome back</h1>
              <p>Sign in to continue to Echoo.</p>
            </header>

            <div className="echoo-login-mobile-preview">
              <LoginLiveCard />
            </div>

            <form
              className="echoo-login-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="echoo-login-field-group">
                <label htmlFor="echoo-login-username">Username</label>
                <div
                  className={`echoo-login-input-shell ${
                    loginError ? "has-error" : ""
                  }`}
                >
                  <FaUser className="echoo-login-input-icon" aria-hidden="true" />
                  <input
                    id="echoo-login-username"
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck="false"
                    aria-invalid={loginError ? "true" : "false"}
                    required
                  />
                </div>
              </div>

              <div className="echoo-login-field-group">
                <div className="echoo-login-field-row">
                  <label htmlFor="echoo-login-password">Password</label>
                  <button
                    type="button"
                    className="echoo-login-forgot"
                    onClick={() => {
                      setLoginError("");
                      setLoginNotice("");
                      setAction("Forgot Password");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div
                  className={`echoo-login-input-shell ${
                    loginError ? "has-error" : ""
                  }`}
                >
                  <FaLock
                    className="echoo-login-input-icon"
                    aria-hidden="true"
                  />
                  <input
                    id="echoo-login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    aria-invalid={loginError ? "true" : "false"}
                    aria-describedby={
                      loginError ? "echoo-login-error" : undefined
                    }
                    required
                  />

                  <button
                    type="button"
                    className="echoo-login-password-toggle"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {loginError && (
                  <p
                    id="echoo-login-error"
                    className="echoo-login-error"
                    role="alert"
                    aria-live="polite"
                  >
                    <FaExclamationCircle aria-hidden="true" />
                    <span>{loginError}</span>
                  </p>
                )}
              </div>

              <LoadingButton
                type="submit"
                loading={loading}
                loadingText="Signing in..."
                disabled={!formIsComplete()}
                className="echoo-login-submit"
              >
                Sign in
              </LoadingButton>

              {loginNotice && (
                <p className="echoo-login-notice" role="status">
                  {loginNotice}
                </p>
              )}

              <div className="echoo-login-divider">
                <span>or continue with</span>
              </div>

              <div className="echoo-login-socials">
                <button
                  type="button"
                  className="echoo-login-social"
                  onClick={() => showSocialNotice("Google")}
                >
                  <FcGoogle aria-hidden="true" />
                  Continue with Google
                </button>

                <button
                  type="button"
                  className="echoo-login-social"
                  onClick={() => showSocialNotice("Apple")}
                >
                  <FaApple aria-hidden="true" />
                  Continue with Apple
                </button>
              </div>

              <p className="echoo-login-signup-prompt">
                New to Echoo?{" "}
                <button type="button" onClick={switchToSignUp}>
                  Create account
                </button>
              </p>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="auth-page">
      <Toast
        open={toast.open}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() =>
          setToast((current) => ({
            ...current,
            open: false,
          }))
        }
      />

      <div
        className={`auth-card ${
          action === "Sign Up" ? "signup-card" : "compact-card"
        }`}
      >
        {action === "Sign Up" && (
          <StepProgress
            steps={["Account", "Profile", "Get Started"]}
            currentStep={1}
          />
        )}

        <div className="top-nav">
          <div></div>

          {action === "Sign Up" && (
            <button
              type="button"
              className="signin-link"
              onClick={switchToLogin}
            >
              <span>Sign in</span>
              <FaArrowRight />
            </button>
          )}
        </div>

        <div className="logo-container">
          <img
            src={EchooLogoImage}
            alt="Echoo Logo"
            className="echoo-logo-image"
          />
        </div>

        <div className="auth-header">
          <h1>
            Hear every audio detail
            <br />
            clearly with <span>Echoo</span>
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="auth-form signup-form"
        >
          <div className="input-container signup-grid">
            <div className="input">
              <input
                className="forminput"
                type="text"
                name="fullname"
                placeholder="Full name"
                value={formData.fullname}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <div className="input">
              <input
                className="forminput"
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="input">
              <input
                className="forminput"
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="input password-input">
              <input
                className="forminput"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <LoadingButton
            type="submit"
            loading={loading}
            loadingText="Creating account..."
            disabled={!formIsComplete()}
            className={`main-button ${
              formIsComplete() ? "active" : ""
            }`}
          >
            Create account
          </LoadingButton>

          <p className="terms-text">
            By creating an account you agree to our
            <br />
            <span className="terms-link">Terms of services</span>{" "}
            and <span className="terms-link">Privacy Policy</span>
          </p>

          <div className="or-text">or</div>

          <div className="social-buttons">
            <button
              type="button"
              className="social-button"
              aria-label="Continue with Google"
            >
              <FcGoogle />
            </button>

            <button
              type="button"
              className="social-button apple"
              aria-label="Continue with Apple"
            >
              <FaApple />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
