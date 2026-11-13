import { useEffect, useState } from "react";
import { IconRobot, IconInfoCircle, IconSettings, IconMessageCircle, IconRefresh, IconPlayerPlay } from "@tabler/icons-react";

import { useAIChat } from "../hooks/useAIChat";
import Modal from "@/components/Model";
import { useChat } from "../../chat/hooks/useChat";
import AIEscalationsPanel from "./AIEscalationsPanel";

// ── Per-chat AI toggle ──────────────────────────────────────
// Small on/off switch for ONE specific chat, meant to sit in the chat
// window's header (not the settings page). Kept in this file since all
// AI-related pieces were merged here, but it stays a separate export —
// it renders a switch, not the settings page.
export const AIChatToggle = ({ chat }) => {
  const { handleToggleAIForChat, handleResumeAIForChat } = useChat();
  const [updating, setUpdating] = useState(false);

  if (!chat || chat.type !== "buyer-seller") return null;

  const isOff = chat.aiDisabledByUser || chat.aiPaused;

  const handleChange = async (e) => {
    const next = e.target.checked; // true = seller wants AI ON
    setUpdating(true);
    try {
      if (next && chat.aiPaused) {
        // seller had manually taken over this chat — turning it back on resumes AI
        await handleResumeAIForChat({ chatId: chat._id });
      }
      await handleToggleAIForChat({ chatId: chat._id, disabled: !next });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="form-check form-switch d-flex align-items-center gap-2 mb-0" title={isOff ? "AI is off for this chat" : "AI is replying in this chat"}>
      <input
        className="form-check-input"
        type="checkbox"
        role="switch"
        id={`ai-chat-toggle-${chat._id}`}
        checked={!isOff}
        disabled={updating}
        onChange={handleChange}
        style={{ cursor: "pointer" }}
      />
      <label
        className={`form-check-label small fw-semibold mb-0 ${isOff ? "text-secondary" : "text-success"}`}
        htmlFor={`ai-chat-toggle-${chat._id}`}
        style={{ cursor: "pointer" }}
      >
        {isOff ? "AI Off" : "AI On"}
      </label>
    </div>
  );
};


const AIAssistant = () => {
  const { aiChatLoading, aiAssistant, handleGetAISettings, handleUpdateAISettings, aiTestLoading, handleTestAI } = useAIChat();

  const [enabled, setEnabled] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [dailyLimit, setDailyLimit] = useState(100);
  const [cooldownSeconds, setCooldownSeconds] = useState(5);

  const [showTestModal, setShowTestModal] = useState(false);
  const [testItemId, setTestItemId] = useState("");
  const [testItemType, setTestItemType] = useState("advertisement");
  const [testMessage, setTestMessage] = useState("");
  const [testReply, setTestReply] = useState(null);

  // Load current AI settings
  useEffect(() => {
    handleGetAISettings();
  }, [handleGetAISettings]);

  // Sync settings with backend data
  useEffect(() => {
    setEnabled(!!aiAssistant?.enabled);
    setInstructions(aiAssistant?.instructions || "");
    setDailyLimit(aiAssistant?.dailyLimit ?? 100);
    setCooldownSeconds(aiAssistant?.cooldownSeconds ?? 5);
  }, [aiAssistant]);

  // Master AI toggle
  const handleToggleAI = async (next) => {
    setEnabled(next);
    const success = await handleUpdateAISettings({ enabled: next });
    if (!success) setEnabled(!next);
  };

  // Save settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    await handleUpdateAISettings({
      instructions,
      dailyLimit: Number(dailyLimit),
      cooldownSeconds: Number(cooldownSeconds),
    });
  };

  // Open test modal (reset previous test state)
  const handleOpenTestModal = () => {
    setTestMessage("");
    setTestReply(null);
    setShowTestModal(true);
  };

  // Test AI
  const handleRunTest = async (e) => {
    e.preventDefault();
    if (!testMessage.trim() || !testItemId.trim()) return;

    const result = await handleTestAI({
      itemId: testItemId.trim(),
      itemType: testItemType,
      testMessage: testMessage.trim(),
    });

    if (result) setTestReply(result);
  };

  const dailyCount = aiAssistant?.dailyCount ?? 0;
  const isTestReady = testMessage.trim() && testItemId.trim();

  return (
    <>
      <div>

        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
          <div>
            <h1 className="fs-5 me-3 mb-0">AI Assistant</h1>
            <p className="small text-body-secondary mb-0">AI can automatically reply to buyer messages on your behalf.</p>
          </div>

          <div className="d-flex align-items-center gap-2 align-self-start align-self-md-center">
            <AIEscalationsPanel />

            <button type="button" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2" onClick={() => handleGetAISettings()} disabled={aiChatLoading}>
              <IconRefresh size={16} stroke={1.8} />
              {aiChatLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Main Settings Card */}
        <div className="border rounded-2 mb-3">
          <div className="p-3 p-md-4">
            {/* Master Toggle */}
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 pb-4 border-bottom">
              <div className="d-flex align-items-start">
                <div className="bg-primary bg-opacity-10 rounded-pill p-2 me-3">
                  <IconRobot size={22} stroke={1.5} className="text-primary" />
                </div>
                <div>
                  <h6 className="mb-0" style={{ fontSize : '18px'}}>AI Assistant</h6>
                  <p className="text-muted small mb-0">
                    {enabled ? "AI Assistant can automatically reply to your buyer messages." : "AI Assistant is currently disabled."}
                  </p>
                </div>
              </div>

              <div className="form-check form-switch fs-4 mb-0">
                <input className="form-check-input" type="checkbox" role="switch" id="ai-master-switch" checked={enabled} disabled={aiChatLoading} onChange={(e) => handleToggleAI(e.target.checked)} />
              </div>
            </div>

            {/* Settings Form */}
            <form onSubmit={handleSaveSettings} className={!enabled ? "opacity-50" : ""}>
              {/* Instructions */}
              <div className="mt-4">
                <label htmlFor="ai-instructions" className="form-label fw-medium">
                  Instructions for AI <span className="small fw-normal ms-1">(Optional)</span>
                </label>

                <textarea
                  id="ai-instructions"
                  className="form-control small"
                  rows="5"
                  maxLength={500}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  disabled={!enabled}
                  placeholder="Example: The price is slightly negotiable but not below 500. Delivery is only available within Lahore."
                />

                <div className="d-flex justify-content-between mt-1">
                  <small className="text-muted">Tell the AI your business rules and preferences.</small>
                  <small className="text-muted">{instructions.length}/500</small>
                </div>
              </div>

              {/* Daily Limit + Cooldown */}
              <div className="row g-3 mt-2">
                <div className="col-12 col-md-6">
                  <label htmlFor="ai-daily-limit" className="form-label fw-medium">Daily Reply Limit</label>
                  <input id="ai-daily-limit" type="number" min="0" className="form-control" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} disabled={!enabled} />
                  <small className="text-muted d-block mt-1">
                    {Number(dailyLimit) === 0 ? "Unlimited AI replies" : `${dailyCount} / ${dailyLimit} replies used today`}
                  </small>
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="ai-cooldown" className="form-label fw-medium">Cooldown <span className="small fw-normal ms-1">(Seconds)</span></label>
                  <input id="ai-cooldown" type="number" min="0" className="form-control" value={cooldownSeconds} onChange={(e) => setCooldownSeconds(e.target.value)} disabled={!enabled} />
                  <small className="text-muted d-block mt-1">The minimum gap between two AI replies in the same chat.</small>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button type="submit" className="btn btn-primary px-4" disabled={!enabled || aiChatLoading}>
                  {aiChatLoading ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Current Status */}
        <div className="border rounded-2 mb-3">
          <div className="p-3 p-md-4 d-flex align-items-start">
            <IconInfoCircle size={21} stroke={1.5} className="text-primary me-2 flex-shrink-0" />
            <div>
              <h6 className="mb-1">How AI Assistant works</h6>
              <p className="text-muted small mb-0">
                AI Assistant will reply to buyers' questions according to your configured instructions. You can also turn AI on or off for individual chats.
              </p>
            </div>
          </div>
        </div>

        {/* Test AI Section */}
        <div className="border rounded-2 mb-3">
          <div className="p-3 p-md-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-start">
              <div className="me-2">
                <IconMessageCircle size={22} stroke={1.5} className="text-success" />
              </div>
              <div>
                <h6 className="mb-1">Test Your AI Assistant</h6>
                <p className="text-muted small mb-0">Test your AI's response without creating a real buyer chat.</p>
              </div>
            </div>

            <button type="button" className="btn btn-sm btn-outline-success d-flex align-items-center gap-2 align-self-start align-self-md-center" onClick={handleOpenTestModal}>
              <IconPlayerPlay size={15} stroke={1.6} />
              Test AI
            </button>
          </div>
        </div>

        {/* Daily Usage */}
        <div className="border rounded-2 mb-3">
          <div className="p-3 p-md-4">
            <div className="d-flex align-items-center mb-3">
              <IconSettings size={21} stroke={1.7} className="me-2 text-primary" />
              <h6 className="mb-0">Today's AI Usage</h6>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="border rounded p-3">
                  <small className="text-muted d-block">Status : <span className={`${enabled ? "text-success" : "text-secondary"}`}>{enabled ? "( Active )" : "( Disabled )"}</span></small>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="border rounded p-3">
                  <small className="text-muted d-block">Replies Used : <span className="text-dark fw-medium">( {dailyCount} )</span></small>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="border rounded p-3">
                  <small className="text-muted d-block">Daily Limit : <span className="text-dark fw-medium">( {Number(dailyLimit) === 0 ? "Unlimited" : dailyLimit} )</span></small>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Test AI Modal */}
      <Modal
        show={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Test Your AI Assistant"
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowTestModal(false)}>Close</button>
            <button type="button" className="btn btn-primary" disabled={aiTestLoading || !isTestReady} onClick={handleRunTest}>
              {aiTestLoading ? "Generating..." : "Send Test Message"}
            </button>
          </>
        }
      >
        <div>
          <div className="alert alert-info d-flex align-items-start mb-4">
            <IconInfoCircle size={20} stroke={1.7} className="me-2 flex-shrink-0" />
            <small>This is just a preview. No real chat or message will be saved to the database.</small>
          </div>

          <div className="mb-3">
            <label htmlFor="ai-test-item-id" className="form-label fw-medium">Ad / Product ID</label>
            <input id="ai-test-item-id" type="text" className="form-control" value={testItemId} onChange={(e) => setTestItemId(e.target.value)} placeholder="Enter your ad or product ID" />
          </div>

          <div className="mb-3">
            <label htmlFor="ai-test-item-type" className="form-label fw-medium">Item Type</label>
            <select id="ai-test-item-type" className="form-select py-2" value={testItemType} onChange={(e) => setTestItemType(e.target.value)}>
              <option value="advertisement">Advertisement</option>
              <option value="product">Product</option>
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="ai-test-message" className="form-label fw-medium">Buyer Message</label>
            <textarea id="ai-test-message" className="form-control" rows="4" value={testMessage} onChange={(e) => setTestMessage(e.target.value)} placeholder="Example: Is the price final? Is delivery available?" />
          </div>

          {testReply && (
            <div className="border rounded p-3 bg-light">
              <div className="d-flex align-items-center mb-2">
                <IconRobot size={19} stroke={1.7} className="me-2 text-primary" />
                <strong>AI Reply</strong>
              </div>
              <p className="mb-0">{testReply}</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AIAssistant;