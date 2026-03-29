"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
} from "react";

import {
  DEFAULT_PROFILE,
  SUGGESTED_ACTIONS,
  buildStarterReply,
  getActionById,
  type UserProfile,
} from "@/lib/assistant-config";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  attachments?: Attachment[];
};

type Attachment = {
  id: string;
  dataUrl: string;
  mimeType: string;
  name: string;
};

const STORAGE_KEY = "assistant-for-mom-profile";

const TRUSTED_TOOLS = [
  {
    name: "Grammarly",
    description: "Writing help for email, documents, and quick proofreading in the browser.",
    href: "https://www.grammarly.com/browser",
  },
  {
    name: "uBlock Origin",
    description: "Cuts down clutter, intrusive ads, and many scammy-looking pages.",
    href: "https://ublockorigin.com/",
  },
  {
    name: "Bitwarden",
    description: "A simple password manager so passwords do not need to live in notes or memory.",
    href: "https://bitwarden.com/",
  },
  {
    name: "Snipping Tool",
    description: "Built into Windows and perfect for sharing a screenshot when something looks wrong.",
    href: "https://support.microsoft.com/en-us/windows/use-snipping-tool-to-capture-screenshots-00246869-1843-655f-f220-97299b865f6b",
  },
];

const WINDOWS_SHORTCUTS = [
  ["Windows + Shift + S", "Take a screenshot, then press Ctrl + V here to paste it."],
  ["Ctrl + V", "Paste a screenshot or copied text into chat."],
  ["Ctrl + C", "Copy selected text."],
  ["Ctrl + Z", "Undo the last action."],
  ["Ctrl + Y", "Redo something you just undid."],
  ["Ctrl + F", "Find a word on a page or in a document."],
  ["Alt + Tab", "Switch between open windows."],
  ["Windows + V", "Open clipboard history."],
  ["Ctrl + Shift + T", "Reopen the last browser tab you closed."],
  ["Ctrl + L", "Jump to the browser address bar."],
];

const WEEKEND_IDEAS = [
  "Plan a winery afternoon and ask me to map out a simple route with food nearby.",
  "Find a plant nursery or garden center and make a little outing of it.",
  "Look for fruit-picking options and have me help compare drive times and hours.",
  "Build a scenic day plan with water views, coffee, and a relaxed dinner stop.",
];

