import React, { useState } from "react";
import "./ChooseRole.css";

import {
  FaArrowLeft,
  FaCheck,
  FaHeadphones,
  FaMicrophone,
} from "react-icons/fa";

import echooLogo from "../Assets/logo.png";

import StepProgress from "../UI/StepProgress";
import LoadingButton from "../UI/LoadingButton";
import SuccessState from "../UI/SuccessState";
import Toast from "../UI/Toast";

import onboardingService from "../../services/onboardingService";

import "../../styles/echoo-onboarding.css";
import EchoAmbient from "../EchooSystem/EchoAmbient";
const ChooseRole = ({
  onListenerContinue,
  onCreatorContinue,
  onStartOver,
}) => {
  const [
    selectedRole,
    setSelectedRole,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    completedRole,
    setCompletedRole,
  ] = useState("");

  const [
    toast,
    setToast,
  ] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  const handleContinue =
    async () => {
      if (
        !selectedRole ||
        saving
      ) {
        return;
      }

      try {
        setSaving(true);

        const response =
          await onboardingService.chooseUserType(
            selectedRole
          );

        if (
          response?.data?.user
        ) {
          onboardingService.saveUser(
            response.data.user
          );
        }

        localStorage.setItem(
          "echooRole",
          selectedRole
        );

        setCompletedRole(
          selectedRole
        );
      } catch (error) {
        const message =
          error?.message || "";

        const alreadyCompleted =
          error?.code ===
            "ONBOARDING_COMPLETED" ||
          message
            .toLowerCase()
            .includes(
              "onboarding already completed"
            );

        if (alreadyCompleted) {
          try {
            const response =
              await onboardingService.getStatus();

            const status =
              response?.data || {};

            const userType =
              status.userType ||
              status.user?.userType ||
              localStorage.getItem(
                "echooRole"
              );

            if (
              status.user
            ) {
              onboardingService.saveUser(
                status.user
              );
            }

            if (
              status.isOnboardingComplete ===
                true &&
              userType ===
                "listener"
            ) {
              localStorage.setItem(
                "echooRole",
                "listener"
              );

              setCompletedRole(
                "listener"
              );

              return;
            }

            if (
              status.isOnboardingComplete ===
                true &&
              userType ===
                "creator"
            ) {
              localStorage.setItem(
                "echooRole",
                "creator"
              );

              setCompletedRole(
                "creator"
              );

              return;
            }
          } catch (
            statusError
          ) {
            console.error(
              "Onboarding status error:",
              statusError
            );
          }
        }

        setToast({
          open: true,
          type: "error",
          title:
            "Could not save your choice",
          message:
            message ||
            "Please try again.",
        });
      } finally {
        setSaving(false);
      }
    };

  if (completedRole) {
    const isListener =
      completedRole ===
      "listener";

    return (
      <div
        id="echoo-main-content"
        role="main"
        tabIndex="-1"
        className="role-page echoo-onboarding-page"
      >
        <EchoAmbient
          density="low"
          className="echoo-onboarding-ambient"
        />
        <div className="role-container">
          <SuccessState
            title={
              isListener
                ? "You're ready to listen"
                : "Creator selected"
            }
            message={
              isListener
                ? "Your listener account is ready. Opening Echoo..."
                : "Next, tell us how you will create on Echoo."
            }
            autoContinue
            duration={900}
            onContinue={() => {
              if (
                isListener
              ) {
                if (
                  onListenerContinue
                ) {
                  onListenerContinue();
                } else {
                  window.location.href =
                    "/listen";
                }

                return;
              }

              if (
                onCreatorContinue
              ) {
                onCreatorContinue();
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="role-page">
      <Toast
        open={toast.open}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() =>
          setToast(
            (current) => ({
              ...current,
              open: false,
            })
          )
        }
      />

      <div className="role-container">
        <div className="role-top-actions">
          <button
            type="button"
            className="role-start-over"
            onClick={
              onStartOver
            }
            disabled={
              saving
            }
          >
            <FaArrowLeft />

            <span>
              Start over
            </span>
          </button>
        </div>

        <StepProgress
          steps={[
            "Account",
            "Profile",
            "Get Started",
          ]}
          currentStep={3}
        />

        <img
          src={echooLogo}
          alt="Echoo"
          className="role-logo"
        />

        <div className="role-header">
          <h1>
            How would you like to start?
          </h1>

          <p>
            Choose how you want to begin on Echoo.
            <br />
            You can become a creator anytime.
          </p>
        </div>

        <div className="role-options">
          <button
            type="button"
            className={`role-option ${
              selectedRole ===
              "listener"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setSelectedRole(
                "listener"
              )
            }
            disabled={
              saving
            }
          >
            <span className="role-selector">
              {selectedRole ===
                "listener" && (
                <FaCheck />
              )}
            </span>

            <div className="role-icon">
              <FaHeadphones />
            </div>

            <div className="role-option-text">
              <h2>
                Listener
              </h2>

              <p>
                Discover and enjoy
                <br />
                audio content.
              </p>
            </div>
          </button>

          <button
            type="button"
            className={`role-option ${
              selectedRole ===
              "creator"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setSelectedRole(
                "creator"
              )
            }
            disabled={
              saving
            }
          >
            <span className="role-selector">
              {selectedRole ===
                "creator" && (
                <FaCheck />
              )}
            </span>

            <div className="role-icon">
              <FaMicrophone />
            </div>

            <div className="role-option-text">
              <h2>
                Creator
              </h2>

              <p>
                Create, publish and
                <br />
                build your audience.
              </p>
            </div>
          </button>
        </div>

        <LoadingButton
          type="button"
          disabled={
            !selectedRole
          }
          loading={saving}
          loadingText={
            selectedRole ===
            "creator"
              ? "Setting up creator..."
              : "Preparing Echoo..."
          }
          className={`role-continue ${
            selectedRole
              ? "active"
              : ""
          }`}
          onClick={
            handleContinue
          }
        >
          {selectedRole ===
          "listener"
            ? "Continue as Listener"
            : selectedRole ===
              "creator"
            ? "Continue as Creator"
            : "Continue"}
        </LoadingButton>
      </div>
    </div>
  );
};

export default ChooseRole;