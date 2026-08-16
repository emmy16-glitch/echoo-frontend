import {
  FaBroadcastTower,
  FaCheck,
  FaHeadphones,
  FaHeart,
  FaMicrophone,
  FaSlidersH,
  FaUserFriends,
} from "react-icons/fa";
import echooLogo from "../Assets/logo.png";
import "./onboarding-redesign.css";

const steps = ["Account", "Profile", "Role"];

const AudioHero = () => (
  <div className="eor-audio-card" aria-hidden="true">
    <div className="eor-audio-topline">
      <span className="eor-live-pill"><span /> LIVE</span>
      <span className="eor-meter"><i /><i /><i /></span>
    </div>
    <div className="eor-wave-row">
      {Array.from({ length: 44 }, (_, index) => (
        <span
          key={index}
          style={{
            "--bar": `${22 + ((index * 17) % 52)}%`,
            "--delay": `${(index % 9) * 0.07}s`,
          }}
        />
      ))}
      <div className="eor-mic-orb"><FaMicrophone /></div>
    </div>
    <div className="eor-audio-controls">
      <span><FaBroadcastTower /></span>
      <span className="active"><FaMicrophone /></span>
      <span><FaSlidersH /></span>
    </div>
  </div>
);

const ProfileHero = () => (
  <div className="eor-profile-hero-card" aria-hidden="true">
    <div className="eor-profile-avatar"><span /></div>
    <div className="eor-profile-lines">
      <i /><i /><i />
    </div>
    <div className="eor-profile-wave">
      {Array.from({ length: 24 }, (_, index) => (
        <span key={index} style={{ "--bar": `${18 + ((index * 23) % 58)}%` }} />
      ))}
    </div>
    <div className="eor-float-badge eor-people"><FaUserFriends /></div>
    <div className="eor-float-badge eor-profile-mic"><FaMicrophone /></div>
    <div className="eor-float-badge eor-heart"><FaHeart /></div>
  </div>
);

const OnboardingFrame = ({
  step,
  hero = "broadcast",
  children,
  panelClassName = "",
}) => {
  const isProfile = hero === "profile";

  return (
    <main className={`echoo-onboarding-redesign eor-step-${step}`}>
      <section className="eor-hero" aria-label="Echoo onboarding">
        <div className="eor-brand">
          <img src={echooLogo} alt="" aria-hidden="true" />
          <span>Echoo</span>
        </div>

        <div className="eor-hero-copy">
          {isProfile ? (
            <>
              <h1>Your <em>voice.</em><br />Your <em>identity.</em></h1>
              <p>Build your profile so others can discover, connect, and listen. Be authentic. Be you.</p>
            </>
          ) : (
            <>
              <h1>Broadcast<br />your <em>voice.</em></h1>
              <p>Go live. Share your message. Inspire your audience. All in one beautiful platform built for audio.</p>
            </>
          )}
        </div>

        {isProfile ? <ProfileHero /> : <AudioHero />}
      </section>

      <section className="eor-form-side">
        <div className={`eor-panel ${panelClassName}`}>
          <div className="eor-mobile-brand">
            <div className="eor-mobile-logo"><img src={echooLogo} alt="" aria-hidden="true" /><strong>Echoo</strong></div>
            <span>Step {step} of 3</span>
          </div>

          <div className="eor-stepper" aria-label={`Step ${step} of 3`}>
            {steps.map((label, index) => {
              const number = index + 1;
              const complete = number < step;
              const current = number === step;
              return (
                <div className={`eor-step ${complete ? "complete" : ""} ${current ? "current" : ""}`} key={label}>
                  <span className="eor-step-circle">{complete ? <FaCheck /> : number}</span>
                  <span className="eor-step-label">{label}</span>
                  {index < steps.length - 1 && <span className="eor-step-line" />}
                </div>
              );
            })}
          </div>

          {children}
        </div>
      </section>
    </main>
  );
};

export default OnboardingFrame;
