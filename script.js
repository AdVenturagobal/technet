const yearNode = document.getElementById("year");
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const META_PIXEL_ID = "1458255249041584";
const CAPI_ENDPOINT = "/api/meta-capi";
const sentSectionViews = new Set();

function randomPart() {
  return Math.random().toString(36).slice(2, 10);
}

function buildEventId(prefix) {
  return `${prefix}_${Date.now()}_${randomPart()}`;
}

function isStandardMetaEvent(eventName) {
  return ["PageView", "ViewContent", "Contact", "Lead"].includes(eventName);
}

function sendMetaCapi(eventName, eventId, customData) {
  const payload = {
    eventName,
    eventId,
    pixelId: META_PIXEL_ID,
    eventSourceUrl: window.location.href,
    customData
  };

  fetch(CAPI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}

function trackMeta(eventName, customData = {}, overrideEventId = "") {
  const eventId = overrideEventId || buildEventId(eventName.toLowerCase());

  if (typeof window.fbq === "function") {
    if (isStandardMetaEvent(eventName)) {
      window.fbq("track", eventName, customData, { eventID: eventId });
    } else {
      window.fbq("trackCustom", eventName, customData, { eventID: eventId });
    }
  }

  sendMetaCapi(eventName, eventId, customData);
  return eventId;
}

const contactLinks = document.querySelectorAll("[data-track-contact]");
contactLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const channel = link.getAttribute("data-channel") || "unknown";
    const position = link.getAttribute("data-position") || "unknown";

    trackMeta("Contact", {
      channel,
      position,
      content_category: "contact_click",
      content_name: "siemens_plc_buyback_contact"
    });

    if (channel === "whatsapp" || channel === "telegram") {
      trackMeta("Lead", {
        channel,
        position,
        lead_type: "direct_messaging",
        content_name: "siemens_plc_buyback_lead"
      });
    }
  });
});

const trackableSections = document.querySelectorAll("[data-track-section]");
if ("IntersectionObserver" in window && trackableSections.length > 0) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const sectionName = entry.target.getAttribute("data-track-section");
        if (!sectionName || sentSectionViews.has(sectionName)) return;

        sentSectionViews.add(sectionName);
        trackMeta("ViewContent", {
          section_name: sectionName,
          content_category: "section_view",
          content_name: "siemens_plc_buyback_page"
        });
        sectionObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.35 }
  );

  trackableSections.forEach((node) => sectionObserver.observe(node));
}

const revealNodes = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && revealNodes.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("reveal-visible"));
}