const CAT_IMAGE_PATHS = [
  "/cats/cat-01.jpeg",
  "/cats/cat-02.jpeg",
  "/cats/cat-03.jpeg",
  "/cats/cat-04.jpeg",
  "/cats/cat-05.jpeg",
  "/cats/cat-06.jpeg",
  "/cats/cat-07.jpeg",
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "intro",
    role: "assistant",
    content:
      "Hi Christina. I can help you use AI in a calm, practical way for everyday work and life.\n\nChoose one of the ideas below, or type what you want to do in your own words.",
  },
];

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCatCardOpen, setIsCatCardOpen] = useState(true);
  const [catImageIndex, setCatImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<UserProfile>;
      setProfile({
        ...DEFAULT_PROFILE,
        ...parsed,
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (!CAT_IMAGE_PATHS.length) {
      return;
    }

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff =
      now.getTime() -
      startOfYear.getTime() +
      (startOfYear.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
    const dayOfYear = Math.floor(diff / 86400000);

    setCatImageIndex(dayOfYear % CAT_IMAGE_PATHS.length);
  }, []);

  const catOfTheDayPath = useMemo(() => {
    if (!CAT_IMAGE_PATHS.length) {
      return null;
    }

    return CAT_IMAGE_PATHS[catImageIndex] ?? CAT_IMAGE_PATHS[0];
  }, [catImageIndex]);

  function appendMessage(role: Message["role"], content: string) {
    const nextMessage: Message = {
      id: `${role}-${crypto.randomUUID()}`,
      role,
      content,
    };

    setMessages((current) => [...current, nextMessage]);
  }

  async function fileToAttachment(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });

    return {
      id: crypto.randomUUID(),
      dataUrl,
      mimeType: file.type || "image/png",
      name: file.name,
    } satisfies Attachment;
  }

  async function addFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

    if (!imageFiles.length) {
      setError("Please upload or paste an image file.");
      return;
    }

    try {
      const nextAttachments = await Promise.all(imageFiles.map((file) => fileToAttachment(file)));
      setAttachments((current) => [...current, ...nextAttachments].slice(0, 4));
      setError(null);
    } catch (attachmentError) {
      setError(
        attachmentError instanceof Error
          ? attachmentError.message
          : "Something went wrong while reading the image.",
      );
    }
  }

  async function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const clipboardItems = Array.from(event.clipboardData.items);
    const imageFiles = clipboardItems
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (!imageFiles.length) {
      return;
    }

    event.preventDefault();
    await addFiles(imageFiles);
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  }

  function handlePickAction(actionId: string) {
    const action = getActionById(actionId);

    if (!action) {
      return;
    }

    setSelectedActionId(actionId);
    setError(null);
    appendMessage("assistant", buildStarterReply(action, profile));
    setDraft(action.examplePrompt);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = draft.trim();

    if ((!trimmed && attachments.length === 0) || isLoading) {
      return;
    }

    const nextMessages = [
      ...messages,
      {
        id: `user-${crypto.randomUUID()}`,
        role: "user" as const,
        content: trimmed,
        attachments,
      },
    ];

    setMessages(nextMessages);
    setDraft("");
    setAttachments([]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content, attachments: messageAttachments }) => ({
            role,
            content,
            attachments: messageAttachments,
          })),
          selectedActionId,
          profile,
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.error || "The assistant could not answer right now.");
      }

      startTransition(() => {
        appendMessage("assistant", data.reply as string);
      });
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "The assistant could not answer right now.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="page-grid">
        <section className="main-stack">
          <div className="hero-card">
            <div className="eyebrow">Christina&apos;s premium assistant desk</div>
            <h1 className="hero-title">A calmer way to run the day.</h1>
            <p className="hero-copy">
              Master Josh gave me a very specific assignment: help Christina with real work, make
              technology less annoying, keep the tone smart and warm, and never sound
              condescending.
            </p>
            <div className="hero-actions">
              <button className="pill" type="button" onClick={() => handlePickAction("write-email")}>
                Start with email help
              </button>
              <button className="pill secondary" type="button" onClick={() => handlePickAction("learn-ai")}>
                Learn how to prompt
              </button>
            </div>
          </div>

          <div className="hero-card intro-card">
            <div className="chat-header">
              <div>
                <h2>First hello</h2>
                <p className="subtle">This is the introduction Christina should see on her desk.</p>
              </div>
            </div>
            <div className="message assistant intro-message">
              <span className="message-meta">Assistant</span>
              Josh made me your robot assistant, which is objectively a strong move.
              {"\n\n"}Here&apos;s the quick version of what he told me: you&apos;re smart, busy, doing
              important administrative work, and you deserve tools that make things clearer instead
              of more frustrating. He also told me I should be warm, useful, and never talk down to
              you.
              {"\n\n"}I can help with writing, organizing, simplifying documents, checking whether
              something online seems trustworthy, and making technology a little less annoying.
              {"\n\n"}To get better at helping over time, I&apos;ll sometimes ask what you do day to
              day, what tools frustrate you, and what information you do not want me to keep.
              {"\n\n"}A few things I&apos;ll ask early on:
              {"\n"}1. What do you currently know about AI?
              {"\n"}2. What do you think I&apos;m best at?
              {"\n"}3. If you want me to tailor things better, would you like to send your resume
              and a simple description of your role and day-to-day work?
            </div>
          </div>

          <div className="chat-shell hero-card">
            <div className="chat-header">
              <div>
                <h2>Suggested starting points</h2>
                <p className="subtle">
                  Christina does not need to guess the perfect wording. Choosing a card teaches by
                  example.
                </p>
              </div>
              {selectedActionId ? (
                <span className="eyebrow">{getActionById(selectedActionId)?.shortLabel}</span>
              ) : null}
            </div>

            <div className="card-grid">
              {SUGGESTED_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className={`action-card ${selectedActionId === action.id ? "active" : ""}`}
                  onClick={() => handlePickAction(action.id)}
                >
                  <span className="action-label">{action.shortLabel}</span>
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="chat-shell hero-card">
            <div className="chat-header">
              <div>
                <h2>Conversation</h2>
                <p className="subtle">
                  A visible running chat. If something is unclear, the assistant should ask, confirm
                  with “Is this right?”, and explain what it will do next.
                </p>
              </div>
            </div>

            <div className="message-list">
              {messages.map((message) => (
                <article key={message.id} className={`message ${message.role}`}>
                  <span className="message-meta">{message.role === "assistant" ? "Assistant" : profile.name}</span>
                  {message.content}
                  {message.attachments?.length ? (
                    <div className="attachment-grid">
                      {message.attachments.map((attachment) => (
                        <img
                          key={attachment.id}
                          className="attachment-preview"
                          src={attachment.dataUrl}
                          alt={attachment.name}
                        />
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}

              {isLoading ? (
                <article className="message assistant">
                  <span className="message-meta">Assistant</span>
                  <div className="loading" aria-label="Assistant is thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </article>
              ) : null}
            </div>

            <form className="composer" onSubmit={handleSubmit}>
              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={(event) => {
                  if (event.target.files?.length) {
                    void addFiles(event.target.files);
                  }

                  event.target.value = "";
                }}
              />
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onPaste={(event) => void handlePaste(event)}
                placeholder="Type a question or describe what you want help doing."
              />
              {attachments.length ? (
                <div className="attachment-grid composer-attachments">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="attachment-tile">
                      <img className="attachment-preview" src={attachment.dataUrl} alt={attachment.name} />
                      <button
                        className="attachment-remove"
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="composer-footer">
                <div className="hint">
                  Tip: plain language is enough. If something on screen is confusing, press Windows
                  + Shift + S, then Ctrl + V here.
                </div>
                <div className="composer-actions">
                  <button
                    className="pill secondary"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Add screenshot
                  </button>
                  <button className="pill" type="submit" disabled={isLoading}>
                    Send
                  </button>
                </div>
              </div>
              {error ? <div className="note">{error}</div> : null}
            </form>
          </div>
        </section>

        <aside className="sidebar-stack">
          <section className="panel">
            <div>
              <h2>Personalization</h2>
              <p className="subtle">
                These settings shape the tone and pacing. Right now they are stored in the browser
                so Christina&apos;s experience feels more personal.
              </p>
            </div>

            <div className="field-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={profile.name}
                onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
              />
            </div>

            <div className="field-group">
              <label htmlFor="goals">Goals</label>
              <textarea
                id="goals"
                value={profile.goals}
                onChange={(event) => setProfile((current) => ({ ...current, goals: event.target.value }))}
                rows={4}
              />
            </div>

            <div className="field-group">
              <label htmlFor="comfortLevel">Comfort level</label>
              <select
                id="comfortLevel"
                value={profile.comfortLevel}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, comfortLevel: event.target.value }))
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="device">Main device</label>
              <select
                id="device"
                value={profile.device}
                onChange={(event) => setProfile((current) => ({ ...current, device: event.target.value }))}
              >
                <option value="laptop">Laptop</option>
                <option value="phone">Phone</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>

            <div className="note">
              This assistant should not reward confident misinformation or overstep into medical
              authority. Its server prompt is written to separate facts, uncertainty, and opinion,
              and to correct gently when the user is mistaken.
            </div>
          </section>

          <section className="panel">
            <div className="chat-header">
              <div>
                <h2>Windows Shortcuts</h2>
                <p className="subtle">A quick cheat sheet for the things Christina will actually use.</p>
              </div>
            </div>
            <div className="shortcut-list">
              {WINDOWS_SHORTCUTS.map(([shortcut, description]) => (
                <div key={shortcut} className="shortcut-row">
                  <div className="shortcut-key">{shortcut}</div>
                  <div className="shortcut-copy">{description}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="chat-header">
              <div>
                <h2>Trusted Tools</h2>
                <p className="subtle">A small list of useful tools that make online work less messy.</p>
              </div>
            </div>
            <div className="tool-list">
              {TRUSTED_TOOLS.map((tool) => (
                <a key={tool.name} className="tool-card" href={tool.href} target="_blank" rel="noreferrer">
                  <strong>{tool.name}</strong>
                  <span>{tool.description}</span>
                </a>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="chat-header">
              <div>
                <h2>Weekend Ideas</h2>
                <p className="subtle">Always visible. Every day deserves an escape plan.</p>
              </div>
            </div>
            <div className="checklist">
              {WEEKEND_IDEAS.map((idea) => (
                <div key={idea} className="check-item">
                  <span className="dot" />
                  <span>{idea}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="chat-header">
              <div>
                <h2>Cat of the Day</h2>
                <p className="subtle">Automatically open on load. Collapsible for serious business mode.</p>
              </div>
              <button
                className="pill secondary compact"
                type="button"
                onClick={() => setIsCatCardOpen((current) => !current)}
              >
                {isCatCardOpen ? "Collapse" : "Open"}
              </button>
            </div>

            {isCatCardOpen ? (
              <div className="cat-card-content">
                <div className="note">
                  Master Josh insisted that emergency morale support remain within immediate reach.
                </div>
                {catOfTheDayPath ? (
                  <div className="cat-image-shell">
                    <img src={catOfTheDayPath} alt="Cat of the Day" className="cat-image" />
                  </div>
                ) : (
                  <div className="note">
                    Drop cat images into <strong>/public/cats</strong> and I&apos;ll rotate one each day.
                  </div>
                )}
                <div className="subtle">Cat of the Day rotates daily and opens automatically on entry.</div>
              </div>
            ) : (
              <div className="subtle">Cat support is standing by when needed.</div>
            )}
          </section>

          <section className="panel">
            <div>
              <h2>How this version behaves</h2>
            </div>

            <div className="checklist">
              <div className="check-item">
                <span className="dot" />
                <span>Shows suggested starting prompts instead of a blank screen.</span>
              </div>
              <div className="check-item">
                <span className="dot" />
                <span>Asks for clarification before acting when the request is not specific enough.</span>
              </div>
              <div className="check-item">
                <span className="dot" />
                <span>Confirms understanding with “Is this right?” before meaningful tasks.</span>
              </div>
              <div className="check-item">
                <span className="dot" />
                <span>Asks permission before rewriting her prompt for better accuracy.</span>
              </div>
              <div className="check-item">
                <span className="dot" />
                <span>Uses healthcare-office examples while avoiding unsafe medical authority.</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
