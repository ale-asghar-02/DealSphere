import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { useSocket } from "@/contexts/SocketContext";
import {
  createDesignSession,
  deleteDesignSession,
  editDesign,
  generateDesign,
  getDesignDownloadUrl,
  getDesignPlans,
  getDesignSession,
  getDesignSessions,
  getDesignUsage,
  getMyDesignSubscription,
  purchaseDesignPlan,
  submitDesignAnswer,
} from "../services/designAPI";

const POLL_INTERVAL_MS = 5000;
const PAGE_SIZE = 10;

// Backend ke ye codes aise errors hain jin par UpgradeModal ya khaas message dikhana hota hai
const SPECIAL_CODES = ["DESIGN_LIMIT_REACHED", "DESIGN_EDIT_LIMIT_REACHED", "ACCOUNT_NOT_VERIFIED", "CONTENT_BLOCKED"];

/**
 * Design Studio ka poora logic ek hi hook mein.
 *
 *   useDesign()          -> list page (/design): designs list + usage
 *   useDesign(sessionId) -> ek design ka page (/design/:id): session + sawal + usage
 *   useDesign(null)      -> naya design shuru karne ke liye (createSession)
 *
 *   useDesign(null, { skipAutoLoad: true }) -> pricing / payment pages: usage aur list khud load nahi hoti
 *
 * Har action { ok, code } wapas deta hai. Limit wale codes (DESIGN_LIMIT_REACHED / DESIGN_EDIT_LIMIT_REACHED)
 * `specialError` mein bhi aate hain, taake UI UpgradeModal khol sake.
 */
