import React, { useState } from "react";
import "./CreatorSetup.css";

import {
  FaBuilding,
  FaChevronDown,
  FaUpload,
  FaUser,
} from "react-icons/fa";

import echooLogo from "../Assets/logo.png";

import StepProgress from "../UI/StepProgress";
import LoadingButton from "../UI/LoadingButton";
import SuccessState from "../UI/SuccessState";
import Toast from "../UI/Toast";

import onboardingService from "../../services/onboardingService";

import "../../styles/echoo-onboarding.css";
import EchoAmbient from "../EchooSystem/EchoAmbient";
const categories = [
  "Music",
  "Podcast",
  "Education",
  "Entertainment",
  "News",
  "Sports",
  "Technology",
  "Spiritual",
  "Comedy",
  "Storytelling",
  "Other",
];

const organizationTypes = [
  { value: "company", label: "Company" },
  { value: "church", label: "Church" },
  { value: "brand", label: "Brand" },
  { value: "community", label: "Community" },
  { value: "organization", label: "Organization" },
  { value: "other", label: "Other" },
];

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const prepareImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () =>
      reject(new Error("Could not read the selected image."));

    reader.onload = () => {
      const image = new Image();

      image.onerror = () =>
        reject(new Error("Could not process the selected image."));

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

const CreatorSetup = ({
  onBackToRole,
  onCreatorReady,
}) => {
  const [step, setStep] = useState(1);
  const [creatorType, setCreatorType] = useState("");
  const [saving, setSaving] = useState(false);

  const [individualDetails, setIndividualDetails] =
    useState({
      category: "",
      content: "",
    });

  const [
    organizationDetails,
    setOrganizationDetails,
  ] = useState({
    name: "",
    organizationType: "",
    category: "",
    about: "",
    content: "",
  });

  const [
    organizationLogo,
    setOrganizationLogo,
  ] = useState(null);

  const [toast, setToast] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  const storedUser = getStoredUser();

  const displayName =
    storedUser.displayName ||
    storedUser.fullname ||
    storedUser.name ||
    "Creator";

  const username = storedUser.username
    ? `@${storedUser.username}`
    : "@creator";

  const profileImage =
    storedUser.avatar ||
    storedUser.profileImage ||
    localStorage.getItem("profileImage") ||
    null;

  const handleIndividualChange = (event) => {
    const { name, value } = event.target;

    setIndividualDetails((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleOrganizationChange = (event) => {
    const { name, value } = event.target;

    setOrganizationDetails((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setToast({
        open: true,
        type: "error",
        title: "Invalid image",
        message: "Please choose an image file.",
      });

      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setToast({
        open: true,
        type: "error",
        title: "Image too large",
        message: "Please choose an image smaller than 10 MB.",
      });

      return;
    }

    try {
      const imageData = await prepareImage(file);
      setOrganizationLogo(imageData);
    } catch (error) {
      setToast({
        open: true,
        type: "error",
        title: "Could not process image",
        message: error.message || "Please try another image.",
      });
    }
  };

  const handleCreatorTypeContinue = () => {
    if (!creatorType) {
      return;
    }

    setStep(2);
  };

  const detailsAreComplete = () => {
    if (creatorType === "individual") {
      return (
        individualDetails.category.trim() !== "" &&
        individualDetails.content.trim() !== ""
      );
    }

    if (creatorType === "organization") {
      return (
        organizationDetails.name.trim() !== "" &&
        organizationDetails.organizationType.trim() !== "" &&
        organizationDetails.category.trim() !== "" &&
        organizationDetails.about.trim() !== "" &&
        organizationDetails.content.trim() !== ""
      );
    }

    return false;
  };

  const finishIndividualSetup = async () => {
    await onboardingService.chooseCreatorType({
      creatorType: "individual",
      artistName: displayName,
    });

    await onboardingService.updateContentInfo({
      category: individualDetails.category,
      contentDescription: individualDetails.content.trim(),
      genres: [],
    });

    const response = await onboardingService.complete();

    if (response?.data?.user) {
      onboardingService.saveUser(response.data.user);
    }

    localStorage.setItem(
      "creatorSetup",
      JSON.stringify({
        type: "individual",
        displayName,
        username: storedUser.username || "",
        profileImage,
        category: individualDetails.category,
        content: individualDetails.content.trim(),
      })
    );
  };

  const finishOrganizationSetup = async () => {
    await onboardingService.chooseCreatorType({
      creatorType: "organization",
      organizationName: organizationDetails.name.trim(),
      organizationType: organizationDetails.organizationType,
    });

    await onboardingService.updateContentInfo({
      category: organizationDetails.category,
      contentDescription: organizationDetails.content.trim(),
      genres: [],
    });

    await onboardingService.updateOrganizationDetails({
      organizationName: organizationDetails.name.trim(),
      category: organizationDetails.category,
      about: organizationDetails.about.trim(),
      contentDescription: organizationDetails.content.trim(),
      organizationLogo: organizationLogo || null,
    });

    const response = await onboardingService.complete();

    if (response?.data?.user) {
      onboardingService.saveUser(response.data.user);
    }

    localStorage.setItem(
      "creatorSetup",
      JSON.stringify({
        type: "organization",
        logo: organizationLogo || "",
        name: organizationDetails.name.trim(),
        organizationType: organizationDetails.organizationType,
        category: organizationDetails.category,
        about: organizationDetails.about.trim(),
        content: organizationDetails.content.trim(),
      })
    );
  };

  const handleDetailsContinue = async () => {
    if (!detailsAreComplete() || saving) {
      return;
    }

    try {
      setSaving(true);

      if (creatorType === "individual") {
        await finishIndividualSetup();
      } else {
        await finishOrganizationSetup();
      }

      setStep(3);
    } catch (error) {
      setToast({
        open: true,
        type: "error",
        title: "Could not finish creator setup",
        message: error.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (saving) {
      return;
    }

    if (step === 2) {
      setStep(1);
      return;
    }

    if (onBackToRole) {
      onBackToRole();
    }
  };

  if (step === 3) {
    return (
      <div
        id="echoo-main-content"
        role="main"
        tabIndex="-1"
        className="creator-page echoo-onboarding-page"
      >
        <EchoAmbient
          density="low"
          className="echoo-onboarding-ambient"
        />
        <div className="creator-container ready-container">
          <StepProgress
            steps={["Creator Type", "Details", "Ready"]}
            currentStep={3}
          />

          <img
            src={echooLogo}
            alt="Echoo"
            className="creator-logo ready-logo"
          />

          <SuccessState
            title="Your Creator Studio is ready"
            message="Your creator details have been saved to Echoo. You're ready to start creating."
            buttonText="Go to Creator Studio"
            onContinue={() => {
              if (onCreatorReady) {
                onCreatorReady();
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="creator-page">
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

        <div className="creator-container">
          <StepProgress
            steps={["Creator Type", "Details", "Ready"]}
            currentStep={1}
          />

          <img
            src={echooLogo}
            alt="Echoo"
            className="creator-logo"
          />

          <div className="creator-header">
            <h1>How will you create?</h1>

            <p>
              Choose the type of creator account
              <br />
              you want to set up.
            </p>
          </div>

          <div className="creator-type-options">
            <button
              type="button"
              className={`creator-type-card ${
                creatorType === "individual"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setCreatorType("individual")
              }
            >
              <span className="creator-select-circle">
                {creatorType === "individual" && (
                  <span></span>
                )}
              </span>

              <div className="creator-type-icon">
                <FaUser />
              </div>

              <div>
                <h2>Individual</h2>

                <p>
                  Create as yourself using your
                  <br />
                  personal Echoo identity.
                </p>
              </div>
            </button>

            <button
              type="button"
              className={`creator-type-card ${
                creatorType === "organization"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setCreatorType("organization")
              }
            >
              <span className="creator-select-circle">
                {creatorType === "organization" && (
                  <span></span>
                )}
              </span>

              <div className="creator-type-icon">
                <FaBuilding />
              </div>

              <div>
                <h2>Organization / Brand</h2>

                <p>
                  Create for a church, company,
                  <br />
                  media brand, community or organization.
                </p>
              </div>
            </button>
          </div>

          <div className="creator-type-actions">
            <button
              type="button"
              className="creator-back-button"
              onClick={handleBack}
            >
              Back
            </button>

            <LoadingButton
              type="button"
              disabled={!creatorType}
              className={`creator-primary-button ${
                creatorType ? "active" : ""
              }`}
              onClick={handleCreatorTypeContinue}
            >
              Continue
            </LoadingButton>
          </div>
        </div>
      </div>
    );
  }

  if (
    step === 2 &&
    creatorType === "individual"
  ) {
    return (
      <div className="creator-page">
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

        <div className="creator-container details-container">
          <StepProgress
            steps={["Creator Type", "Details", "Ready"]}
            currentStep={2}
          />

          <img
            src={echooLogo}
            alt="Echoo"
            className="creator-logo details-logo"
          />

          <div className="creator-header details-header">
            <h1>Creator details</h1>

            <p>
              Tell us a little about what you'll create.
            </p>
          </div>

          <div className="individual-details">
            <div className="creator-identity-card">
              <div className="creator-avatar">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={displayName}
                    className="creator-avatar-image"
                  />
                ) : (
                  <FaUser />
                )}
              </div>

              <div>
                <h2>{displayName}</h2>
                <p>{username}</p>
              </div>
            </div>

            <div className="creator-field">
              <label>Category</label>

              <div className="select-wrapper">
                <select
                  name="category"
                  value={individualDetails.category}
                  onChange={handleIndividualChange}
                >
                  <option value="">
                    Select a category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>

                <FaChevronDown />
              </div>
            </div>

            <div className="creator-field">
              <label>
                What will you create?
              </label>

              <div className="creator-textarea-wrapper">
                <textarea
                  name="content"
                  placeholder="Tell us about the content you plan to create..."
                  value={individualDetails.content}
                  onChange={handleIndividualChange}
                  maxLength={300}
                />

                <span>
                  {individualDetails.content.length} / 300
                </span>
              </div>
            </div>
          </div>

          <div className="creator-form-actions">
            <button
              type="button"
              className="creator-back-button"
              onClick={handleBack}
              disabled={saving}
            >
              Back
            </button>

            <LoadingButton
              type="button"
              disabled={!detailsAreComplete()}
              loading={saving}
              loadingText="Creating your studio..."
              className={`creator-primary-button ${
                detailsAreComplete()
                  ? "active"
                  : ""
              }`}
              onClick={handleDetailsContinue}
            >
              Continue
            </LoadingButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="creator-page">
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

      <div className="creator-container details-container">
        <StepProgress
          steps={["Creator Type", "Details", "Ready"]}
          currentStep={2}
        />

        <img
          src={echooLogo}
          alt="Echoo"
          className="creator-logo details-logo"
        />

        <div className="creator-header details-header">
          <h1>Organization details</h1>

          <p>
            Set up your organization's creator identity.
          </p>
        </div>

        <div className="organization-details">
          <div className="organization-upload-section">
            <label
              htmlFor="organization-logo"
              className="organization-upload"
            >
              {organizationLogo ? (
                <img
                  src={organizationLogo}
                  alt="Organization"
                />
              ) : (
                <>
                  <FaUpload />
                  <span>Optional</span>
                </>
              )}
            </label>

            <input
              id="organization-logo"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              hidden
            />

            <p>Organization logo</p>
          </div>

          <div className="organization-fields">
            <div className="creator-field">
              <label>
                Organization / Brand Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter organization or brand name"
                value={organizationDetails.name}
                onChange={handleOrganizationChange}
              />
            </div>

            <div className="creator-field">
              <label>
                Organization Type
              </label>

              <div className="select-wrapper">
                <select
                  name="organizationType"
                  value={organizationDetails.organizationType}
                  onChange={handleOrganizationChange}
                >
                  <option value="">
                    Select organization type
                  </option>

                  {organizationTypes.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ))}
                </select>

                <FaChevronDown />
              </div>
            </div>

            <div className="creator-field">
              <label>Category</label>

              <div className="select-wrapper">
                <select
                  name="category"
                  value={organizationDetails.category}
                  onChange={handleOrganizationChange}
                >
                  <option value="">
                    Select a category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>

                <FaChevronDown />
              </div>
            </div>

            <div className="creator-field">
              <label>About</label>

              <textarea
                name="about"
                placeholder="Write a short description about your organization..."
                value={organizationDetails.about}
                onChange={handleOrganizationChange}
                maxLength={300}
              />
            </div>

            <div className="creator-field">
              <label>
                What will you create?
              </label>

              <textarea
                name="content"
                placeholder="Tell us what kind of content or projects you plan to create..."
                value={organizationDetails.content}
                onChange={handleOrganizationChange}
                maxLength={300}
              />
            </div>
          </div>
        </div>

        <div className="creator-form-actions">
          <button
            type="button"
            className="creator-back-button"
            onClick={handleBack}
            disabled={saving}
          >
            Back
          </button>

          <LoadingButton
            type="button"
            disabled={!detailsAreComplete()}
            loading={saving}
            loadingText="Creating your studio..."
            className={`creator-primary-button ${
              detailsAreComplete()
                ? "active"
                : ""
            }`}
            onClick={handleDetailsContinue}
          >
            Continue
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};

export default CreatorSetup;