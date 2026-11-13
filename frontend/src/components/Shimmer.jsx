import { IconPhotoOff } from '@tabler/icons-react';

// Reusable shimmer block (text, buttons, counts, avatar wagaira ke liye)
// width/height: "120px", "80%" ya number
// rounded: bootstrap class, default "rounded-1" (circle ke liye "rounded-circle", radius khud dena ho to "")
export const Shimmer = ({ width, height, rounded = "rounded-1", className = "", style = {} }) => (
  <div
    aria-hidden="true"
    className={`image-shimmer ${rounded} ${className}`.trim()}
    style={{ width, height, ...style }}
  />
);

// Image ki jagah ye dikhao:
// loading = true  -> shimmer background + beech mein content
// loading = false -> grey background + beech mein content
// showIcon = true -> tabler icon dikhao (chhoti images ke liye)
// showText = false -> "No Image Available" hide (sirf icon wali chhoti images ke liye)
// className: rounded-2 / rounded-3 wagaira parent ke hisab se do
export const NoImage = ({
  loading = false,
  showIcon = false,
  showText = true,
  textSize = "11px",  // badi image ke liye bada do, jaise "18px"
  iconSize = 24,
  className = "",
  style = {},
}) => (
  <div
    className={`position-relative overflow-hidden d-flex flex-column align-items-center justify-content-center w-100 h-100 text-secondary text-center px-1 ${loading ? "" : "bg-body-secondary"} ${className}`}
    style={style}
  >
    {loading && (
      <Shimmer rounded="" className="position-absolute top-0 start-0 w-100 h-100" />
    )}

    <div className="position-relative d-flex flex-column align-items-center">
      {showIcon && (
        <IconPhotoOff stroke={1.5} size={iconSize} className={showText ? "mb-1" : ""} />
      )}
      {showText && (
        <span style={{ fontSize: textSize, lineHeight: 1.2 }}>No Image Available</span>
      )}
    </div>
  </div>
);

export default Shimmer;