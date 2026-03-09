import { useState } from "react";

const features = [
  {
    id: 1,
    title: "Emotion & Tone Detector",
    icon: "🎭",
    tag: "Hearing Impaired",
    tagColor: "#F97316",
    problem: "Deaf and hard-of-hearing users miss emotional cues in spoken conversations — sarcasm, excitement, fear — conveyed through tone, not just words.",
    how: "Uses the Web Audio API to analyze pitch, cadence, and amplitude in real time. A lightweight ML model (TensorFlow.js) classifies the speaker's emotional state and overlays a live emoji/label on screen during calls or videos.",
    tech: ["Web Audio API", "TensorFlow.js", "MediaStream API", "WebRTC"],
    why: "Restores emotional context in conversations, making social interactions far more equitable for deaf users.",
    color: "#FFF7ED",
    border: "#F97316"
  },
  {
    id: 2,
    title: "Smart Scene Describer",
    icon: "🌄",
    tag: "Visually Impaired",
    tagColor: "#8B5CF6",
    problem: "Blind users can't perceive their surroundings through photos or live camera feeds, limiting spatial awareness and independence.",
    how: "Captures camera frames and sends them to a vision AI (BLIP-2 or GPT-4o Vision via API). Returns a natural-language, priority-ordered description spoken aloud using the SpeechSynthesis API — foreground first, then background hazards.",
    tech: ["WebRTC Camera API", "Vision AI API", "SpeechSynthesis API", "React"],
    why: "Enables blind users to 'see' their environment contextually — not just label objects but understand the scene.",
    color: "#F5F3FF",
    border: "#8B5CF6"
  },
  {
    id: 3,
    title: "Cognitive Load Simplifier",
    icon: "🧩",
    tag: "Reading Difficulties",
    tagColor: "#EC4899",
    problem: "People with dyslexia, ADHD, or cognitive disabilities struggle with dense text, complex sentences, and information overload.",
    how: "A browser extension / in-app reader strips any webpage or pasted text and rewrites it at a configurable reading level (Grade 3–8) using an LLM. Displays text in dyslexia-friendly fonts (OpenDyslexic), increased line spacing, and colored overlays.",
    tech: ["Claude / GPT API", "CSS Custom Properties", "Readability.js", "OpenDyslexic font"],
    why: "Transforms inaccessible content into something understandable, promoting independence in reading news, documents, and forms.",
    color: "#FDF2F8",
    border: "#EC4899"
  },
  {
    id: 4,
    title: "Hazard Alert System",
    icon: "⚠️",
    tag: "Visually Impaired",
    tagColor: "#8B5CF6",
    problem: "Visually impaired users navigating unfamiliar spaces face real physical danger from obstacles, wet floors, steps, and moving objects.",
    how: "Uses the device camera and a real-time object detection model (COCO-SSD via TensorFlow.js) to detect hazards in the path. Prioritizes proximity using bounding box size and triggers directional haptic/audio alerts: 'Obstacle — 2 feet, left side.'",
    tech: ["TensorFlow.js (COCO-SSD)", "Web Vibration API", "SpeechSynthesis API", "WebGL"],
    why: "Acts as a lightweight navigation co-pilot, significantly reducing risk of injury in daily movement.",
    color: "#F5F3FF",
    border: "#8B5CF6"
  },
  {
    id: 5,
    title: "Sign Language Interpreter",
    icon: "🤟",
    tag: "Hearing Impaired",
    tagColor: "#F97316",
    problem: "Real-time sign language is inaccessible to hearing people, and sign language interpreters are expensive and not always available.",
    how: "Uses MediaPipe Hands (via TensorFlow.js) to track hand landmarks from the webcam. A trained gesture classification model maps sequences of hand poses to ASL/BSL phrases and displays translated text (and optionally speaks it aloud).",
    tech: ["MediaPipe Hands", "TensorFlow.js", "WebRTC", "SpeechSynthesis API"],
    why: "Bridges the communication gap between signing and non-signing individuals without requiring a human interpreter.",
    color: "#FFF7ED",
    border: "#F97316"
  },
  {
    id: 6,
    title: "Gaze-Controlled Interface",
    icon: "👁️",
    tag: "Motor Impaired",
    tagColor: "#10B981",
    problem: "People with severe motor disabilities (ALS, quadriplegia) cannot use keyboards or touchscreens, cutting them off from digital independence.",
    how: "Uses WebGazer.js to track eye gaze via the front camera. Maps gaze coordinates to UI elements with dwell-click activation (stare for 1.5 seconds = click). Includes a floating on-screen keyboard navigable entirely by eyes.",
    tech: ["WebGazer.js", "React", "Canvas API", "requestAnimationFrame"],
    why: "Unlocks complete device control using only eye movement — transforming a screen into an accessible interface for people with no limb function.",
    color: "#ECFDF5",
    border: "#10B981"
  },
  {
    id: 7,
    title: "Medicine & Label Reader",
    icon: "💊",
    tag: "Visually Impaired / Elderly",
    tagColor: "#06B6D4",
    problem: "Elderly and visually impaired users struggle to read small text on medicine bottles, food labels, and packaging — a serious safety risk.",
    how: "Captures a photo of the label, runs it through a vision AI to extract text, then uses NLP to identify: drug name, dosage, warnings, and expiry date. Reads the critical information aloud in order of safety priority.",
    tech: ["Camera API", "Vision AI / Tesseract.js", "Claude API", "SpeechSynthesis"],
    why: "Prevents medication errors and promotes safe independent living — one of the most critical daily safety challenges for blind and elderly users.",
    color: "#ECFEFF",
    border: "#06B6D4"
  },
  {
    id: 8,
    title: "Live Caption Translator",
    icon: "🌐",
    tag: "Hearing Impaired",
    tagColor: "#F97316",
    problem: "Deaf users who are also non-native speakers face double barriers: no audio AND captions in a foreign language they can't understand.",
    how: "Pipes real-time speech through the Web Speech API for transcription, then instantly translates via a translation API (LibreTranslate or DeepL). Renders styled captions on screen with speaker identification using voice fingerprinting.",
    tech: ["Web Speech API", "LibreTranslate API", "React", "Web Audio API"],
    why: "Removes the dual barrier of deafness + language, enabling deaf immigrants or travelers to fully participate in conversations.",
    color: "#FFF7ED",
    border: "#F97316"
  },
  {
    id: 9,
    title: "Tremor-Compensating Input",
    icon: "✋",
    tag: "Motor Impaired / Elderly",
    tagColor: "#10B981",
    problem: "People with Parkinson's disease or essential tremor produce erratic pointer/touch movements, making precise UI interaction nearly impossible.",
    how: "Intercepts raw pointer events and applies a Kalman filter or moving-average smoothing algorithm to stabilize the path in real time. Adds an optional sticky target zone that magnetically snaps to nearby interactive elements.",
    tech: ["Pointer Events API", "Custom JS Kalman Filter", "CSS snap targets", "React"],
    why: "Dramatically improves usability for millions of tremor-affected users without requiring specialized hardware.",
    color: "#ECFDF5",
    border: "#10B981"
  },
  {
    id: 10,
    title: "Ambient Sound Visualizer",
    icon: "🔔",
    tag: "Hearing Impaired",
    tagColor: "#F97316",
    problem: "Deaf users miss critical ambient sounds: doorbells, fire alarms, crying babies, car horns — sounds that carry safety-critical information.",
    how: "Runs the microphone feed through a pre-trained audio classification model (YAMNet via TensorFlow.js). Classifies incoming sounds in real time and renders prominent on-screen visual + haptic alerts with the sound type and urgency level.",
    tech: ["Web Audio API", "TensorFlow.js (YAMNet)", "Web Vibration API", "Service Workers"],
    why: "Acts as a 24/7 environmental awareness layer, addressing a huge safety gap for deaf users living independently.",
    color: "#FFF7ED",
    border: "#F97316"
  },
  {
    id: 11,
    title: "Voice Shortcut Macros",
    icon: "🎙️",
    tag: "Elderly / Motor Impaired",
    tagColor: "#10B981",
    problem: "Elderly or motor-impaired users find multi-step digital tasks (sending an email, calling a contact, setting a reminder) overwhelming or physically difficult.",
    how: "Lets users record custom voice commands mapped to multi-step action sequences. 'Call my daughter' → opens contacts → finds 'Sarah' → initiates call. Uses Web Speech API for recognition and a macro engine built in React/Node.",
    tech: ["Web Speech API", "React", "IndexedDB", "Contacts API / Intent links"],
    why: "Collapses complex multi-step tasks into a single spoken phrase, empowering elderly users to operate independently.",
    color: "#ECFDF5",
    border: "#10B981"
  },
  {
    id: 12,
    title: "Contextual Form Assistant",
    icon: "📋",
    tag: "Reading Difficulties / Elderly",
    tagColor: "#EC4899",
    problem: "Government forms, medical intake forms, and insurance documents are notoriously complex — a major barrier for people with cognitive disabilities or limited literacy.",
    how: "Scans or imports any form. An LLM analyzes each field and generates plain-language explanations read aloud on focus. Users can answer questions verbally (Speech-to-Text), and the assistant auto-fills the form fields.",
    tech: ["Claude API", "PDF.js", "Web Speech API", "Autofill APIs"],
    why: "Transforms bureaucratic processes from exclusionary to accessible, enabling independent completion of critical life documents.",
    color: "#FDF2F8",
    border: "#EC4899"
  },
  {
    id: 13,
    title: "Personal Navigation Memory",
    icon: "🗺️",
    tag: "Visually Impaired / Cognitive",
    tagColor: "#8B5CF6",
    problem: "People with cognitive impairments or vision loss struggle to memorize routes in familiar environments like hospitals, offices, or shopping centers.",
    how: "User walks a route once while the app records GPS + compass + step-count data. The route is stored as a named memory ('To the pharmacy'). On replay, the app gives step-by-step turn-by-turn audio instructions based purely on motion sensors — no live internet needed.",
    tech: ["Geolocation API", "DeviceOrientation API", "IndexedDB", "SpeechSynthesis API"],
    why: "Builds a personal indoor/outdoor navigation memory that works offline and adapts to how each individual moves.",
    color: "#F5F3FF",
    border: "#8B5CF6"
  },
  {
    id: 14,
    title: "Focus & Distraction Shield",
    icon: "🛡️",
    tag: "ADHD / Cognitive",
    tagColor: "#EC4899",
    problem: "People with ADHD, autism, or anxiety are overwhelmed by visually busy or over-stimulating interfaces, making digital tasks extremely difficult.",
    how: "A browser-level overlay that dims everything except the current task element. Strips animations, auto-plays, and pop-ups using MutationObserver. Adds a Pomodoro-style task timer with gentle audio cues and a 'focus score' tracker.",
    tech: ["MutationObserver API", "CSS Overlay", "Web Audio API", "Browser Extension APIs"],
    why: "Transforms the chaotic web into a calm, focused workspace — essential for neurodivergent users who are otherwise unable to engage online.",
    color: "#FDF2F8",
    border: "#EC4899"
  },
  {
    id: 15,
    title: "Fatigue-Aware UI Adapter",
    icon: "🌙",
    tag: "Elderly / Chronic Illness",
    tagColor: "#06B6D4",
    problem: "People with chronic fatigue, MS, lupus, or cancer treatment side effects have highly variable daily capacity — some hours they can engage fully, others not at all.",
    how: "Tracks interaction patterns (typing speed, scroll velocity, pause frequency) over time to build a fatigue baseline. When degraded performance is detected, the UI automatically simplifies: larger buttons, shorter text, reduced steps, and switches to voice-first mode.",
    tech: ["Pointer Events API", "Input Event timing", "localStorage baseline model", "React Context"],
    why: "Adapts the interface to the user's real-time capacity rather than forcing them to adapt to the interface — a paradigm shift in inclusive design.",
    color: "#ECFEFF",
    border: "#06B6D4"
  }
];

