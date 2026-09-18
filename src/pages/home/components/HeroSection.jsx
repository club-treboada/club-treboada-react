// src/pages/HomePage/components/HeroSection.jsx
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { useState, useEffect } from 'react';
import OptimizedImage from '../../../components/OptimizedImage';
import {
  dbRowToHeroSlide,
  listActiveHeroSlides,
} from '../../../lib/heroSlidesRepository';
import heroSliderData from '../../../data/heroSliderData';
import styles from './HeroSection.module.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

const HeroSection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [slides, setSlides] = useState([]);
  const [slidesLoaded, setSlidesLoaded] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 760);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await listActiveHeroSlides();
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        if (error) {
          console.warn('[hero] falling back to static data:', error.message);
        }
        // Fall back to the bundled static data so the home page never breaks
        // (network down, table not seeded yet, etc.).
        setSlides(heroSliderData);
      } else {
        setSlides(data.map(dbRowToHeroSlide).filter(Boolean));
      }
      setSlidesLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mobileCards = slides.filter(
    (slide) => slide.type === 'image' && slide.src && slide.link
  );

  return (
    <section id="hero" className={styles.hero}>
      <div className="container">
        <div className={styles.contentWrapper}>
          <h1>Club Treboada</h1>
          <h2>Ximnasia Rítmica, Acrobática e Trampolín</h2>

          {isMobile ? (
            /* MOBILE: quick-link cards, generated from the same admin-managed slides */
            <div className={styles.mobileEvents}>
              {mobileCards.map((slide) =>
                slide.external ? (
                  <a
                    key={slide.id}
                    href={slide.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mobileEventCard}
                  >
                    <div className={styles.mobileEventImage}>
                      <OptimizedImage src={slide.src} alt={slide.alt} />
                    </div>
                    <div className={styles.mobileEventContent}>
                      <h3 className={styles.mobileEventTitle}>
                        {slide.alt}
                      </h3>
                      <span className={styles.mobileEventArrow}>→</span>
                    </div>
                  </a>
                ) : (
                  <Link
                    key={slide.id}
                    to={slide.link}
                    className={styles.mobileEventCard}
                  >
                    <div className={styles.mobileEventImage}>
                      <OptimizedImage src={slide.src} alt={slide.alt} />
                    </div>
                    <div className={styles.mobileEventContent}>
                      <h3 className={styles.mobileEventTitle}>
                        {slide.alt}
                      </h3>
                      <span className={styles.mobileEventArrow}>→</span>
                    </div>
                  </Link>
                )
              )}
            </div>
          ) : (
            /* DESKTOP: Swiper Slider */
            <div className={styles.sliderWrapper}>
              {slidesLoaded && slides.length > 0 && (
                <Swiper
                  modules={[Navigation, Autoplay]}
                  navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                  }}
                  autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                  }}
                  loop={slides.length > 1}
                  className={styles.swiper}
                >
                  {slides.map((slide) => (
                    <SwiperSlide key={slide.id}>
                      {slide.type === 'icons' ? (
                        <div className={styles.slideInner}>
                          <div className={styles.iconRow}>
                            {slide.icons.map((icon, index) => (
                              <div key={index} className={styles.iconCol}>
                                <OptimizedImage src={icon.src} alt={icon.alt} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.slideInner}>
                          {slide.external ? (
                            <a
                              href={slide.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <OptimizedImage src={slide.src} alt={slide.alt} />
                            </a>
                          ) : (
                            <Link to={slide.link}>
                              <OptimizedImage src={slide.src} alt={slide.alt} />
                            </Link>
                          )}
                        </div>
                      )}
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}

              {/* Navigation Arrows */}
              <div className="swiper-button-next"></div>
              <div className="swiper-button-prev"></div>
            </div>
          )}

          {/* Logo Strip - visible on all devices */}
          <div className={styles.logoStrip}>
            <OptimizedImage src="/images/logos/xunta.webp" alt="Xunta" />
            <OptimizedImage src="/images/logos/deputacion.webp" alt="Deputación" />
            <OptimizedImage src="/images/logos/concello.webp" alt="Concello" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
