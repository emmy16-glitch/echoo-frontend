import { useEffect, useRef, useState } from "react";
import {
  FaBroadcastTower,
  FaMicrophone,
  FaSlidersH,
  FaWaveSquare,
} from "react-icons/fa";

const BAR_COUNT = 72;

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
    const values = new Uint8Array(2048);
    let tick = 0;
    let levelEnvelope = 0;

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
      glow.addColorStop(0, "rgba(72, 132, 235, 0.08)");
      glow.addColorStop(0.18, "rgba(76, 139, 239, 0.28)");
      glow.addColorStop(0.5, "rgba(23, 105, 211, 0.76)");
      glow.addColorStop(0.82, "rgba(76, 139, 239, 0.28)");
      glow.addColorStop(1, "rgba(72, 132, 235, 0.08)");

      ctx.strokeStyle = "rgba(90, 146, 244, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      if (analyser) {
        analyser.getByteTimeDomainData(values);

        let sum = 0;
        for (let i = 0; i < values.length; i += 1) {
          const sample = (values[i] - 128) / 128;
          sum += sample * sample;
        }

        const rms = Math.sqrt(sum / values.length);
        levelEnvelope = levelEnvelope * 0.76 + rms * 0.24;
      } else {
        levelEnvelope *= 0.9;
      }

      const gap = width < 430 ? 2.4 : 3.4;
      const barWidth = Math.max(
        1.8,
        (width - gap * (BAR_COUNT - 1)) / BAR_COUNT
      );
      const maxHeight = height * 0.76;
      const hoverBoost = hoverRef.current ? 1.06 : 1;

      for (let i = 0; i < BAR_COUNT; i += 1) {
        const x = i * (barWidth + gap);
        let amplitude;

        if (analyser) {
          const start = Math.floor((i / BAR_COUNT) * values.length);
          const end = Math.min(
            values.length,
            start + Math.max(3, Math.floor(values.length / BAR_COUNT))
          );

          let local = 0;
          for (let j = start; j < end; j += 1) {
            local += Math.abs(values[j] - 128) / 128;
          }
          local /= Math.max(1, end - start);

          amplitude =
            0.07 +
            Math.min(0.9, local * 3.4 + levelEnvelope * 4.8);
        } else if (reducedMotion) {
          amplitude = 0.13 + (Math.sin(i * 0.42) + 1) * 0.025;
        } else {
          const waveA = Math.sin(tick * 0.018 + i * 0.38);
          const waveB = Math.sin(tick * 0.011 - i * 0.17);
          amplitude = 0.09 + Math.abs(waveA) * 0.075 + Math.abs(waveB) * 0.03;
        }

        const edgeFade = Math.sin(((i + 1) / (BAR_COUNT + 1)) * Math.PI);
        const barHeight = Math.max(
          3,
          Math.min(
            maxHeight,
            maxHeight * amplitude * (0.48 + edgeFade * 0.52) * hoverBoost
          )
        );
        const y = centerY - barHeight / 2;

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, Math.min(barWidth / 2, 4));
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
      const audioContext = new AudioContext();
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.62;

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
      setMicState(error?.name === "NotAllowedError" ? "denied" : "unavailable");
      setMessage("Microphone unavailable — you can still sign in");
    }
  };

  const statusLabel =
    micState === "active"
      ? "MIC ACTIVE"
      : micState === "requesting"
      ? "REQUESTING"
      : micState === "denied" || micState === "unavailable"
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
