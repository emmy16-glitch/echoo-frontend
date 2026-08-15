import React, { useState } from "react";
import "./ProfileSetup.css";
import echooLogo from "../Assets/logo.png";

import StepProgress from "../UI/StepProgress";
import LoadingButton from "../UI/LoadingButton";
import SuccessState from "../UI/SuccessState";
import Toast from "../UI/Toast";

import onboardingService from "../../services/onboardingService";

import "../../styles/echoo-onboarding.css";
import EchoAmbient from "../EchooSystem/EchoAmbient";
const prepareImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Could not read the selected image."));
    };

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => {
        reject(new Error("Could not process the selected image."));
      };

      image.onload = () => {
        const maxSize = 420;
        const scale = Math.min(
          1,
          maxSize / Math.max(image.width, image.height)
        );

        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const ProfileSetup = ({ onProfileCompleted }) => {
  const storedUser = getStoredUser();

  const [bio, setBio] = useState(
    storedUser.bio || localStorage.getItem("profileBio") || ""
  );

  const [profileImage, setProfileImage] = useState(
    storedUser.avatar ||
      storedUser.profileImage ||
      localStorage.getItem("profileImage") ||
      null
  );

  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  const showError = (message) => {
    setToast({
      open: true,
      type: "error",
      title: "Could not save profile",
      message,
    });
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showError("Please choose an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError("Please choose an image smaller than 10 MB.");
      return;
    }

    try {
      const imageData = await prepareImage(file);

      setProfileImage(imageData);
      localStorage.setItem("profileImage", imageData);
    } catch (error) {
      showError(error.message || "Could not process the image.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const currentUser = getStoredUser();
    const userId = currentUser.id || currentUser._id;

    if (!userId) {
      showError("Your account session is missing. Please sign in again.");
      return;
    }

    try {
      setSaving(true);

      const response = await onboardingService.updateProfile(userId, {
        bio: bio.trim(),
        avatar: profileImage || null,
      });

      const updatedUser = {
        ...currentUser,
        ...(response?.data || {}),
        bio: bio.trim(),
        avatar: profileImage || response?.data?.avatar || null,
        profileImage: profileImage || response?.data?.avatar || "",
        profileCompleted: true,
      };

      localStorage.setItem("profileBio", bio.trim());

      if (profileImage) {
        localStorage.setItem("profileImage", profileImage);
      }

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setCompleted(true);
    } catch (error) {
      showError(error.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (completed) {
    return (
      <div
        id="echoo-main-content"
        role="main"
        tabIndex="-1"
        className="profile-page echoo-onboarding-page"
      >
        <EchoAmbient
          density="low"
          className="echoo-onboarding-ambient"
        />
        <div className="profile-container">
          <SuccessState
            title="Profile saved"
            message="Your Echoo profile is ready. Next, choose how you want to start."
            autoContinue
            duration={900}
            onContinue={() => {
              if (onProfileCompleted) {
                onProfileCompleted();
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
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

      <div className="profile-container">
        <StepProgress
          steps={["Account", "Profile", "Get Started"]}
          currentStep={2}
        />

        <img
          src={echooLogo}
          alt="Echoo"
          className="profile-logo"
        />

        <div className="profile-header">
          <h1>Set Up Your Profile</h1>

          <p>
            Tell people a little about yourself.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="profile-image-section">
            <label
              htmlFor="profile-image-input"
              className="profile-image-preview"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile Preview"
                />
              ) : (
                <div className="profile-placeholder">
                  <div className="placeholder-head"></div>
                  <div className="placeholder-body"></div>
                </div>
              )}
            </label>

            <input
              id="profile-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />

            <label
              htmlFor="profile-image-input"
              className="image-button"
            >
              <span className="upload-icon">↥</span>
              Choose Profile Picture
            </label>
          </div>

          <div className="profile-bio-section">
            <label htmlFor="profile-bio">
              Tell us about yourself
            </label>

            <textarea
              id="profile-bio"
              name="bio"
              placeholder="Write a short bio about yourself..."
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={150}
            />
          </div>

          <div className="profile-actions">
            <LoadingButton
              type="submit"
              loading={saving}
              loadingText="Saving your profile..."
              className="profile-continue-button"
            >
              Continue
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;