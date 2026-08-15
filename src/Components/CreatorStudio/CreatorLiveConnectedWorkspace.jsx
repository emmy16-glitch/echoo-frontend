import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBroadcastTower,
  FaClock,
  FaMicrophone,
  FaPlay,
  FaStop,
  FaSyncAlt,
} from "react-icons/fa";

import LegacyCreatorLiveWorkspace from "./CreatorLiveWorkspace";

import batch3Service from "../../services/batch3Service";

import {
  startLiveKitPublishing,
  stopLiveKitPublishing,
} from "../../services/livekitPublisher";

import "./CreatorPhase9.css";
import "../../styles/echoo-batch3.css";

const formatTime = (
  value
) => {
  if (!value) {
    return "Time not set";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(
      value
    );
  }

  return date
    .toLocaleString(
      [],
      {
        weekday:
          "short",
        day:
          "numeric",
        month:
          "short",
        hour:
          "numeric",
        minute:
          "2-digit",
      }
    );
};

const CreatorLiveConnectedWorkspace =
  (
    props
  ) => {
    const [
      broadcasts,
      setBroadcasts,
    ] = useState([]);

    const [
      loading,
      setLoading,
    ] = useState(true);

    const [
      actionId,
      setActionId,
    ] = useState(null);

    const [
      message,
      setMessage,
    ] = useState("");

    const [
      error,
      setError,
    ] = useState("");

    const [
      mediaActionId,
      setMediaActionId,
    ] = useState(null);

    const [
      connectedBroadcastId,
      setConnectedBroadcastId,
    ] = useState(null);

    const load =
      useCallback(
        async () => {
          try {
            setLoading(
              true
            );

            setError(
              ""
            );

            const response =
              await batch3Service
                .getCreatorBroadcasts();

            setBroadcasts(
              Array.isArray(
                response?.data
              )
                ? response.data
                : []
            );
          } catch (
            loadError
          ) {
            console.error(
              loadError
            );

            setError(
              loadError?.message ||
              "Could not load your live broadcasts."
            );
          } finally {
            setLoading(
              false
            );
          }
        },
        []
      );

    useEffect(() => {
      load();
    }, [load]);

    const live =
      useMemo(
        () =>
          broadcasts.filter(
            (
              item
            ) =>
              item.status ===
              "live"
          ),
        [
          broadcasts,
        ]
      );

    const scheduled =
      useMemo(
        () =>
          broadcasts
            .filter(
              (
                item
              ) =>
                item.status ===
                "scheduled"
            )
            .sort(
              (
                first,
                second
              ) =>
                new Date(
                  first.startTime ||
                  0
                ) -
                new Date(
                  second.startTime ||
                  0
                )
            ),
        [
          broadcasts,
        ]
      );

    const connectMicrophone =
      async (
        broadcast,
        suppliedConnection = null
      ) => {
        if (
          !broadcast?.id ||
          mediaActionId
        ) {
          return;
        }

        const liveKitUrl =
          import.meta.env
            .VITE_LIVEKIT_URL;

        if (!liveKitUrl) {
          throw new Error(
            "VITE_LIVEKIT_URL is not configured."
          );
        }

        setMediaActionId(
          broadcast.id
        );

        try {
          const connection =
            suppliedConnection
              ?.token
              ? suppliedConnection
              : await batch3Service
                  .getLiveKitToken(
                    broadcast.id
                  );

          if (!connection?.token) {
            throw new Error(
              "Echoo did not return a LiveKit token."
            );
          }

          await startLiveKitPublishing({
            url:
              liveKitUrl,

            token:
              connection.token,

            broadcastId:
              broadcast.id,
          });

          setConnectedBroadcastId(
            broadcast.id
          );

          setMessage(
            `${broadcast.title} development test audio is publishing to LiveKit.`
          );

          return connection;
        } catch (mediaError) {
          setConnectedBroadcastId(
            null
          );

          throw mediaError;
        } finally {
          setMediaActionId(
            null
          );
        }
      };

    const start =
      async (
        broadcast
      ) => {
        if (
          !broadcast?.id ||
          actionId
        ) {
          return;
        }

        const confirmed =
          window.confirm(
            `Start "${broadcast.title}" and publish Echoo development test audio to LiveKit now?`
          );

        if (!confirmed) {
          return;
        }

        let backendStarted =
          false;

        try {
          setActionId(
            broadcast.id
          );

          setMessage("");
          setError("");

          const response =
            await batch3Service
              .startBroadcast(
                broadcast.id
              );

          backendStarted =
            true;

          await connectMicrophone(
            broadcast,
            response?.livekit
          );

          setMessage(
            `${broadcast.title} is LIVE and development test audio is publishing to LiveKit.`
          );

          await load();
        } catch (actionError) {
          console.error(
            "Echoo live start:",
            actionError
          );

          await stopLiveKitPublishing()
            .catch(() => {});

          setConnectedBroadcastId(
            null
          );

          if (backendStarted) {
            try {
              await batch3Service
                .endBroadcast(
                  broadcast.id
                );
            } catch (
              rollbackError
            ) {
              console.error(
                "Could not roll back broadcast after microphone failure:",
                rollbackError
              );
            }
          }

          setError(
            actionError?.message ||
            "Could not connect the development test audio to LiveKit."
          );

          await load();
        } finally {
          setActionId(
            null
          );
        }
      };

    const end =
      async (
        broadcast
      ) => {
        if (
          !broadcast?.id ||
          actionId
        ) {
          return;
        }

        const confirmed =
          window.confirm(
            `End "${broadcast.title}" now?`
          );

        if (!confirmed) {
          return;
        }

        try {
          setActionId(
            broadcast.id
          );

          setMessage("");
          setError("");

          await stopLiveKitPublishing();

          setConnectedBroadcastId(
            null
          );

          await batch3Service
            .endBroadcast(
              broadcast.id
            );

          setMessage(
            `${broadcast.title} has ended and the microphone is disconnected.`
          );

          await load();
        } catch (actionError) {
          setError(
            actionError?.message ||
            "Could not end the broadcast."
          );
        } finally {
          setActionId(
            null
          );
        }
      };

    return (
      <div className="b3-creator-live">
        <section className="b3-live-control">
          <header className="b3-section-header">
            <div>
              <span className="b3-kicker">
                LIVE CONTROL
              </span>

              <h1>
                Broadcast lifecycle
              </h1>

              <p>
                Scheduled, live and
                completed state is now
                controlled by the real
                Echoo backend.
              </p>
            </div>

            <button
              type="button"
              className="b3-refresh"
              onClick={
                load
              }
              disabled={
                loading
              }
            >
              <FaSyncAlt />
              Refresh
            </button>
          </header>

          <div className="b3-media-warning">
            <FaMicrophone />

            <div>
              <strong>
                Broadcast state is
                connected.
              </strong>

              <span>
                Creator microphone audio
                now publishes directly
                into LiveKit. OME listener
                relay remains disabled in
                LiveKit-only development mode.
              </span>
            </div>
          </div>

          {message && (
            <div className="b3-message success">
              {message}
            </div>
          )}

          {error && (
            <div className="b3-message error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="b3-empty">
              Loading broadcasts...
            </div>
          ) : (
            <>
              {live.length >
                0 && (
                <div className="b3-live-now-block">
                  <h2>
                    Live now
                  </h2>

                  {live.map(
                    (
                      broadcast
                    ) => (
                      <article
                        className="b3-live-row live"
                        key={
                          broadcast.id
                        }
                      >
                        <div className="b3-live-icon">
                          <FaBroadcastTower />
                        </div>

                        <div className="b3-live-copy">
                          <span>
                            LIVE NOW
                          </span>

                          <strong>
                            {
                              broadcast.title
                            }
                          </strong>

                          <small>
                            {
                              broadcast.stationName
                            }{" "}
                            ·{" "}
                            {
                              broadcast.listenerCount
                            }{" "}
                            listening
                          </small>
                        </div>

                        <button
                          type="button"
                          className="b3-start"
                          onClick={() =>
                            connectMicrophone(
                              broadcast
                            )
                          }
                          disabled={
                            mediaActionId ===
                            broadcast.id
                          }
                        >
                          <FaMicrophone />

                          {mediaActionId ===
                          broadcast.id
                            ? "Connecting..."
                            : connectedBroadcastId ===
                                broadcast.id
                              ? "Test Audio Connected"
                              : "Connect Test Audio"}
                        </button>

                        <button
                          type="button"
                          className="b3-end"
                          onClick={() =>
                            end(
                              broadcast
                            )
                          }
                          disabled={
                            actionId ===
                            broadcast.id
                          }
                        >
                          <FaStop />

                          {actionId ===
                          broadcast.id
                            ? "Ending..."
                            : "End Broadcast"}
                        </button>
                      </article>
                    )
                  )}
                </div>
              )}

              <div className="b3-scheduled-block">
                <h2>
                  Ready to go live
                </h2>

                {scheduled.length ===
                0 ? (
                  <div className="b3-empty">
                    No scheduled
                    broadcasts yet.
                    Create one from the
                    Schedule page.
                  </div>
                ) : (
                  scheduled.map(
                    (
                      broadcast
                    ) => (
                      <article
                        className="b3-live-row"
                        key={
                          broadcast.id
                        }
                      >
                        <div className="b3-live-icon">
                          <FaClock />
                        </div>

                        <div className="b3-live-copy">
                          <span>
                            SCHEDULED
                          </span>

                          <strong>
                            {
                              broadcast.title
                            }
                          </strong>

                          <small>
                            {
                              broadcast.stationName
                            }{" "}
                            ·{" "}
                            {formatTime(
                              broadcast.startTime
                            )}
                          </small>
                        </div>

                        <button
                          type="button"
                          className="b3-start"
                          onClick={() =>
                            start(
                              broadcast
                            )
                          }
                          disabled={
                            actionId ===
                            broadcast.id
                          }
                        >
                          <FaPlay />

                          {actionId ===
                          broadcast.id
                            ? "Starting..."
                            : "Go Live"}
                        </button>
                      </article>
                    )
                  )
                )}
              </div>
            </>
          )}
        </section>

        <section className="b3-legacy-mic">
          <LegacyCreatorLiveWorkspace
            {...props}
          />
        </section>
      </div>
    );
  };

export default CreatorLiveConnectedWorkspace;
