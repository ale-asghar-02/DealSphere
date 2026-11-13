import { useEffect, useState } from "react";
import { IconX, IconClock } from "@tabler/icons-react";
import useAnnouncement from "../hooks/useAnnouncement";

const getTimeLeft = (expiresAt) => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days >= 1) {
    return `${days}d, ${hours}h`;
  }

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
};

const AnnouncementTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(expiresAt));

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt || !timeLeft) return null;

  return (
    <span className="d-flex align-items-center gap-1 small fw-medium">
      <IconClock stroke={1.5} size={14} />
      {timeLeft}
    </span>
  );
};

const AnnouncementBanner = () => {
  const { announcements, dismissAnnouncement } = useAnnouncement();

  if (!announcements.length) return null;

  return (
    <div className="d-flex flex-column gap-2 mb-0 p-2 pb-0">
      {announcements.map((a) => (
        <div
          key={a._id}
          className={`d-flex flex-wrap justify-content-between align-items-center border border-${a.type} rounded p-3`}
          style={{ backgroundColor: `rgba(var(--bs-${a.type}-rgb), 0.1)` }}
        >
          <div className="d-flex align-items-center flex-wrap column-gap-2">
            <span className="fw-medium">{a.title} :</span>
            <span>{a.message}</span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <AnnouncementTimer expiresAt={a.expiresAt} />
            <button
              type="button"
              className="btn btn-sm btn-link text-body p-0"
              onClick={() => dismissAnnouncement(a._id)}
            >
              <IconX stroke={1.5} size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementBanner;