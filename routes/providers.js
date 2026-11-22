
const express = require("express");
const router = express.Router();

const providers = [
  {
    id: "openai",
    name: "OpenAI / ChatGPT",
    description: "Review data controls and request data access or account deletion.",
    policyUrl: "https://openai.com/policies/privacy-policy/",
    privacyUrl: "https://privacy.openai.com/",
    settingsUrl: "https://chatgpt.com/",
    actions: [
      {
        id: "review-settings",
        label: "Review account data controls",
        url: "https://chatgpt.com/"
      },
      {
        id: "access-data",
        label: "Request a copy of my data",
        url: "https://privacy.openai.com/"
      },
      {
        id: "delete-account",
        label: "Request account deletion",
        url: "https://privacy.openai.com/"
      }
    ]
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Review Gemini activity and Google Account privacy settings.",
    policyUrl: "https://policies.google.com/privacy",
    privacyUrl: "https://support.google.com/gemini/answer/13594961",
    settingsUrl: "https://myactivity.google.com/product/gemini",
    actions: [
      {
        id: "review-activity",
        label: "Review or delete Gemini activity",
        url: "https://myactivity.google.com/product/gemini"
      },
      {
        id: "review-google-privacy",
        label: "Review Google Account privacy",
        url: "https://myaccount.google.com/data-and-privacy"
      }
    ]
  },
  {
    id: "claude",
    name: "Anthropic / Claude",
    description: "Review privacy guidance, export data, or learn about account deletion.",
    policyUrl: "https://www.anthropic.com/legal/privacy",
    privacyUrl: "https://privacy.anthropic.com/",
    settingsUrl: "https://claude.ai/",
    actions: [
      {
        id: "review-settings",
        label: "Open Claude account settings",
        url: "https://claude.ai/"
      },
      {
        id: "export-data",
        label: "Learn how to export my data",
        url: "https://support.anthropic.com/en/articles/9450526-how-can-i-export-my-claude-data"
      },
      {
        id: "delete-account",
        label: "Learn how to delete my account",
        url: "https://support.anthropic.com/en/articles/9028421-how-can-i-delete-my-claude-ai-account"
      }
    ]
  }
];

router.get("/", (req, res) => {
  res.json({ providers });
});

router.get("/:providerId", (req, res) => {
  const provider = providers.find(
    item => item.id === req.params.providerId
  );

  if (!provider) {
    return res.status(404).json({ error: "Provider not found" });
  }

  res.json({ provider });
});

module.exports = router;
