import formImage from '@/assets/images/form-image.avif'
import formContentStar from '@/assets/images/form-content-star.avif'

const PromoPanel = () => {
  return (
    <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center px-3 mb-3 position-relative">
      <img
        className="img-fluid rounded-4"
        src={formImage}
        loading='lazy'
        alt="form-image"
        width={450}
      />
      <div
        className="col-8 p-3 p-lg-4 position-absolute rounded-3"
        style={{
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "2rem",
          color: "#fff",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        <h1
          className="fw-semibold mb-0"
          style={{ fontSize: "calc(0.7rem + 1vw)" }}
        >
          Build your store and expand your reach with our trusted platform{" "}
          <span>
            <img src={formContentStar} loading='lazy' alt="NavStar" height={25} />
          </span>
        </h1>
      </div>
    </div>
  );
};

export default PromoPanel;