"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CheckCircle2,
  Clock3,
  Eye,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";

type MessageStatus = "NEW" | "READ" | "RESOLVED";

type CustomerMessage = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
};

type Stats = {
  total: number;
  new: number;
  read: number;
  resolved: number;
};

function formatDate(value: string) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusConfig(status: MessageStatus) {
  switch (status) {
    case "NEW":
      return {
        label: "New",
        icon: <Clock3 size={14} />,
        background: "#b8b381",
        color: "#b86b00",
        border: "#060606",
        gradient: "linear-gradient(135deg, #fff8eb, #fff1d6)",
      };

    case "READ":
      return {
        label: "Read",
        icon: <Eye size={14} />,
        background: "#b5b7d9",
        color: "#2563a8",
        border: "#101111",
        gradient: "linear-gradient(135deg, #eff7ff, #e4f0ff)",
      };

    case "RESOLVED":
      return {
        label: "Resolved",
        icon: <CheckCircle2 size={14} />,
        background: "#5d947d",
        color: "#090c0b",
        border: "#040404",
        gradient: "linear-gradient(135deg, #edfcf5, #def7eb)",
      };
  }
}

export default function CustomerCarePage() {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);

  const [stats, setStats] = useState<Stats>({
    total: 0,
    new: 0,
    read: 0,
    resolved: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedMessage, setSelectedMessage] =
    useState<CustomerMessage | null>(null);

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadMessages = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = new URLSearchParams();

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (statusFilter !== "ALL") {
          params.set("status", statusFilter);
        }

        const response = await fetch(
          `/api/admin/customer-care?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load messages.");
        }

        setMessages(data.messages || []);

        setStats({
          total: Number(data.stats?.total || 0),
          new: Number(data.stats?.new || 0),
          read: Number(data.stats?.read || 0),
          resolved: Number(data.stats?.resolved || 0),
        });
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load customer messages."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMessages();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadMessages]);

  const updateStatus = async (
    id: number,
    status: MessageStatus,
    closeAfterUpdate = false
  ) => {
    try {
      setUpdatingId(id);
      setError("");

      const response = await fetch("/api/admin/customer-care", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update status.");
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );

      setStats((current) => {
        const existing = messages.find((item) => item.id === id);

        if (!existing || existing.status === status) {
          return current;
        }

        return {
          ...current,

          new:
            current.new -
            (existing.status === "NEW" ? 1 : 0) +
            (status === "NEW" ? 1 : 0),

          read:
            current.read -
            (existing.status === "READ" ? 1 : 0) +
            (status === "READ" ? 1 : 0),

          resolved:
            current.resolved -
            (existing.status === "RESOLVED" ? 1 : 0) +
            (status === "RESOLVED" ? 1 : 0),
        };
      });

      setSelectedMessage((current) =>
        current && current.id === id
          ? {
              ...current,
              status,
              updated_at: new Date().toISOString(),
            }
          : current
      );

      if (closeAfterUpdate) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update message status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const visibleMessages = useMemo(() => {
    return messages;
  }, [messages]);

  return (
    <main className="customer-care-page">
      <div className="container-fluid px-3 px-lg-4 py-4">
        <div className="customer-care-wrapper">

          {/* =====================================================
              HEADER
          ====================================================== */}

          <div className="care-hero mb-4">
            <div className="care-hero-glow care-glow-one" />
            <div className="care-hero-glow care-glow-two" />

            <div className="row align-items-center g-4 position-relative">
              <div className="col-lg-8">
                <div className="care-eyebrow">
                  <MessageCircle size={15} />
                  CUSTOMER SUPPORT CENTER
                </div>

                <h1 className="care-title">
                  Customer Care
                </h1>

                <p className="care-description">
                  Manage customer enquiries, support requests and
                  resolutions from one organized workspace.
                </p>

                <div className="care-hero-tags">
                  <span>
                    <span className="care-live-dot" />
                    Support Center
                  </span>

                  <span>
                    <MessageCircle size={14} />
                    Customer Messages
                  </span>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="care-hero-side">
                  <div className="care-hero-icon">
                    <MessageCircle size={30} />
                  </div>

                  <div>
                    <div className="care-hero-side-label">
                      SUPPORT INBOX
                    </div>

                    <div className="care-hero-side-value">
                      {stats.new} new
                    </div>

                    <div className="care-hero-side-text">
                      messages waiting for attention
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              TOP BAR
          ====================================================== */}

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <div className="section-kicker">
                SUPPORT OVERVIEW
              </div>

              <h2 className="section-heading mb-0">
                Message Activity
              </h2>
            </div>

            <button
              type="button"
              onClick={() => loadMessages(true)}
              disabled={refreshing}
              className="care-refresh-button"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "spin-animation" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh Inbox"}
            </button>
          </div>

          {/* =====================================================
              STATS
          ====================================================== */}

          <div className="row g-3 mb-4">
            <StatCard
              title="Total Messages"
              value={stats.total}
              description="All customer enquiries"
              icon={<MessageCircle size={21} />}
              iconBackground="#95b894"
              iconColor="#4f46c5"
              accent="#c3111c"
            />

            <StatCard
              title="New"
              value={stats.new}
              description="Needs attention"
              icon={<Clock3 size={21} />}
              iconBackground="#fff3df"
              iconColor="#c27608"
              accent="#e49a32"
            />

            <StatCard
              title="Read"
              value={stats.read}
              description="Currently reviewed"
              icon={<Eye size={21} />}
              iconBackground="#e8f3ff"
              iconColor="#2474b7"
              accent="#3c91d2"
            />

            <StatCard
              title="Resolved"
              value={stats.resolved}
              description="Successfully handled"
              icon={<CheckCircle2 size={21} />}
              iconBackground="#e8f9f1"
              iconColor="#168052"
              accent="#31a873"
            />
          </div>

          {/* =====================================================
              ERROR
          ====================================================== */}

          {error && (
            <div className="care-error mb-4">
              <div className="care-error-icon">
                !
              </div>

              <div>
                <div className="care-error-title">
                  Something went wrong
                </div>

                <div className="care-error-text">
                  {error}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================
              MAIN CONTENT
          ====================================================== */}

          <div className="care-content-card">

            {/* FILTER HEADER */}

            <div className="care-filter-header">
              <div>
                <div className="section-kicker">
                  CUSTOMER ENQUIRIES
                </div>

                <h3 className="care-table-title">
                  Support Messages
                </h3>

                <p className="care-table-subtitle">
                  Review customer messages and manage their current status.
                </p>
              </div>

              <div className="care-inbox-count">
                <span className="care-count-number">
                  {messages.length}
                </span>

                <span className="care-count-label">
                  visible messages
                </span>
              </div>
            </div>

            {/* FILTER BAR */}

            <div className="care-filter-bar">
              <div className="care-search-wrapper">
                <Search size={18} />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, subject or message..."
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="care-search-clear"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="care-status-select-wrapper">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="care-status-select"
                >
                  <option value="ALL">All Status</option>
                  <option value="NEW">New</option>
                  <option value="READ">Read</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>

            {/* TABLE */}

            {loading ? (
              <div className="care-loading">
                <div className="care-loading-icon">
                  <RefreshCw
                    size={28}
                    className="spin-animation"
                  />
                </div>

                <h4>
                  Loading customer messages...
                </h4>

                <p>
                  Please wait while we load the support inbox.
                </p>
              </div>
            ) : visibleMessages.length === 0 ? (
              <div className="care-empty">
                <div className="care-empty-icon">
                  <MessageCircle size={30} />
                </div>

                <h3>
                  No messages found
                </h3>

                <p>
                  Customer care messages matching your filters
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="care-table">
                  <thead>
                    <tr>
                      <th>CUSTOMER</th>
                      <th>SUBJECT</th>
                      <th>CONTACT</th>
                      <th>STATUS</th>
                      <th>SUBMITTED</th>
                      <th className="text-center">ACTION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleMessages.map((item) => {
                      const status = getStatusConfig(item.status);

                      return (
                        <tr key={item.id}>
                          {/* CUSTOMER */}

                          <td>
                            <div className="care-customer">
                              <div className="care-avatar">
                                {item.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="care-customer-info">
                                <div className="care-customer-name">
                                  {item.name}
                                </div>

                                <div className="care-customer-id">
                                  Customer ID #{item.id}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* SUBJECT */}

                          <td>
                            <div
                              className="care-subject"
                              title={item.subject}
                            >
                              {item.subject}
                            </div>

                            <div className="care-message-preview">
                              {item.message}
                            </div>
                          </td>

                          {/* CONTACT */}

                          <td>
                            <div className="care-contact email">
                              <span className="care-contact-icon">
                                <Mail size={13} />
                              </span>

                              {item.email}
                            </div>

                            {item.phone && (
                              <div className="care-contact phone">
                                <span className="care-contact-icon">
                                  <Phone size={13} />
                                </span>

                                {item.phone}
                              </div>
                            )}
                          </td>

                          {/* STATUS */}

                          <td>
                            <span
                              className="care-status-pill"
                              style={{
                                background: status.background,
                                color: status.color,
                                borderColor: status.border,
                              }}
                            >
                              {status.icon}
                              {status.label}
                            </span>
                          </td>

                          {/* DATE */}

                          <td>
                            <div className="care-date">
                              {formatDate(item.created_at)}
                            </div>
                          </td>

                          {/* ACTION */}

                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMessage(item);

                                if (item.status === "NEW") {
                                  updateStatus(item.id, "READ");
                                }
                              }}
                              className="care-view-button"
                            >
                              <Eye size={15} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          MESSAGE MODAL
      ========================================================== */}

      {selectedMessage && (
        <div
          className="care-modal-backdrop"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="care-modal"
            onClick={(event) => event.stopPropagation()}
          >

            {/* MODAL HEADER */}

            <div className="care-modal-header">
              <div>
                <div className="care-modal-label">
                  CUSTOMER MESSAGE #{selectedMessage.id}
                </div>

                <h2>
                  {selectedMessage.subject}
                </h2>

                <div className="care-modal-date">
                  Received {formatDate(selectedMessage.created_at)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="care-modal-close"
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="care-modal-body">

              {/* CUSTOMER INFO */}

              <div className="care-profile-card">
                <div className="care-profile-top">
                  <div className="care-profile-avatar">
                    {selectedMessage.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="care-profile-main">
                    <div className="care-profile-name">
                      {selectedMessage.name}
                    </div>

                    <div className="care-profile-role">
                      Customer
                    </div>
                  </div>

                  <div className="care-profile-status">
                    {(() => {
                      const config = getStatusConfig(
                        selectedMessage.status
                      );

                      return (
                        <span
                          className="care-status-pill"
                          style={{
                            background: config.background,
                            color: config.color,
                            borderColor: config.border,
                          }}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <div className="care-detail-box">
                      <div className="care-detail-icon">
                        <Mail size={15} />
                      </div>

                      <div>
                        <div className="care-detail-label">
                          EMAIL
                        </div>

                        <a
                          href={`mailto:${selectedMessage.email}`}
                          className="care-detail-value"
                        >
                          {selectedMessage.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="care-detail-box">
                      <div className="care-detail-icon">
                        <Phone size={15} />
                      </div>

                      <div>
                        <div className="care-detail-label">
                          PHONE
                        </div>

                        {selectedMessage.phone ? (
                          <a
                            href={`tel:${selectedMessage.phone}`}
                            className="care-detail-value"
                          >
                            {selectedMessage.phone}
                          </a>
                        ) : (
                          <span className="care-detail-muted">
                            Not provided
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MESSAGE */}

              <div className="care-message-section">
                <div className="care-section-title">
                  <span className="care-section-icon">
                    <MessageCircle size={16} />
                  </span>

                  Customer Message
                </div>

                <div className="care-message-box">
                  {selectedMessage.message}
                </div>
              </div>

              {/* STATUS */}

              <div className="care-status-section">
                <div className="care-section-title">
                  <span className="care-section-icon">
                    <CheckCircle2 size={16} />
                  </span>

                  Update Status
                </div>

                <div className="care-status-actions">
                  {(
                    ["NEW", "READ", "RESOLVED"] as MessageStatus[]
                  ).map((status) => {
                    const config = getStatusConfig(status);
                    const active =
                      selectedMessage.status === status;

                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={
                          updatingId === selectedMessage.id ||
                          active
                        }
                        onClick={() =>
                          updateStatus(
                            selectedMessage.id,
                            status
                          )
                        }
                        className="care-status-action"
                        style={{
                          borderColor: active
                            ? config.border
                            : "#dce5eb",
                          background: active
                            ? config.gradient
                            : "#ffffff",
                          color: active
                            ? config.color
                            : "#64748b",
                        }}
                      >
                        {config.icon}

                        {config.label}

                        {active && (
                          <span className="care-active-check">
                            <CheckCircle2 size={13} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="care-modal-footer">
              <div className="care-updated">
                Last updated:
                <strong>
                  {formatDate(selectedMessage.updated_at)}
                </strong>
              </div>

              <div className="care-footer-actions">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                    selectedMessage.subject
                  )}`}
                  className="care-email-button"
                >
                  <Mail size={15} />
                  Reply by Email
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="care-close-button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          STYLES
      ========================================================== */}

      <style jsx global>{`
        .customer-care-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 8% 10%,
              rgba(73, 181, 164, 0.09),
              transparent 25%
            ),
            radial-gradient(
              circle at 90% 8%,
              rgba(91, 83, 190, 0.08),
              transparent 28%
            ),
            linear-gradient(
              135deg,
              #f7fafc 0%,
              #f1f6f8 48%,
              #f8fafc 100%
            );
          color: #263746;
        }

        .customer-care-wrapper {
          max-width: 1550px;
          margin: 0 auto;
        }

        /* =========================
           HERO
        ========================= */

        .care-hero {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          padding: 32px 35px;
          background:
            linear-gradient(
              125deg,
              #294f5c 0%,
              #326d78 42%,
              #4b7185 72%,
              #555b91 100%
            );
          box-shadow:
            0 20px 50px rgba(38, 68, 82, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        .care-hero-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .care-glow-one {
          width: 280px;
          height: 280px;
          right: -70px;
          top: -140px;
          background: rgba(112, 220, 197, 0.18);
        }

        .care-glow-two {
          width: 220px;
          height: 220px;
          left: 38%;
          bottom: -150px;
          background: rgba(145, 139, 255, 0.16);
        }

        .care-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #d8fff7;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 14px;
        }

        .care-title {
          margin: 0;
          font-size: clamp(30px, 4vw, 42px);
          font-weight: 850;
          letter-spacing: -1.3px;
        }

        .care-description {
          max-width: 650px;
          margin: 9px 0 18px;
          color: rgba(255, 255, 255, 0.75);
          font-size: 14px;
          line-height: 1.7;
        }

        .care-hero-tags {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .care-hero-tags span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 11px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.11);
          color: rgba(255, 255, 255, 0.84);
          font-size: 11px;
          font-weight: 700;
        }

        .care-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #72e0b9;
          box-shadow: 0 0 0 4px rgba(114, 224, 185, 0.12);
        }

        .care-hero-side {
          position: relative;
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 20px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
        }

        .care-hero-icon {
          width: 60px;
          height: 60px;
          flex-shrink: 0;
          border-radius: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.14);
          color: #a5f3df;
        }

        .care-hero-side-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.1px;
          color: rgba(255, 255, 255, 0.58);
        }

        .care-hero-side-value {
          margin-top: 3px;
          font-size: 24px;
          font-weight: 850;
        }

        .care-hero-side-text {
          margin-top: 2px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
        }

        /* =========================
           SECTION HEADINGS
        ========================= */

        .section-kicker {
          color: #500404;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.2px;
          margin-bottom: 4px;
        }

        .section-heading {
          color: #060106;
          font-size: 21px;
          font-weight: 850;
        }

        /* =========================
           REFRESH
        ========================= */

        .care-refresh-button {
          border: 2px solid #010a0d;
          background: #a9c0a8;
          color: #050d55;
          border-radius: 12px;
          padding: 10px 15px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          box-shadow: 0 5px 18px rgba(38, 55, 70, 0.05);
          transition: all 0.2s ease;
        }

        .care-refresh-button:hover:not(:disabled) {
          transform: translateY(-2px);
          border-color: #2129be;
          box-shadow: 0 9px 24px rgb(155, 157, 108);
        }

        .care-refresh-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* =========================
           STAT CARDS
        ========================= */

        .care-stat-card {
          position: relative;
          overflow: hidden;
          height: 100%;
          padding: 20px;
          background: linear-gradient(135deg, #fafafa, #b5cbc6);
          border: 2px solid #2200b8;
          border-radius: 17px;
          box-shadow: 0 7px 25px rgba(38, 55, 70, 0.05);
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
        }

        .care-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 35px rgba(38, 55, 70, 0.09);
          border-color: #11a419;
        }

        .care-stat-accent {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
        }

        .care-stat-label {
          color: #7c8c99;
          font-size: 12px;
          font-weight: 750;
          margin-bottom: 7px;
        }

        .care-stat-value {
          color: #263746;
          font-size: 30px;
          line-height: 1;
          font-weight: 850;
        }

        .care-stat-description {
          margin-top: 7px;
          color: #a0adb7;
          font-size: 11px;
        }

        .care-stat-icon {
          width: 49px;
          height: 49px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* =========================
           ERROR
        ========================= */

        .care-error {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border: 1px solid #fecdd3;
          background: #fff5f6;
          color: #be123c;
          border-radius: 13px;
        }

        .care-error-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #ffe1e6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 850;
        }

        .care-error-title {
          font-size: 13px;
          font-weight: 800;
        }

        .care-error-text {
          margin-top: 2px;
          font-size: 12px;
        }

        /* =========================
           CONTENT CARD
        ========================= */

        .care-content-card {
          overflow: hidden;
          background: #a1bca3;
          border: 1px solid #e3ebef;
          border-radius: 20px;
          box-shadow: 0 12px 38px rgba(38, 55, 70, 0.065);
        }

        .care-filter-header {
          padding: 21px 23px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          border-bottom: 2px solid #02090c;
        }

        .care-table-title {
          margin: 0;
          color: #263746;
          font-size: 20px;
          font-weight: 850;
        }

        .care-table-subtitle {
          margin: 5px 0 0;
          color: #0f0f10;
          font-size: 12px;
        }

        .care-inbox-count {
          min-width: 105px;
          padding: 11px 14px;
          text-align: center;
          border-radius: 12px;
          background: #f4f8f9;
          border: 2px solid #000000;
        }

        .care-count-number {
          display: block;
          color: #035f05;
          font-size: 20px;
          font-weight: 850;
        }

        .care-count-label {
          display: block;
          color: #0c0298;
          font-size: 10px;
          font-weight: 700;
          margin-top: 2px;
        }

        /* =========================
           FILTER BAR
        ========================= */

        .care-filter-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 18px;
          background: #5664a1f8;
          border-bottom: 1px solid #000000;
        }

        .care-search-wrapper {
          position: relative;
          flex: 1 1 auto;
        }

        .care-search-wrapper > svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #cd1845;
          pointer-events: none;
        }

        .care-search-wrapper input {
          width: 100%;
          height: 45px;
          border: 1px solid #101111;
          border-radius: 11px;
          outline: none;
          padding: 0 42px;
          background: #f3eded;
          color: #334155;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .care-search-wrapper input::placeholder {
          color: #0f1010;
        }

        .care-search-wrapper input:focus {
          border-color: #0b0287;
          box-shadow: 0 0 0 4px rgba(73, 137, 145, 0.09);
        }

        .care-search-clear {
          position: absolute;
          right: 9px;
          top: 50%;
          transform: translateY(-50%);
          width: 27px;
          height: 27px;
          border: none;
          border-radius: 8px;
          background: #edf2f4;
          color: #718096;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .care-status-select-wrapper {
          flex: 0 0 170px;
        }

        .care-status-select {
          width: 100%;
          height: 45px;
          border: 1px solid #dce5e9;
          border-radius: 11px;
          padding: 0 13px;
          outline: none;
          background: #ffffff;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .care-status-select:focus {
          border-color: #74aeb4;
          box-shadow: 0 0 0 4px rgba(73, 137, 145, 0.09);
        }

        /* =========================
           TABLE
        ========================= */

        .care-table {
          width: 100%;
          min-width: 1050px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .care-table thead th {
          padding: 13px 18px;
          background: #dae0e3;
          color: #7b8a96;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.8px;
          white-space: nowrap;
          border-bottom: 1px solid #19191b;
          border-top: 1px solid #19191b;
        }

        .care-table tbody td {
          padding: 16px 18px;
          vertical-align: middle;
          border-bottom: 1px solid #d3dbde;
        }

        .care-table tbody tr {
          background: #ffffff;
          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }

        .care-table tbody tr:hover {
          background: #eaeef0;
        }

        .care-table tbody tr:last-child td {
          border-bottom: none;
        }

        .care-customer {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .care-avatar {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            linear-gradient(
              135deg,
              #dff4ee,
              #e3eaff
            );
          color: #34736f;
          font-size: 14px;
          font-weight: 850;
          border: 1px solid #d8e9e9;
        }

        .care-customer-name {
          color: #263746;
          font-size: 13px;
          font-weight: 800;
        }

        .care-customer-id {
          margin-top: 3px;
          color: #a0adb7;
          font-size: 10px;
        }

        .care-subject {
          max-width: 270px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #34495e;
          font-size: 13px;
          font-weight: 800;
        }

        .care-message-preview {
          max-width: 270px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-top: 4px;
          color: #9aa7b1;
          font-size: 11px;
        }

        .care-contact {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          white-space: nowrap;
        }

        .care-contact.email {
          color: #536577;
        }

        .care-contact.phone {
          margin-top: 7px;
          color: #97a4ae;
        }

        .care-contact-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 23px;
          height: 23px;
          border-radius: 7px;
          background: #f1f5f7;
          color: #64808a;
        }

        .care-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid;
          font-size: 10px;
          font-weight: 850;
          white-space: nowrap;
        }

        .care-date {
          color: #657687;
          font-size: 11px;
          white-space: nowrap;
        }

        .care-view-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid #d7e3e7;
          background: #ffffff;
          color: #356d78;
          border-radius: 9px;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .care-view-button:hover {
          background: #edf8f7;
          border-color: #2af007;
          transform: translateY(-1px);
        }

        /* =========================
           LOADING / EMPTY
        ========================= */

        .care-loading,
        .care-empty {
          padding: 80px 20px;
          text-align: center;
        }

        .care-loading-icon,
        .care-empty-icon {
          width: 68px;
          height: 68px;
          margin: 0 auto 16px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            135deg,
            #edf7f6,
            #edf0fb
          );
          color: #4b7e88;
        }

        .care-loading h4,
        .care-empty h3 {
          margin: 0 0 6px;
          color: #34495e;
          font-size: 17px;
          font-weight: 800;
        }

        .care-loading p,
        .care-empty p {
          margin: 0;
          color: #9aa7b1;
          font-size: 12px;
        }

        /* =========================
           MODAL
        ========================= */

        .care-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(24, 38, 48, 0.58);
          backdrop-filter: blur(7px);
        }

        .care-modal {
          width: 100%;
          max-width: 760px;
          max-height: 91vh;
          overflow-y: auto;
          border-radius: 22px;
          background: #ffffff;
          box-shadow:
            0 30px 90px rgba(0, 0, 0, 0.22),
            0 5px 20px rgba(0, 0, 0, 0.08);
          animation: modalIn 0.22s ease-out;
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .care-modal-header {
          padding: 22px 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          background:
            linear-gradient(
              135deg,
              #f8fbfb,
              #f7f8fd
            );
          border-bottom: 1px solid #e9eff1;
        }

        .care-modal-label {
          color: #02011f;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }

        .care-modal-header h2 {
          margin: 0;
          color: #01083c;
          font-size: 22px;
          line-height: 1.3;
          font-weight: 850;
        }

        .care-modal-date {
          margin-top: 7px;
          color: #000000;
          font-size: 11px;
        }

        .care-modal-close {
          width: 37px;
          height: 37px;
          flex-shrink: 0;
          border: 1px solid #e0e8ec;
          border-radius: 11px;
          background: #ffffff;
          color: #718096;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .care-modal-close:hover {
          background: #fff2f3;
          border-color: #cbf1f2;
          color: #c24156;
        }

        .care-modal-body {
          padding: 23px 24px;
        }

        /* =========================
           PROFILE
        ========================= */

        .care-profile-card {
          padding: 18px;
          border: 1px solid #e4ecef;
          border-radius: 16px;
          background: #fbfcfd;
          margin-bottom: 22px;
        }

        .care-profile-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .care-profile-avatar {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            linear-gradient(
              135deg,
              #dff5ef,
              #e5e9ff
            );
          color: #377871;
          font-size: 18px;
          font-weight: 850;
        }

        .care-profile-main {
          min-width: 0;
        }

        .care-profile-name {
          color: #263746;
          font-size: 15px;
          font-weight: 850;
        }

        .care-profile-role {
          margin-top: 2px;
          color: #9aa7b1;
          font-size: 11px;
        }

        .care-profile-status {
          margin-left: auto;
        }

        .care-detail-box {
          min-height: 63px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 1px solid #e6edef;
          border-radius: 12px;
          background: #ffffff;
        }

        .care-detail-icon {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          border-radius: 9px;
          background: #edf6f6;
          color: #4c7f88;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .care-detail-label {
          color: #9aa7b1;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.8px;
          margin-bottom: 3px;
        }

        .care-detail-value {
          color: #356d78;
          font-size: 12px;
          font-weight: 750;
          text-decoration: none;
          word-break: break-all;
        }

        .care-detail-value:hover {
          text-decoration: underline;
        }

        .care-detail-muted {
          color: #a0adb7;
          font-size: 12px;
        }

        /* =========================
           MESSAGE
        ========================= */

        .care-message-section {
          margin-bottom: 23px;
        }

        .care-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          color: #34495e;
          font-size: 13px;
          font-weight: 850;
        }

        .care-section-icon {
          width: 28px;
          height: 28px;
          border-radius: 9px;
          background: #edf5f5;
          color: #3f7c83;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .care-message-box {
          min-height: 110px;
          padding: 17px;
          border: 1px solid #e3ebee;
          border-radius: 14px;
          background:
            linear-gradient(
              135deg,
              #fbfcfd,
              #f7fafb
            );
          color: #526273;
          font-size: 13px;
          line-height: 1.75;
          white-space: pre-wrap;
        }

        /* =========================
           STATUS ACTIONS
        ========================= */

        .care-status-section {
          padding-top: 2px;
        }

        .care-status-actions {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
        }

        .care-status-action {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid;
          border-radius: 10px;
          padding: 9px 13px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .care-status-action:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(38, 55, 70, 0.07);
        }

        .care-status-action:disabled {
          cursor: default;
          opacity: 0.85;
        }

        .care-active-check {
          display: inline-flex;
          margin-left: 2px;
        }

        /* =========================
           MODAL FOOTER
        ========================= */

        .care-modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 16px 24px;
          border-top: 1px solid #e9eff1;
          background: #fbfcfd;
        }

        .care-updated {
          color: #460000;
          font-size: 10px;
        }

        .care-updated strong {
          margin-left: 4px;
          color: #450000;
          font-weight: 700;
        }

        .care-footer-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .care-email-button,
        .care-close-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 10px;
          padding: 9px 13px;
          font-size: 11px;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .care-email-button {
          border: 1px solid #d7e3e7;
          background: #ffffff;
          color: #356d78;
        }

        .care-email-button:hover {
          background: #edf8f7;
          border-color: #a7cbcd;
        }

        .care-close-button {
          border: 1px solid #356d78;
          background: #356d78;
          color: #ffffff;
        }

        .care-close-button:hover {
          background: #294f5c;
          border-color: #294f5c;
        }

        /* =========================
           ANIMATIONS
        ========================= */

        .spin-animation {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 991.98px) {
          .care-hero {
            padding: 27px;
          }

          .care-hero-side {
            max-width: 430px;
          }

          .care-filter-header {
            align-items: flex-start;
          }
        }

        @media (max-width: 767.98px) {
          .customer-care-page {
            padding-bottom: 20px;
          }

          .care-hero {
            border-radius: 19px;
            padding: 23px;
          }

          .care-title {
            font-size: 30px;
          }

          .care-description {
            font-size: 13px;
          }

          .care-filter-header {
            flex-direction: column;
          }

          .care-inbox-count {
            align-self: stretch;
          }

          .care-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .care-status-select-wrapper {
            flex-basis: auto;
            width: 100%;
          }

          .care-modal-backdrop {
            padding: 10px;
          }

          .care-modal {
            max-height: 95vh;
            border-radius: 18px;
          }

          .care-modal-header,
          .care-modal-body {
            padding: 19px;
          }

          .care-modal-footer {
            padding: 15px 19px;
          }

          .care-profile-status {
            margin-left: 0;
          }

          .care-profile-top {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .care-footer-actions {
            width: 100%;
          }

          .care-email-button,
          .care-close-button {
            flex: 1;
            justify-content: center;
          }
        }

        @media (max-width: 575.98px) {
          .care-hero {
            padding: 20px;
          }

          .care-hero-tags {
            align-items: stretch;
            flex-direction: column;
          }

          .care-hero-tags span {
            width: fit-content;
          }

          .care-refresh-button {
            width: 100%;
            justify-content: center;
          }

          .care-profile-card {
            padding: 14px;
          }

          .care-status-actions {
            flex-direction: column;
          }

          .care-status-action {
            width: 100%;
            justify-content: center;
          }

          .care-modal-header h2 {
            font-size: 19px;
          }
        }
      `}</style>
    </main>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  title,
  value,
  description,
  icon,
  iconBackground,
  iconColor,
  accent,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  iconBackground: string;
  iconColor: string;
  accent: string;
}) {
  return (
    <div className="col-xl-3 col-md-6">
      <div className="care-stat-card">
        <div
          className="care-stat-accent"
          style={{
            background: accent,
          }}
        />

        <div className="d-flex align-items-center justify-content-between gap-3">
          <div>
            <div className="care-stat-label">
              {title}
            </div>

            <div className="care-stat-value">
              {value}
            </div>

            <div className="care-stat-description">
              {description}
            </div>
          </div>

          <div
            className="care-stat-icon"
            style={{
              background: iconBackground,
              color: iconColor,
            }}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}