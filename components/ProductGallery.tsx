"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

type GalleryImage = {
  id?: number;
  image_url: string;
  alt_text?: string | null;
  is_primary?: number | boolean;
};

export default function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const safeImages =
    images && images.length > 0
      ? images
      : [
          {
            image_url: "/placeholder-product.jpg",
            alt_text: productName,
          },
        ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const activeImage = safeImages[activeIndex];

  const previousImage = () => {
    setActiveIndex((current) =>
      current === 0 ? safeImages.length - 1 : current - 1
    );
  };

  const nextImage = () => {
    setActiveIndex((current) =>
      current === safeImages.length - 1 ? 0 : current + 1
    );
  };

  return (
    <>
      <div className="aurora-gallery">
        <div className="aurora-gallery-main">
          <img
            src={activeImage.image_url}
            alt={activeImage.alt_text || productName}
            className="aurora-gallery-main-image"
          />

          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                className="gallery-arrow gallery-arrow-left"
                onClick={previousImage}
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                className="gallery-arrow gallery-arrow-right"
                onClick={nextImage}
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          <button
            type="button"
            className="gallery-expand"
            onClick={() => setLightbox(true)}
            aria-label="View larger image"
          >
            <Maximize2 size={17} />
          </button>

          <div className="gallery-counter">
            {activeIndex + 1} / {safeImages.length}
          </div>
        </div>

        {safeImages.length > 1 && (
          <div className="aurora-gallery-thumbs">
            {safeImages.map((image, index) => (
              <button
                key={image.id ?? `${image.image_url}-${index}`}
                type="button"
                className={`gallery-thumb ${
                  activeIndex === index ? "active" : ""
                }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`View image ${index + 1}`}
              >
                <img
                  src={image.image_url}
                  alt={image.alt_text || `${productName} ${index + 1}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="aurora-lightbox"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Product image viewer"
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setLightbox(false)}
            aria-label="Close image viewer"
          >
            ×
          </button>

          <button
            type="button"
            className="lightbox-nav lightbox-nav-left"
            onClick={(event) => {
              event.stopPropagation();
              previousImage();
            }}
            aria-label="Previous image"
          >
            <ChevronLeft size={28} />
          </button>

          <img
            src={activeImage.image_url}
            alt={activeImage.alt_text || productName}
            className="lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />

          <button
            type="button"
            className="lightbox-nav lightbox-nav-right"
            onClick={(event) => {
              event.stopPropagation();
              nextImage();
            }}
            aria-label="Next image"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}
    </>
  );
}