const tagColors = {
  "Hearing Impaired": { bg: "#FFF3E8", text: "#C2410C" },
  "Visually Impaired": { bg: "#F3EEFF", text: "#6D28D9" },
  "Motor Impaired": { bg: "#E8FDF5", text: "#065F46" },
  "Motor Impaired / Elderly": { bg: "#E8FDF5", text: "#065F46" },
  "Reading Difficulties": { bg: "#FEF0F7", text: "#9D174D" },
  "Elderly / Motor Impaired": { bg: "#E8FDF5", text: "#065F46" },
  "Elderly / Chronic Illness": { bg: "#E0FAFA", text: "#155E75" },
  "Reading Difficulties / Elderly": { bg: "#FEF0F7", text: "#9D174D" },
  "ADHD / Cognitive": { bg: "#FEF0F7", text: "#9D174D" },
  "Visually Impaired / Elderly": { bg: "#E0FAFA", text: "#155E75" },
  "Visually Impaired / Cognitive": { bg: "#F3EEFF", text: "#6D28D9" },
};

const filterOptions = ["All", "Visually Impaired", "Hearing Impaired", "Motor Impaired", "Elderly", "Reading Difficulties", "ADHD / Cognitive"];

export default function App() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");
  const [hoveredId, setHoveredId] = useState(null);

  const filtered = features.filter(f =>
    filter === "All" || f.tag.includes(filter.replace(" / Cognitive", "").replace("ADHD / ", ""))
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#F1F5F9",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.8) 100%)",
        borderBottom: "1px solid rgba(148,163,184,0.15)",
        padding: "40px 40px 32px",
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 6 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "12px",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "0 0 20px rgba(99,102,241,0.4)"
            }}>♿</div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#94A3B8", textTransform: "uppercase", fontFamily: "system-ui" }}>Feature Roadmap</div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em" }}>
                Accessibility Helper App
              </h1>
            </div>
          </div>
          <p style={{ margin: "12px 0 0", color: "#94A3B8", fontSize: 15, fontFamily: "system-ui", fontWeight: 400 }}>
            15 innovative features · Click any card to explore details
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px 60px" }}>
        {/* Filter Bar */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {filterOptions.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "7px 16px",
                borderRadius: 100,
                border: filter === f ? "1.5px solid #6366F1" : "1.5px solid rgba(148,163,184,0.2)",
                background: filter === f ? "linear-gradient(135deg, #4F46E5, #7C3AED)" : "rgba(30,41,59,0.6)",
                color: filter === f ? "#fff" : "#94A3B8",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "system-ui",
                fontWeight: filter === f ? 600 : 400,
                transition: "all 0.2s",
                boxShadow: filter === f ? "0 0 12px rgba(99,102,241,0.35)" : "none",
              }}
            >{f}</button>
          ))}
          <span style={{ marginLeft: "auto", color: "#475569", fontSize: 13, fontFamily: "system-ui", alignSelf: "center" }}>
            {filtered.length} feature{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 20,
        }}>
          {filtered.map(f => (
            <div
              key={f.id}
              onClick={() => setSelected(selected?.id === f.id ? null : f)}
              onMouseEnter={() => setHoveredId(f.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: hoveredId === f.id || selected?.id === f.id
                  ? "rgba(30,41,59,0.95)"
                  : "rgba(15,23,42,0.7)",
                border: selected?.id === f.id
                  ? `2px solid ${f.border}`
                  : hoveredId === f.id
                    ? `1.5px solid ${f.border}55`
                    : "1.5px solid rgba(148,163,184,0.1)",
                borderRadius: 16,
                padding: "24px",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                transform: hoveredId === f.id ? "translateY(-3px)" : "none",
                boxShadow: selected?.id === f.id
                  ? `0 0 30px ${f.border}30, 0 8px 32px rgba(0,0,0,0.4)`
                  : hoveredId === f.id
                    ? "0 8px 24px rgba(0,0,0,0.3)"
                    : "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              {/* Card Top Row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: `${f.border}18`,
                  border: `1px solid ${f.border}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24,
                }}>
                  {f.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 11, fontFamily: "system-ui", fontWeight: 600,
                      letterSpacing: "0.05em", color: "#475569",
                    }}>#{String(f.id).padStart(2, "0")}</span>
                    <span style={{
                      fontSize: 11, fontFamily: "system-ui", fontWeight: 600,
                      padding: "2px 9px", borderRadius: 100,
                      background: `${f.border}20`,
                      color: f.border,
                      border: `1px solid ${f.border}30`,
                    }}>{f.tag}</span>
                  </div>
                  <h3 style={{
                    margin: 0, fontSize: 17, fontWeight: 700,
                    color: "#F1F5F9", letterSpacing: "-0.01em",
                    lineHeight: 1.25,
                  }}>{f.title}</h3>
                </div>
              </div>

              {/* Problem preview */}
              <p style={{
                margin: 0, fontSize: 13.5, color: "#94A3B8",
                lineHeight: 1.6, fontFamily: "system-ui",
                display: "-webkit-box",
                WebkitLineClamp: selected?.id === f.id ? "unset" : 2,
                WebkitBoxOrient: "vertical",
                overflow: selected?.id === f.id ? "visible" : "hidden",
              }}>
                {f.problem}
              </p>

              {/* Expanded Detail */}
              {selected?.id === f.id && (
                <div style={{ marginTop: 20, borderTop: `1px solid ${f.border}25`, paddingTop: 20 }}>
                  
                  <Section label="⚙️ How It Works" color={f.border}>
                    {f.how}
                  </Section>

                  <Section label="💡 Why It Matters" color={f.border}>
                    {f.why}
                  </Section>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, fontFamily: "system-ui", fontWeight: 700, letterSpacing: "0.1em", color: "#475569", textTransform: "uppercase", marginBottom: 8 }}>
                      🛠 Technologies
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {f.tech.map(t => (
                        <span key={t} style={{
                          padding: "4px 12px",
                          background: `${f.border}15`,
                          border: `1px solid ${f.border}30`,
                          borderRadius: 100,
                          fontSize: 12,
                          color: f.border,
                          fontFamily: "system-ui",
                          fontWeight: 500,
                        }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Expand indicator */}
              <div style={{
                marginTop: 14,
                fontSize: 12,
                color: f.border,
                fontFamily: "system-ui",
                display: "flex",
                alignItems: "center",
                gap: 4,
                opacity: 0.7,
              }}>
                {selected?.id === f.id ? "▲ Collapse" : "▼ Expand details"}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div style={{
          marginTop: 48,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 16,
        }}>
          {[
            { label: "Total Features", value: "15", icon: "✦" },
            { label: "User Groups", value: "6", icon: "♿" },
            { label: "Web Technologies", value: "20+", icon: "⚡" },
            { label: "Real-world Problems", value: "15", icon: "🎯" },
          ].map(s => (
            <div key={s.label} style={{
              background: "rgba(30,41,59,0.5)",
              border: "1px solid rgba(148,163,184,0.1)",
              borderRadius: 12,
              padding: "20px 24px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.03em" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#64748B", fontFamily: "system-ui", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ label, color, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 11, fontFamily: "system-ui", fontWeight: 700,
        letterSpacing: "0.1em", color: "#475569",
        textTransform: "uppercase", marginBottom: 6,
      }}>{label}</div>
      <p style={{
        margin: 0, fontSize: 13.5, color: "#CBD5E1",
        lineHeight: 1.65, fontFamily: "system-ui",
      }}>{children}</p>
    </div>
  );
}
