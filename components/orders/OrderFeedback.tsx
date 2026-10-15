
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageSquareText,
  X,
  LoaderCircle,
  CheckCircle2,
  Send,
} from "lucide-react";

type Props = {
  orderNumber: string;
  initialDelivered: boolean;
  initialSubmitted: boolean;
};

const questions = [
  {
    key: "overallExperience",
    title: "How would you rate your overall shopping experience?",
    options: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
  },
  {
    key: "productQuality",
    title: "How satisfied are you with the quality of the product you received?",
    options: [
      "Very Satisfied",
      "Satisfied",
      "Neutral",
      "Dissatisfied",
      "Very Dissatisfied",
    ],
  },
  {
    key: "deliveryExperience",
    title: "How satisfied are you with the delivery service?",
    options: [
      "Very Satisfied",
      "Satisfied",
      "Neutral",
      "Dissatisfied",
      "Very Dissatisfied",
    ],
  },
  {
    key: "packagingQuality",
    title: "How would you rate the packaging of your order?",
    options: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
  },
  {
    key: "valueForMoney",
    title: "How would you rate the value for money of your purchase?",
    options: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
  },
] as const;

type AnswerKey = (typeof questions)[number]["key"];
type FeedbackAnswers = Partial<Record<AnswerKey, string>>;

export default function OrderFeedback({
  orderNumber,
  initialDelivered,
  initialSubmitted,
}: Props) {
  const [delivered, setDelivered] = useState(initialDelivered);
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<FeedbackAnswers>({});
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const apiUrl = `/api/orders/${encodeURIComponent(orderNumber)}/feedback`;

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch(apiUrl, {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();
      setDelivered(Boolean(data.delivered));
      setSubmitted(Boolean(data.submitted));
    } catch {
      // Keep the last known state if the network is temporarily unavailable.
    }
  }, [apiUrl]);

  useEffect(() => {
    setDelivered(initialDelivered);
    setSubmitted(initialSubmitted);
    setOpen(false);
    setAnswers({});
    setAttempted(false);
    setError("");
    setSuccess(false);
  }, [orderNumber, initialDelivered, initialSubmitted]);

  useEffect(() => {
    void refreshStatus();

    const interval = window.setInterval(() => {
      void refreshStatus();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [refreshStatus]);

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      modalRef.current?.focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [open, saving]);

  function closeModal() {
    if (saving) return;
    setOpen(false);
    setAttempted(false);
    setError("");
    // Keep answers if the customer closes and later reopens the modal.
  }

  function selectAnswer(key: AnswerKey, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    setError("");

    const complete = questions.every((question) => answers[question.key]);

    if (!complete) {
      setError("Please answer all five questions before submitting.");
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setSubmitted(true);
          setOpen(false);
          setAnswers({});
          setAttempted(false);
          return;
        }

        throw new Error(data.message || "Unable to submit your feedback.");
      }

      setOpen(false);
      setSubmitted(true);
      setAnswers({});
      setAttempted(false);
      setSuccess(true);

      window.setTimeout(() => setSuccess(false), 4500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!delivered || submitted) {
    return success ? (
      <div className="feedback-success-toast" role="status">
        <CheckCircle2 size={21} />
        <span>Thank you! Your feedback has been submitted.</span>
      </div>
    ) : null;
  }

  return (
    <>
      <button
        type="button"
        className="order-feedback-float"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Give feedback for order ${orderNumber}`}
      >
        <span className="feedback-float-icon">
          <MessageSquareText size={23} />
        </span>

        <span className="feedback-float-copy">
          <strong>Share Your Feedback</strong>
          <span>Your order has been delivered! Tell us about your experience.</span>
          <span className="feedback-float-cta">
            Give Feedback <span aria-hidden="true">→</span>
          </span>
        </span>
      </button>

      {open && (
        <div
          className="order-feedback-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeModal();
            }
          }}
        >
          <section
            ref={modalRef}
            className="order-feedback-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            aria-describedby="feedback-modal-description"
            tabIndex={-1}
          >
            <header className="feedback-modal-header">
              <div className="feedback-modal-icon">
                <MessageSquareText size={23} />
              </div>

              <button
                type="button"
                className="feedback-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close feedback dialog"
              >
                <X size={21} />
              </button>

              <div className="feedback-eyebrow">AURORA CUSTOMER EXPERIENCE</div>
              <h2 id="feedback-modal-title">Order Feedback</h2>
              <p id="feedback-modal-description">
                Help us improve your shopping experience.
              </p>
              <div className="feedback-order-number">
                Order <strong>#{orderNumber}</strong>
              </div>
            </header>

            <form className="feedback-form" onSubmit={submitFeedback} noValidate>
              <div className="feedback-progress">
                <span>5 quick questions</span>
                <span>
                  {questions.filter((q) => answers[q.key]).length} of 5 answered
                </span>
              </div>

              <div className="feedback-progress-track">
                <span
                  style={{
                    width: `${
                      (questions.filter((q) => answers[q.key]).length / 5) * 100
                    }%`,
                  }}
                />
              </div>

              {questions.map((question, index) => {
                const missing = attempted && !answers[question.key];

                return (
                  <fieldset
                    key={question.key}
                    className={`feedback-question ${missing ? "has-error" : ""}`}
                    aria-describedby={
                      missing ? `${question.key}-error` : undefined
                    }
                  >
                    <legend>
                      <span className="feedback-question-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {question.title}
                      <span className="feedback-required" aria-label="Required">
                        *
                      </span>
                    </legend>

                    <div className="feedback-options">
                      {question.options.map((option) => (
                        <label
                          key={option}
                          className={`feedback-option ${
                            answers[question.key] === option ? "selected" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name={question.key}
                            value={option}
                            checked={answers[question.key] === option}
                            onChange={() =>
                              selectAnswer(question.key, option)
                            }
                            required
                          />
                          <span className="feedback-radio" />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>

                    {missing && (
                      <div
                        className="feedback-question-error"
                        id={`${question.key}-error`}
                      >
                        Please select one answer.
                      </div>
                    )}
                  </fieldset>
                );
              })}

              {error && (
                <div className="feedback-error-banner" role="alert">
                  {error}
                </div>
              )}

              <div className="feedback-modal-actions">
                <button
                  type="button"
                  className="feedback-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="feedback-submit-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={17} className="feedback-spinner" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
