import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Generic infinite scroll helper.
 *
 * fetcher(page, limit) => { data: [], total?, hasMore?, matchedBy?, matchedCategory? }
 *   page 1-based. Error par null return karein (throw na karein).
 * deps       => primitive values. Ye badlein to list reset hoke page 1 se shuru hoti hai.
 * initialPage=> sirf pehli mount par: pages 1..N ek ek karke load hote hain aur N par scroll hota hai.
 *
 * Return: items, total, meta, loading, error, initialized, hasMore,
 *         currentPage, pageStart(item), sentinelRef, retry
 */
const useInfiniteList = ({
  fetcher,
  deps = [],
  limit = 16,
  getKey = (item) => item._id,
  rootMargin = "300px",
  initialPage = 1,
  maxInitialPages = 10,
  scrollOffset = 90, // sticky navbar ki height ke hisab se
  markerThreshold = 0.6, // screen ke kitne hisse par marker aaye to page badle
}) => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [meta, setMeta] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [node, setNode] = useState(null); // sentinel element

  const fetcherRef = useRef(fetcher);
  const getKeyRef = useRef(getKey);
  const itemsRef = useRef([]);
  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const requestRef = useRef(0); // purani request ka jawab ignore karne ke liye
  const startMapRef = useRef({}); // itemKey => page jahan se wo page shuru hota ha
  const lastDepsRef = useRef(null);
  const pendingScrollRef = useRef(0);

  fetcherRef.current = fetcher;
  getKeyRef.current = getKey;

  const fetchPage = async (pageNum) => {
    try {
      const res = await fetcherRef.current(pageNum, limit);
      const list = Array.isArray(res) ? res : res?.data;
      if (!Array.isArray(list)) return null;
      return { list, meta: Array.isArray(res) ? {} : res };
    } catch {
      return null;
    }
  };

  // aik page ko itemsRef mein merge karta ha (state baad mein set hoti ha)
  const applyPage = (pageNum, { list, meta: m }) => {
    const key = getKeyRef.current;
    const seen = new Set(itemsRef.current.map(key));
    const fresh = list.filter((item) => !seen.has(key(item)));

    if (fresh.length > 0) startMapRef.current[key(fresh[0])] = pageNum;

    itemsRef.current = [...itemsRef.current, ...fresh];
    pageRef.current = pageNum;

    if (m.total != null) setTotal(m.total);
    if (m.matchedBy !== undefined) {
      setMeta({ matchedBy: m.matchedBy, matchedCategory: m.matchedCategory || null });
    }

    const more =
      list.length === 0
        ? false
        : (m.hasMore ?? (fresh.length > 0 && list.length >= limit));

    return { more, fresh: fresh.length };
  };

  // from..to pages sequentially load karta ha
  const loadPages = useCallback(
    async (from, to, restoreScroll = false) => {
      if (loadingRef.current || !hasMoreRef.current) return;

      const requestId = requestRef.current;
      loadingRef.current = true;
      setLoading(true);
      setError(false);

      let more = true;
      let failed = false;
      let lastFresh = 0;
      let stale = false;

      try {
        for (let p = from; p <= to && more; p++) {
          const result = await fetchPage(p);
          if (requestId !== requestRef.current) {
            stale = true;
            return;
          }
          if (!result) {
            failed = true;
            break;
          }
          const r = applyPage(p, result);
          more = r.more;
          lastFresh = r.fresh;
        }

        hasMoreRef.current = failed ? false : more;
        setHasMore(hasMoreRef.current);
        setError(failed);

        if (restoreScroll && pageRef.current > 1) {
          pendingScrollRef.current = pageRef.current;
        }
        setItems(itemsRef.current);
      } finally {
        if (!stale && requestId === requestRef.current) {
          loadingRef.current = false;
          setLoading(false);
          setInitialized(true);
        }
      }

      // poora page duplicate nikla magar backend kehta ha aur hain => agla page lao
      if (!failed && more && lastFresh === 0 && from === to) {
        setTimeout(() => loadPages(pageRef.current + 1, pageRef.current + 1), 0);
      }
    },
    [limit],
  );

  const loadMore = useCallback(
    () => loadPages(pageRef.current + 1, pageRef.current + 1),
    [loadPages],
  );

  const retry = useCallback(() => {
    hasMoreRef.current = true;
    setHasMore(true);
    setError(false);
    loadMore();
  }, [loadMore]);

  // browser ki apni scroll restore band (hum khud karte hain)
  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = prev;
    };
  }, []);

  // deps badle => reset. Pehli mount par initialPage tak load, baad mein page 1
  useEffect(() => {
    const depsKey = JSON.stringify(deps);
    const isFilterChange =
      lastDepsRef.current !== null && lastDepsRef.current !== depsKey;
    lastDepsRef.current = depsKey;

    requestRef.current += 1;
    pageRef.current = 0;
    itemsRef.current = [];
    startMapRef.current = {};
    hasMoreRef.current = true;
    loadingRef.current = false;
    pendingScrollRef.current = 0;

    setItems([]);
    setTotal(null);
    setMeta(null);
    setHasMore(true);
    setError(false);
    setInitialized(false);
    setLoading(true);
    setCurrentPage(0);

    if (isFilterChange) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      loadPages(1, 1);
    } else {
      const target = Math.min(Math.max(initialPage, 1), maxInitialPages);
      loadPages(1, target, target > 1);
    }

    return () => {
      requestRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // items render hone ke baad (paint se pehle) restore page par scroll
  useLayoutEffect(() => {
    const page = pendingScrollRef.current;
    if (!page) return;
    pendingScrollRef.current = 0;
    const el = document.querySelector(`[data-page-marker="${page}"]`);
    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - scrollOffset,
        left: 0,
        behavior: "instant",
      });
    }
  }, [items, scrollOffset]);

  // sentinel nazar aaye to agla page
  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, items.length, hasMore, loading, loadMore, rootMargin]);

  // scroll par pata karo kaun sa page screen par ha
  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      if (itemsRef.current.length === 0) return;
      const markers = document.querySelectorAll("[data-page-marker]");
      if (!markers.length) return;
      const line = window.innerHeight * markerThreshold;
      let active = Number(markers[0].dataset.pageMarker);
      markers.forEach((m) => {
        if (m.getBoundingClientRect().top <= line) {
          active = Number(m.dataset.pageMarker);
        }
      });
      setCurrentPage(active);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items.length, markerThreshold]);

  const pageStart = useCallback(
    (item) => startMapRef.current[getKeyRef.current(item)] || 0,
    [],
  );

  return {
    items,
    total,
    meta,
    loading,
    error,
    initialized,
    hasMore,
    currentPage,
    pageStart,
    sentinelRef: setNode,
    retry,
  };
};

export default useInfiniteList;