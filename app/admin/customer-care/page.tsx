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
        background: "#fff4e5",
        color: "#b45309",
        border: "#fed7aa",
      };

    case "READ":
      return {
        label: "Read",
        icon: <Eye size={14} />,
        background: "#eaf5ff",
        color: "#1769aa",
        border: "#bfdbfe",
      };

    case "RESOLVED":
      return {
        label: "Resolved",
        icon: <CheckCircle2 size={14} />,
        background: "#ecfdf3",
        color: "#15803d",
        border: "#bbf7d0",
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
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f7f9fc 0%, #eef4f8 50%, #f8fafc 100%)",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 13px",
                borderRadius: "999px",
                background: "#e8f4f2",
                color: "#287d72",
                fontSize: "13px",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              <MessageCircle size={15} />
              CUSTOMER SUPPORT
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                fontWeight: 800,
                color: "#263746",
                letterSpacing: "-0.5px",
              }}
            >
              Customer Care
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                color: "#718096",
                fontSize: "15px",
              }}
            >
              Manage customer enquiries, support requests and resolutions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadMessages(true)}
            disabled={refreshing}
            style={{
              border: "1px solid #dce5eb",
              background: "#ffffff",
              color: "#34495e",
              borderRadius: "12px",
              padding: "11px 17px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 700,
              cursor: refreshing ? "not-allowed" : "pointer",
              boxShadow: "0 4px 15px rgba(38,55,70,0.06)",
            }}
          >
            <RefreshCw
              size={17}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            Refresh
          </button>
        </div>

        {/* STATS */}
        <div
          className="row g-3"
          style={{
            marginBottom: "24px",
          }}
        >
          <StatCard
            title="Total Messages"
            value={stats.total}
            icon={<MessageCircle size={21} />}
            iconBackground="#edf3ff"
            iconColor="#4169e1"
          />

          <StatCard
            title="New"
            value={stats.new}
            icon={<Clock3 size={21} />}
            iconBackground="#fff4e5"
            iconColor="#d97706"
          />

          <StatCard
            title="Read"
            value={stats.read}
            icon={<Eye size={21} />}
            iconBackground="#eaf5ff"
            iconColor="#1769aa"
          />

          <StatCard
            title="Resolved"
            value={stats.resolved}
            icon={<CheckCircle2 size={21} />}
            iconBackground="#ecfdf3"
            iconColor="#15803d"
          />
        </div>

        {/* ERROR */}
        {error && (
          <div
            style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#be123c",
              borderRadius: "12px",
              padding: "13px 16px",
              marginBottom: "20px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {/* CONTENT CARD */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5ebf0",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "0 10px 35px rgba(38,55,70,0.07)",
          }}
        >
          {/* FILTER BAR */}
          <div
            style={{
              padding: "18px",
              borderBottom: "1px solid #edf1f4",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                position: "relative",
                flex: "1 1 320px",
              }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, subject or message..."
                style={{
                  width: "100%",
                  height: "44px",
                  border: "1px solid #dce4ea",
                  borderRadius: "11px",
                  padding: "0 14px 0 42px",
                  outline: "none",
                  color: "#334155",
                  background: "#fbfcfd",
                  fontSize: "14px",
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={{
                height: "44px",
                minWidth: "155px",
                border: "1px solid #dce4ea",
                borderRadius: "11px",
                padding: "0 13px",
                outline: "none",
                background: "#fbfcfd",
                color: "#334155",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Status</option>
              <option value="NEW">New</option>
              <option value="READ">Read</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          {/* TABLE */}
          {loading ? (
            <div
              style={{
                padding: "70px 20px",
                textAlign: "center",
                color: "#718096",
              }}
            >
              <RefreshCw
                size={28}
                style={{
                  animation: "spin 1s linear infinite",
                  marginBottom: "10px",
                }}
              />

              <div
                style={{
                  fontWeight: 700,
                }}
              >
                Loading customer messages...
              </div>
            </div>
          ) : visibleMessages.length === 0 ? (
            <div
              style={{
                padding: "75px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "18px",
                  background: "#eef4f7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  color: "#5d7a88",
                }}
              >
                <MessageCircle size={28} />
              </div>

              <h3
                style={{
                  margin: "0 0 6px",
                  color: "#2a5796",
                  fontSize: "18px",
                }}
              >
                No messages found
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                  fontSize: "14px",
                }}
              >
                Customer care messages matching your filters will appear here.
              </p>
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "1000px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f8fafc",
                    }}
                  >
                    <th style={thStyle}>CUSTOMER</th>
                    <th style={thStyle}>SUBJECT</th>
                    <th style={thStyle}>CONTACT</th>
                    <th style={thStyle}>STATUS</th>
                    <th style={thStyle}>SUBMITTED</th>
                    <th
                      style={{
                        ...thStyle,
                        textAlign: "center",
                      }}
                    >
                      ACTION
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleMessages.map((item) => {
                    const status = getStatusConfig(item.status);

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderTop: "1px solid #edf1f4",
                          transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.background = "#fafcfd";
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.background = "#ffffff";
                        }}
                      >
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "11px",
                            }}
                          >
                            <div
                              style={{
                                width: "39px",
                                height: "39px",
                                borderRadius: "12px",
                                background:
                                  "linear-gradient(135deg, #e5f5f2, #d9edf0)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#367d79",
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {item.name.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <div
                                style={{
                                  fontWeight: 750,
                                  color: "#263746",
                                  marginBottom: "2px",
                                }}
                              >
                                {item.name}
                              </div>

                              <div
                                style={{
                                  color: "#94a3b8",
                                  fontSize: "12px",
                                }}
                              >
                                ID #{item.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#34495e",
                              maxWidth: "260px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={item.subject}
                          >
                            {item.subject}
                          </div>

                          <div
                            style={{
                              color: "#94a3b8",
                              fontSize: "12px",
                              maxWidth: "260px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              marginTop: "3px",
                            }}
                          >
                            {item.message}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              color: "#526273",
                              fontSize: "13px",
                            }}
                          >
                            <Mail size={14} />
                            {item.email}
                          </div>

                          {item.phone && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                color: "#94a3b8",
                                fontSize: "12px",
                                marginTop: "5px",
                              }}
                            >
                              <Phone size={13} />
                              {item.phone}
                            </div>
                          )}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 10px",
                              borderRadius: "999px",
                              background: status.background,
                              color: status.color,
                              border: `1px solid ${status.border}`,
                              fontSize: "12px",
                              fontWeight: 800,
                            }}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color: "#64748b",
                            fontSize: "13px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(item.created_at)}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "center",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMessage(item);

                              if (item.status === "NEW") {
                                updateStatus(item.id, "READ");
                              }
                            }}
                            style={{
                              border: "1px solid #dce5eb",
                              background: "#ffffff",
                              color: "#356d78",
                              borderRadius: "9px",
                              padding: "8px 12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontWeight: 750,
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
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

      {/* MESSAGE MODAL */}
      {selectedMessage && (
        <div
          onClick={() => setSelectedMessage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20, 35, 45, 0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "720px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "20px",
              boxShadow: "0 25px 70px rgba(0,0,0,0.2)",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "22px 24px",
                borderBottom: "1px solid #edf1f4",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "15px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#71909a",
                    letterSpacing: "0.8px",
                    marginBottom: "5px",
                  }}
                >
                  CUSTOMER MESSAGE #{selectedMessage.id}
                </div>

                <h2
                  style={{
                    margin: 0,
                    color: "#263746",
                    fontSize: "22px",
                    fontWeight: 800,
                  }}
                >
                  {selectedMessage.subject}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "24px",
              }}
            >
              {/* CUSTOMER INFO */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #edf1f4",
                  borderRadius: "14px",
                  padding: "17px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    style={{
                      width: "45px",
                      height: "45px",
                      borderRadius: "14px",
                      background:
                        "linear-gradient(135deg, #dff3ef, #d9eaf0)",
                      color: "#367d79",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: 800,
                    }}
                  >
                    {selectedMessage.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div
                      style={{
                        fontWeight: 800,
                        color: "#263746",
                      }}
                    >
                      {selectedMessage.name}
                    </div>

                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: "12px",
                        marginTop: "2px",
                      }}
                    >
                      Submitted {formatDate(selectedMessage.created_at)}
                    </div>
                  </div>
                </div>

                <div
                  className="row g-3"
                  style={{
                    fontSize: "13px",
                  }}
                >
                  <div className="col-md-6">
                    <div
                      style={{
                        color: "#94a3b8",
                        marginBottom: "4px",
                      }}
                    >
                      Email
                    </div>

                    <a
                      href={`mailto:${selectedMessage.email}`}
                      style={{
                        color: "#326d79",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      {selectedMessage.email}
                    </a>
                  </div>

                  <div className="col-md-6">
                    <div
                      style={{
                        color: "#94a3b8",
                        marginBottom: "4px",
                      }}
                    >
                      Phone
                    </div>

                    {selectedMessage.phone ? (
                      <a
                        href={`tel:${selectedMessage.phone}`}
                        style={{
                          color: "#326d79",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        {selectedMessage.phone}
                      </a>
                    ) : (
                      <span
                        style={{
                          color: "#94a3b8",
                        }}
                      >
                        Not provided
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* MESSAGE */}
              <div
                style={{
                  marginBottom: "23px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    color: "#34495e",
                    fontWeight: 800,
                    fontSize: "14px",
                    marginBottom: "9px",
                  }}
                >
                  <MessageCircle size={17} />
                  Customer Message
                </div>

                <div
                  style={{
                    background: "#fbfcfd",
                    border: "1px solid #e7edf1",
                    borderRadius: "13px",
                    padding: "17px",
                    color: "#526273",
                    fontSize: "14px",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedMessage.message}
                </div>
              </div>

              {/* STATUS */}
              <div>
                <div
                  style={{
                    color: "#34495e",
                    fontWeight: 800,
                    fontSize: "14px",
                    marginBottom: "10px",
                  }}
                >
                  Update Status
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "9px",
                    flexWrap: "wrap",
                  }}
                >
                  {(["NEW", "READ", "RESOLVED"] as MessageStatus[]).map(
                    (status) => {
                      const config = getStatusConfig(status);
                      const active = selectedMessage.status === status;

                      return (
                        <button
                          key={status}
                          type="button"
                          disabled={
                            updatingId === selectedMessage.id || active
                          }
                          onClick={() =>
                            updateStatus(selectedMessage.id, status)
                          }
                          style={{
                            border: `1px solid ${
                              active ? config.border : "#dce5eb"
                            }`,
                            background: active
                              ? config.background
                              : "#ffffff",
                            color: active ? config.color : "#64748b",
                            borderRadius: "10px",
                            padding: "9px 13px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "7px",
                            fontWeight: 750,
                            cursor:
                              active || updatingId === selectedMessage.id
                                ? "default"
                                : "pointer",
                          }}
                        >
                          {config.icon}
                          {config.label}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div
              style={{
                borderTop: "1px solid #edf1f4",
                padding: "16px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                }}
              >
                Last updated: {formatDate(selectedMessage.updated_at)}
              </span>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                    selectedMessage.subject
                  )}`}
                  style={{
                    textDecoration: "none",
                    border: "1px solid #dce5eb",
                    background: "#ffffff",
                    color: "#356d78",
                    borderRadius: "10px",
                    padding: "9px 13px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "13px",
                    fontWeight: 750,
                  }}
                >
                  <Mail size={15} />
                  Reply by Email
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  style={{
                    border: "none",
                    background: "#356d78",
                    color: "#ffffff",
                    borderRadius: "10px",
                    padding: "9px 15px",
                    fontSize: "13px",
                    fontWeight: 750,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconBackground,
  iconColor,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBackground: string;
  iconColor: string;
}) {
  return (
    <div className="col-xl-3 col-md-6">
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5ebf0",
          borderRadius: "16px",
          padding: "19px",
          height: "100%",
          boxShadow: "0 7px 25px rgba(38,55,70,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "15px",
        }}
      >
        <div>
          <div
            style={{
              color: "#81909d",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "7px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              color: "#263746",
              fontSize: "28px",
              fontWeight: 850,
              lineHeight: 1,
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "14px",
            background: iconBackground,
            color: iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 18px",
  fontSize: "11px",
  fontWeight: 850,
  letterSpacing: "0.6px",
  color: "#7c8b98",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "16px 18px",
  verticalAlign: "middle",
};