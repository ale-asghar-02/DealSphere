const Loading = ({ fullScreen = false, size = 90, className = "" }) => {
  const loader = (
    <div className={`app-loader ${className}`} role="status" aria-label="Loading">
      <svg
        className="app-loader__svg"
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
      >
        <circle className="app-loader__arc app-loader__arc--outer" cx="256" cy="256" r="214" />
        <circle className="app-loader__arc app-loader__arc--middle" cx="256" cy="256" r="172" />
        <circle className="app-loader__arc app-loader__arc--inner" cx="256" cy="256" r="126" />
        <circle className="app-loader__dot" cx="256" cy="256" r="32" />
      </svg>
    </div>
  );

  if (fullScreen) {
    return <div className="app-loader-overlay">{loader}</div>;
  }

  return loader;
};

export default Loading;