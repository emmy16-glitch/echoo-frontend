import { useEffect, useRef, useState } from "react";
import {
  FaBroadcastTower,
  FaMicrophone,
  FaSlidersH,
  FaWaveSquare,
} from "react-icons/fa";
import "./login-waveform-parity.css";

const BAR_COUNT = 44;

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
  const [message, setMessage] = useState(
    "Tap the mic to preview your microphone"
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;
    const frequencyData = new Uint8Array(128);
    let levelEnvelope = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time = 0) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerY = height / 2;
      const analyser = analyserRef.current;

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "rgba(107, 167, 244, 0.58)");
      gradient.addColorStop(0.2, "rgba(92, 157, 241, 0.84)");
      gradient.addColorStop(0.5, "rgba(23, 105, 211, 0.98)");
      gradient.addColorStop(0.8, "rgba(92, 157, 241, 0.84)");
      gradient.addColorStop(1, "rgba(107, 167, 244, 0.58)");

      if (analyser) {
        analyser.getByteFrequencyData(frequencyData);
        let total = 0;
        for (let i = 0; i < frequencyData.length; i += 1) {
          total += frequencyData[i] / 255;
        }
        const average = total / frequencyData.length;
        levelEnvelope = levelEnvelope * 0.72 + average * 0.28;
      } else {
        levelEnvelope *= 0.9;
      }

      const gap = width < 430 ? 3.2 : 4.4;
      const barWidth = Math.max(
        width < 430 ? 4.5 : 6,
        (width - gap * (BAR_COUNT - 1)) / BAR_COUNT
      );
      const maxHeight = height * 0.88;
      const hoverBoost = hoverRef.current ? 1.05 : 1;

      for (let i = 0; i < BAR_COUNT; i += 1) {
        const x = i * (barWidth + gap);
        const edgeFade = Math.sin(((i + 1) / (BAR_COUNT + 1)) * Math.PI);
        let amplitude;

        if (analyser) {
          const bucket = Math.min(
            frequencyData.length - 1,
            Math.floor((i / BAR_COUNT) * frequencyData.length)
          );
          const level = frequencyData[bucket] / 255;
          const neighbour =
            frequencyData[Math.min(bucket + 2, frequencyData.length - 1)] / 255;
          const energy = Math.min(
            1,
            level * 0.7 + neighbour * 0.3 + levelEnvelope * 0.55
          );
          amplitude = 0.22 + energy * 0.95;
        } else if (reducedMotion) {
          amplitude = 0.48 + Math.sin(i * 0.44) * 0.08;
        } else {
          const waveA = Math.sin(time * 0.0042 + i * 0.43);
          const waveB = Math.sin(time * 0.0026 - i * 0.21);
          const waveC = Math.sin(time * 0.0015 + i * 0.11);
          amplitude =
            0.34 +
            Math.abs(waveA) * 0.42 +
            Math.abs(waveB) * 0.2 +
            Math.abs(waveC) * 0.1;
        }

        const shape = 0.72 + edgeFade * 0.28;
        const barHeight = Math.max(
          12,
          Math.min(maxHeight, maxHeight * amplitude * shape * hoverBoost)
        );
        const y = centerY - barHeight / 2;

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(
          x,
          y,
          barWidth,
          barHeight,
          Math.min(barWidth / 2, 7)
        );
        ctx.fill();
      }

      rafRef.current = window.requestAnimationFrame(draw);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    rafRef.current = window.requestAnimationFrame(draw);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(rafRef.current);
      stopStream(streamRef.current);
      streamRef.current = null;
      analyserRef.current = null;
      audioContextRef.current?.close?.().catch?.(() => {});
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
    setMessage("Tap the mic to preview your microphone");
  };

  const toggleMic = async () => {
    if (micState === "active") {
      await disableMic();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState("unavailable");
      setMessage("Microphone unavailable — you can still sign in");
      return;
    }

    setMicState("requesting");
    setMessage("Requesting microphone…");

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
      if (!AudioContext) {
        stopStream(stream);
        throw new Error("AudioContext unavailable");
      }

      const audioContext = new AudioContext();
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.68;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      setMicState("active");
      setMessage("Mic active — audio stays on this device");
    } catch (error) {
      stopStream(streamRef.current);
      streamRef.current = null;
      analyserRef.current = null;
      audioContextRef.current?.close?.().catch?.(() => {});
      audioContextRef.current = null;
      setMicState(error?.name === "NotAllowedError" ? "denied" : "unavailable");
      setMessage(
        error?.name === "NotAllowedError"
          ? "Microphone permission was not granted"
          : "Microphone unavailable — you can still sign in"
      );
    }
  };

  const statusLabel =
    micState === "active"
      ? "MIC ACTIVE"
      : micState === "requesting"
      ? "REQUESTING"
      : micState === "denied"
      ? "MIC BLOCKED"
      : micState === "unavailable"
      ? "MIC UNAVAILABLE"
      : "MIC PREVIEW";

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
          Go live. Share your message. Inspire your audience. {" "}
          All in one beautiful platform built for audio.
        </p>
      </div>

      <div
        className={`echoo-audio-preview is-${micState}`}
        onPointerEnter={() => {
          hoverRef.current = true;
        }}
        onPointerLeave={() => {
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
          <canvas
            ref={canvasRef}
            className="echoo-audio-wave-canvas"
            aria-hidden="true"
          />

          <button
            type="button"
            className={`echoo-mic-preview-button ${
              micState === "active" ? "is-active" : ""
            }`}
            onClick={toggleMic}
            disabled={micState === "requesting"}
            aria-pressed={micState === "active"}
            aria-label={
              micState === "active"
                ? "Turn off microphone preview"
                : "Preview microphone"
            }
          >
            <span className="echoo-mic-preview-ring" aria-hidden="true" />
            <FaMicrophone aria-hidden="true" />
          </button>
        </div>

        <div className="echoo-audio-preview-controls" aria-hidden="true">
          <span className="echoo-audio-preview-control">
            <FaWaveSquare />
          </span>
          <span className="echoo-audio-preview-control echoo-broadcast-center-control">
            <FaBroadcastTower />
          </span>
          <span className="echoo-audio-preview-control">
            <FaSlidersH />
          </span>
        </div>

        <p
          className={`echoo-mic-preview-message is-${micState}`}
          aria-live="polite"
        >
          {message}
        </p>
      </div>
    </div>
  );
};

export default BroadcastLoginVisual;