const useDesign = (sessionId = null, { skipAutoLoad = false } = {}) => {
  const { socket } = useSocket() || {};

  /* ───────────── State ───────────── */
  // usage (plan + limits)
  const [usage, setUsage] = useState(null);
  const [usageLoading, setUsageLoading] = useState(!skipAutoLoad);

  // ek design
  const [data, setData] = useState(null); // { session, question, usage }
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null); // { stage, message }
  const [specialError, setSpecialError] = useState(null); // { code, message }

  // list
  const [designs, setDesigns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [listLoading, setListLoading] = useState(!sessionId && !skipAutoLoad);

  const idRef = useRef(sessionId);
  idRef.current = sessionId;
  const pageRef = useRef(1);

  const session = data?.session || null;
  const status = session?.status;

  /* ───────────── Helpers ───────────── */
  const handleFailure = useCallback((error, fallback) => {
    const code = error?.response?.data?.code || null;
    const message = getToastError(error, fallback);

    if (code && SPECIAL_CODES.includes(code)) setSpecialError({ code, message });
    toast.error(message);
    return { ok: false, code, message };
  }, []);

  const clearSpecialError = useCallback(() => setSpecialError(null), []);

  // Server ka result aane tak screen par "generating" dikhao
  const markGenerating = useCallback((message) => {
    setProgress({ stage: "starting", message });
    setData((prev) =>
      prev
        ? { ...prev, session: { ...prev.session, status: "generating", error: null }, question: { step: "generating" } }
        : prev
    );
  }, []);

  /* ───────────── Usage ───────────── */
  const refreshUsage = useCallback(async () => {
    try {
      const res = await getDesignUsage();
      setUsage(res.data);
      return res.data;
    } catch (error) {
      toast.error(getToastError(error, "Could not load your design usage"));
      return null;
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!skipAutoLoad) refreshUsage();
  }, [refreshUsage, skipAutoLoad]);

  /* ───────────── List ───────────── */
  const fetchList = useCallback(async (page = 1, { silent = false } = {}) => {
    if (!silent) setListLoading(true);
    try {
      const res = await getDesignSessions({ page, limit: PAGE_SIZE });
      pageRef.current = page;
      setDesigns(res.data || []);
      setPagination(res.pagination || { page, limit: PAGE_SIZE, total: 0 });
    } catch (error) {
      if (!silent) toast.error(getToastError(error, "Could not load your designs"));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionId && !skipAutoLoad) fetchList(1);
  }, [sessionId, skipAutoLoad, fetchList]);

  const removeFromList = useCallback(
    async (id) => {
      try {
        await deleteDesignSession(id);
        toast.success("Design deleted");
        await fetchList(pageRef.current, { silent: true });
        return { ok: true };
      } catch (error) {
        return handleFailure(error, "Could not delete this design");
      }
    },
    [fetchList, handleFailure]
  );

  /* ───────────── Ek design load karna ───────────── */
  const loadSession = useCallback(async ({ silent = false } = {}) => {
    const id = idRef.current;
    if (!id) return null;
    if (!silent) setLoading(true);
    try {
      const res = await getDesignSession(id);
      if (idRef.current !== id) return null; // is dauran user kisi aur design par chala gaya
      setData(res.data);
      if (res.data?.usage) setUsage(res.data.usage);
      if (res.data?.session?.status !== "generating") setProgress(null);
      return res.data;
    } catch (error) {
      if (!silent) toast.error(getToastError(error, "Could not load this design"));
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setData(null);
    setProgress(null);
    setSpecialError(null);
    if (sessionId) {
      setLoading(true);
      loadSession();
    } else {
      setLoading(false);
    }
  }, [sessionId, loadSession]);

  /* ───────────── Real-time (socket) ───────────── */
  useEffect(() => {
    if (!socket || skipAutoLoad) return;

    const handleUpdate = (payload) => {
      if (!payload) return;
      const isCurrent = idRef.current && String(payload.sessionId) === String(idRef.current);

      if (payload.status === "generating") {
        if (isCurrent) setProgress({ stage: payload.stage, message: payload.message });
        return;
      }

      // completed / failed: usage (credit wapas bhi ho sakta hai), session aur list taza kar lo
      refreshUsage();
      if (isCurrent) loadSession({ silent: true });
      if (!idRef.current) fetchList(pageRef.current, { silent: true });
    };

    socket.on("designUpdate", handleUpdate);
    return () => socket.off("designUpdate", handleUpdate);
  }, [socket, skipAutoLoad, refreshUsage, loadSession, fetchList]);

  /* ───────────── Polling fallback (agar socket event miss ho jaye) ───────────── */
  useEffect(() => {
    if (status !== "generating") return;
    const timer = setInterval(() => loadSession({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [status, loadSession]);

  /* ───────────── Plans / subscription (pricing aur payment pages) ───────────── */
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [purchasing, setPurchasing] = useState(null); // abhi kis plan ka checkout ban raha hai

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const res = await getDesignPlans();
      setPlans(res.data || []);
    } catch (error) {
      toast.error(getToastError(error, "Could not load plans"));
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // Login zaroori hai. Silent=true ho to error toast nahi dikhata (payment page polling ke liye)
  const loadSubscription = useCallback(async ({ silent = false } = {}) => {
    try {
      const res = await getMyDesignSubscription();
      setSubscription(res.data);
      return res.data;
    } catch (error) {
      if (!silent) toast.error(getToastError(error, "Could not load your subscription"));
      return null;
    }
  }, []);

  // Stripe checkout par bhej deta hai
  const buyPlan = useCallback(
    async (planName) => {
      setPurchasing(planName);
      try {
        const res = await purchaseDesignPlan(planName);
        if (res.checkoutUrl) {
          window.location.href = res.checkoutUrl;
          return { ok: true };
        }
        toast.error("Could not start the payment. Please try again.");
        return { ok: false };
      } catch (error) {
        const result = handleFailure(error, "Could not start the payment");
        if (result.code === "PLAN_ALREADY_ACTIVE") loadSubscription({ silent: true });
        return result;
      } finally {
        setPurchasing(null);
      }
    },
    [handleFailure, loadSubscription]
  );

  /* ───────────── Actions ───────────── */
  // Naya session: { ok, sessionId }. Page ko /design/:sessionId par bhej dein.
  const createSession = useCallback(
    async ({ prompt, image }) => {
      setBusy(true);
      setSpecialError(null);
      try {
        const res = await createDesignSession({ prompt, image });
        setData(res.data);
        if (res.data?.usage) setUsage(res.data.usage);
        return { ok: true, sessionId: res.data?.session?.id };
      } catch (error) {
        return handleFailure(error, "Could not start your design");
      } finally {
        setBusy(false);
      }
    },
    [handleFailure]
  );

  // body: { step: "purpose" | "color" | "content", ... }
  const submitAnswer = useCallback(
    async (body) => {
      const id = idRef.current;
      if (!id) return { ok: false };
      setBusy(true);
      setSpecialError(null);
      try {
        const res = await submitDesignAnswer(id, body);
        setData(res.data);
        if (res.data?.usage) setUsage(res.data.usage);
        return { ok: true };
      } catch (error) {
        return handleFailure(error, "Could not save your answer");
      } finally {
        setBusy(false);
      }
    },
    [handleFailure]
  );

  const generate = useCallback(async () => {
    const id = idRef.current;
    if (!id) return { ok: false };
    setBusy(true);
    setSpecialError(null);
    try {
      await generateDesign(id);
      markGenerating("Creating your design...");
      return { ok: true };
    } catch (error) {
      return handleFailure(error, "Could not start generating your design");
    } finally {
      setBusy(false);
    }
  }, [handleFailure, markGenerating]);

  const edit = useCallback(
    async ({ instruction, versionId }) => {
      const id = idRef.current;
      if (!id) return { ok: false };
      setBusy(true);
      setSpecialError(null);
      try {
        await editDesign(id, { instruction, versionId });
        markGenerating("Applying your change...");
        return { ok: true };
      } catch (error) {
        return handleFailure(error, "Could not apply your change");
      } finally {
        setBusy(false);
      }
    },
    [handleFailure, markGenerating]
  );

  // Backend se (kabhi signed) URL leke naye tab mein khol deta hai
  const download = useCallback(
    async (versionId) => {
      const id = idRef.current;
      if (!id || !versionId) return { ok: false };
      try {
        const res = await getDesignDownloadUrl(id, versionId);
        const link = document.createElement("a");
        link.href = res.data.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.download = "";
        document.body.appendChild(link);
        link.click();
        link.remove();
        return { ok: true, watermarked: res.data.watermarked };
      } catch (error) {
        return handleFailure(error, "Could not download this design");
      }
    },
    [handleFailure]
  );

  // Abhi khula hua design delete
  const removeSession = useCallback(async () => {
    const id = idRef.current;
    if (!id) return { ok: false };
    setBusy(true);
    try {
      await deleteDesignSession(id);
      toast.success("Design deleted");
      return { ok: true };
    } catch (error) {
      return handleFailure(error, "Could not delete this design");
    } finally {
      setBusy(false);
    }
  }, [handleFailure]);

  // Teeno (usage, list, ek design) ka ek hi loading flag
  const designLoading = usageLoading || loading || listLoading || plansLoading;

  return {
    designLoading,

    // usage
    usage,
    refreshUsage,

    // plans / subscription
    plans,
    subscription,
    purchasing,
    loadPlans,
    loadSubscription,
    buyPlan,

    // list
    designs,
    pagination,
    fetchList,
    removeFromList,

    // ek design
    session,
    question: data?.question || null,
    busy,
    progress,
    specialError,
    clearSpecialError,
    loadSession,
    createSession,
    submitAnswer,
    generate,
    edit,
    download,
    removeSession,
  };
};

export default useDesign;