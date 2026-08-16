import { useEffect, useRef, useState } from "react";
import {
  FaBroadcastTower,
  FaMicrophone,
  FaSlidersH,
  FaWaveSquare,
} from "react-icons/fa";

const BAR_COUNT = 64;

const stopStream = (stream) => {
  stream?.getTracks?.().forEach((track) => track.stop());
};

const BroadcastLoginVisual = ({ logoSrc }) => {
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(0);
  const hoverRef = useRef(false);
  const [micState, setMicState] = useState("idle");
  const [message, setMessage] = useState("Click the microphone to preview your input");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const values = new Uint8Array(128);
    let tick = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerY = height / 2;
      const analyser = analyserRef.current;

      ctx.clearRect(0, 0, width, height);

      const glow = ctx.createLinearGradient(0, 0, width, 0);
      glow.addColorStop(0, "rgba(60, 126, 255, 0.08)");
      glow.addColorStop(0.5, "rgba(37, 99, 235, 0.62)");
      glow.addColorStop(1, "rgba(96, 165, 250, 0.08)");

      ctx.strokeStyle = "rgba(90, 146, 244, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      if (analyser) analyser.getByteFrequencyData(values);

      const gap = 4;
      const barWidth = Math.max(2, (width - gap * (BAR_COUNT - 1)) / BAR_COUNT);
      const maxHeight = height * 0.72;
      const hoverBoost = hoverRef.current ? 1.12 : 1;

      for (let i = 0; i < BAR_COUNT; i += 1) {
        const x = i * (barWidth + gap);
        let amplitude;

        if (analyser) {
          const sampleIndex = Math.floor((i / BAR_COUNT) * values.length);
          amplitude = Math.max(0.08, values[sampleIndex] / 255);
        } else if (reducedMotion) {
          amplitude = 0.2 + (Math.sin(i * 0.55) + 1) * 0.05;
        } else {
          const waveA = Math.sin(tick * 0.035 + i * 0.42);
          const waveB = Math.sin(tick * 0.021 - i * 0.18);
          amplitude = 0.16 + Math.abs(waveA * 0.16 + waveB * 0.08);
        }

        const barHeight = Math.min(maxHeight, maxHeight * amplitude * hoverBoost);
        const y = centerY - barHeight / 2;
        const radius = Math.min(barWidth / 2, 4);

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      tick += 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafRef.current);
      stopStream(streamRef.current);
      streamRef.current = null;
      analyserRef.current = null;
      audioContextRef.current?.close?.();
      audioContextRef.current = null;
    };
  }, []);

  const disableMic = async () => {
    stopStream(streamRef.current);
    streamRef.current = null;
    analyserRef.current = null;

    if (audioContextRef.current) {
      await audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setMicState("idle");
    setMessage("Click the microphone to preview your input");
  };

  const toggleMic = async () => {
    if (micState === "active") {
      await disableMic();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState("unavailable");
      setMessage("Microphone preview is not available in this browser");
      return;
    }

    setMicState("requesting");
    setMessage("Waiting for microphone permission…");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      setMicState("active");
      setMessage("Microphone preview active — audio stays on this device");
    } catch (error) {
      stopStream(streamRef.current);
      streamRef.current = null;
      analyserRef.current = null;
      setMicState("denied");
      setMessage(
        error?.name === "NotAllowedError"
          ? "Microphone permission was blocked. You can still sign in normally."
          : "No microphone input is available. You can still sign in normally."
      );
    }
  };

  const statusLabel =
    micState === "active"
      ? "MIC ACTIVE"
      : micState === "requesting"
      ? "CONNECTING"
      : "AUDIO PREVIEW";

  return (
    <div className="echoo-broadcast-visual">
      <div className="echoo-broadcast-brand">
        <img src={logoSrc} alt="Echoo" />
        <span>Echoo</span>
      </div>

      <div className="echoo-broadcast-copy">
        <h1>
          Broadcast
          <br />
          your <span>voice.</span>
        </h1>
        <p>
          Go live. Share your message. Inspire your audience.
          <br />
          All in one beautiful platform built for audio.
        </p>
      </div>

      <div
        className={`echoo-audio-preview ${micState === "active" ? "is-active" : ""}`}
        onMouseEnter={() => {
          hoverRef.current = true;
        }}
        onMouseLeave={() => {
          hoverRef.current = false;
        }}
      >
        <div className="echoo-audio-preview-topline">
          <span className="echoo-audio-preview-status">
            <span className="echoo-audio-preview-dot" />
            {statusLabel}
          </span>

          <div className="echoo-audio-preview-meter" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="echoo-audio-preview-stage">
          <canvas ref={canvasRef} className="echoo-audio-wave-canvas" aria-hidden="true" />

          <button
            type="button"
            className={`echoo-mic-preview-button ${micState === "active" ? "is-active" : ""}`}
            onClick={toggleMic}
            disabled={micState === "requesting"}
            aria-pressed={micState === "active"}
            aria-label={micState === "active" ? "Turn off microphone preview" : "Turn on microphone preview"}
          >
            <span className="echoo-mic-preview-ring" aria-hidden="true" />
            <FaMicrophone aria-hidden="true" />
          </button>
        </div>

        <div className="echoo-audio-preview-controls">
          <button type="button" tabIndex={-1} aria-hidden="true">
            <FaWaveSquare />
          </button>
          <button type="button" className="echoo-broadcast-center-control" tabIndex={-1} aria-hidden="true">
            <FaBroadcastTower />
          </button>
          <button type="button" tabIndex={-1} aria-hidden="true">
            <FaSlidersH />
          </button>
        </div>

        <p className={`echoo-mic-preview-message is-${micState}`} aria-live="polite">
          {message}
        </p>
      </div>
    </div>
  );
};

export default BroadcastLoginVisual;
