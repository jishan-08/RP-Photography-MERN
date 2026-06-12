import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Film, Instagram, Menu, Play, X } from "lucide-react";
import { api, assetUrl } from "../api";
import heroLensImage from "../assets/camera.png";

import SectionHeading from "../components/SectionHeading";

const emptyContent = {
  settings: { stats: {}, heroImages: [], storyImages: [] },
  services: [], gallery: [], pricing: [], testimonials: [], events: [], faqs: []
};

export default function PublicSite() {
  const [content, setContent] = useState(emptyContent);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(false);
  const [filter, setFilter] = useState("All");
  const [lightbox, setLightbox] = useState(null);
  const [openLogin, setOpenLogin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [message, setMessage] = useState("");
  const heroRef = useRef(null);
  const heroFrame = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api("/api/content")
      .then(setContent)
      .catch(() => setMessage("The content server is unavailable. Start the server and MongoDB."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => () => cancelAnimationFrame(heroFrame.current), []);

  const categories = useMemo(() => ["All", ...new Set(content.gallery.map((item) => item.category))], [content.gallery]);
  const gallery = filter === "All" ? content.gallery : content.gallery.filter((item) => item.category === filter);
  const s = content.settings;
  async function submitInquiry(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api("/api/inquiries", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form.entries()))
      });
      formElement.reset();
      setMessage("Thank you. We will be in touch within 24 hours.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function openLoginModal() {
    setOpenLogin(true);
    setMenu(false);
  }

  function handleHeroMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const normalizedX = pointerX / rect.width - 0.5;
    const normalizedY = pointerY / rect.height - 0.5;

    cancelAnimationFrame(heroFrame.current);
    heroFrame.current = requestAnimationFrame(() => {
      const hero = heroRef.current;
      if (!hero) return;
      hero.style.setProperty("--hero-rotate-x", `${normalizedY * -10}deg`);
      hero.style.setProperty("--hero-rotate-y", `${normalizedX * 14}deg`);
      hero.style.setProperty("--hero-shift-x", `${normalizedX * 24}px`);
      hero.style.setProperty("--hero-shift-y", `${normalizedY * 18}px`);
      hero.style.setProperty("--cursor-x", `${pointerX}px`);
      hero.style.setProperty("--cursor-y", `${pointerY}px`);
    });
  }

  function resetHeroTilt() {
    cancelAnimationFrame(heroFrame.current);
    const hero = heroRef.current;
    if (!hero) return;
    hero.style.setProperty("--hero-rotate-x", "0deg");
    hero.style.setProperty("--hero-rotate-y", "0deg");
    hero.style.setProperty("--hero-shift-x", "0px");
    hero.style.setProperty("--hero-shift-y", "0px");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form.entries()))
      });
      localStorage.setItem("rp_token", data.token);
      localStorage.setItem("rp_user", JSON.stringify(data.user));
      navigate("/admin");
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoginBusy(false);
    }
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenu(false);
  }

  if (loading) return <div className="loader"><div className="loader-mark">RP</div><span>Photography</span></div>;

  return (
    <div className="public-site">
      {message && <button className="toast" onClick={() => setMessage("")}>{message}</button>}
      <div className="announcement">{s.announcement}</div>
      <nav className="site-nav">
        <button className="brand" onClick={openLoginModal}><b>RP</b><span>Photography</span></button>
        <div className={`nav-links ${menu ? "open" : ""}`}>
          {["about", "services", "portfolio", "contact"].map((id) => (
            <button key={id} onClick={() => scrollTo(id)}>{id}</button>
          ))}
          <a className="nav-instagram" href={s.instagram} target="_blank" rel="noreferrer"><Instagram size={16} /> Follow</a>
        </div>
        <button className="menu-btn" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
      </nav>

      <main>
        <section
          id="hero"
          className="hero"
          ref={heroRef}
          onPointerMove={handleHeroMove}
          onPointerEnter={(event) => event.currentTarget.classList.add("is-interacting")}
          onPointerLeave={(event) => {
            event.currentTarget.classList.remove("is-interacting");
            resetHeroTilt();
          }}
        >
          <div className="hero-media" aria-hidden="true">
            <div className="hero-camera-stage">
              <img className="hero-camera" src={heroLensImage} alt="" />
              <div className="hero-camera-glow" />
            </div>
          </div>
          <div className="hero-shade" />
          <div className="hero-cursor" aria-hidden="true"><span /></div>
          <div className="hero-copy">
            <h1>{s.heroHeading}<em>{s.heroAccent}</em></h1>
            <p>{s.heroSubtitle}</p>
            <div className="hero-actions">
              <button className="button primary" onClick={() => scrollTo("portfolio")}>Explore our work <ArrowRight size={17} /></button>
              <button className="button ghost" onClick={() => scrollTo("contact")}>Book a session</button>
            </div>
          </div>
        </section>

        <div className="marquee">
          <div>{["Wedding Photography", "Cinematic Films", "Outdoor Stories", "Studio Portraits", "Pre-Wedding", "Events"].concat(["Wedding Photography", "Cinematic Films", "Outdoor Stories", "Studio Portraits", "Pre-Wedding", "Events"]).map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
        </div>


        <section id="about" className="section story">
          <div className="story-images">
            <img className="story-main" src={assetUrl(s.storyImages?.[0])} alt="Photographer at work" />
            <img className="story-float" src={assetUrl(s.storyImages?.[1])} alt="Camera and creative process" />
          </div>
          <div className="story-copy">
            <SectionHeading eyebrow="Our story" title={s.aboutHeading} />
            <blockquote>{s.aboutQuote}</blockquote>
            <p>{s.aboutText}</p>
            <button className="text-link" onClick={() => scrollTo("contact")}>Start your story <ArrowRight size={18} /></button>
          </div>
        </section>

        <section id="services" className="section section-dark">
          <SectionHeading eyebrow="What we create" title="Photography with feeling, craft, and intention." text="From intimate portraits to multi-day celebrations, every commission is shaped around your story." align="center" />
          <div className="service-grid">
            {content.services.filter((item) => item.active !== false).map((service, index) => (
              <article className="service-card" key={`${service.title}-${index}`}>
                <img src={assetUrl(service.image)} alt={service.title} />
                <div className="service-overlay" />
                <span>0{index + 1}</span>
                <div><h3>{service.title}</h3><p>{service.description}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section id="portfolio" className="section portfolio">
          <div className="heading-row">
            <SectionHeading eyebrow="Selected work" title="Recent stories" text="A small window into celebrations, portraits, and places we have loved photographing." />
            <div className="filters">{categories.map((category) => <button className={filter === category ? "active" : ""} key={category} onClick={() => setFilter(category)}>{category}</button>)}</div>
          </div>
          <div className="gallery-grid">
            {gallery.map((item, index) => (
              <button className="gallery-item" key={`${item.image}-${index}`} onClick={() => setLightbox(index)}>
                <img src={assetUrl(item.image)} alt={item.title || item.category} />
                <span><small>{item.category}</small>{item.title}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="cinematic" style={{ backgroundImage: `url(${assetUrl(s.cinematicImage)})` }}>
          <div><Film size={38} /><span className="kicker">Films & cinematography</span><h2>Your story, told in motion.</h2><p>Wedding films built from real voices, fleeting gestures, and the beautiful noise around them.</p><button className="play-button" onClick={() => scrollTo("contact")}><Play fill="currentColor" /> Discuss your film</button></div>
        </section>


        <section id="contact" className="contact" style={{ backgroundImage: `url(${assetUrl(s.contactImage)})` }}>
          <div className="contact-copy">
            <span className="kicker">Tell us everything</span><h2>Let’s create something beautiful.</h2>
            <p>Share your date, place, and the feeling you want to remember. We will reply with availability and a custom proposal.</p>
            <div><a href={`tel:${s.phone}`}>{s.phone}</a><a href={`mailto:${s.email}`}>{s.email}</a><span>{s.address}</span></div>
          </div>
          <form onSubmit={submitInquiry}>
            <label>Your name<input name="name" required placeholder="Your full name" /></label>
            <label>Phone<input name="phone" required placeholder="+91" /></label>
            <label>Email<input name="email" type="email" placeholder="you@example.com" /></label>
            <label>Interested in<select name="service"><option value="">Choose a service</option>{content.services.map((item) => <option key={item.title}>{item.title}</option>)}</select></label>
            <label>Event date<input name="eventDate" type="date" /></label>
            <label className="wide">Tell us about your plans<textarea name="message" rows="4" placeholder="Location, events, guest count, mood..." /></label>
            <button className="button primary wide">Send inquiry <ArrowRight size={17} /></button>
          </form>
        </section>

      </main>

      {openLogin && <div className="login-overlay" onClick={() => setOpenLogin(false)}>
        <div className="login-modal" onClick={(event) => event.stopPropagation()}>
          <button className="login-close" onClick={() => setOpenLogin(false)}><X size={18} /></button>
          <div className="admin-logo">RP</div>
          <h2>Admin login</h2>
          <p>Enter your admin username and password to continue.</p>
          {loginError && <div className="admin-error">{loginError}</div>}
          <form onSubmit={handleLogin}>
            <label>Username<input name="username" placeholder="Username" autoComplete="username" required /></label>
            <label>Password<input name="password" type="password" placeholder="Password" autoComplete="current-password" required /></label>
            <button disabled={loginBusy}>{loginBusy ? "Signing in..." : "Sign in"}</button>
          </form>
        </div>
      </div>}

      <footer>
        <div className="brand"><b>RP</b><span>Photography</span></div>
        <p>Stories made timeless through creativity, calm direction, and an eye for honest moments.</p>
        <div>{["about", "services", "portfolio", "contact"].map((id) => <button key={id} onClick={() => scrollTo(id)}>{id}</button>)}</div>
        <small>© {new Date().getFullYear()} RP Photography. All rights reserved. <a href="/admin">Admin</a></small>
      </footer>

      {lightbox !== null && <div className="lightbox" onClick={() => setLightbox(null)}>
        <button className="lightbox-close"><X /></button>
        <button onClick={(event) => { event.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length); }}><ChevronLeft /></button>
        <img src={assetUrl(gallery[lightbox]?.image)} alt={gallery[lightbox]?.title} />
        <button onClick={(event) => { event.stopPropagation(); setLightbox((lightbox + 1) % gallery.length); }}><ChevronRight /></button>
      </div>}
    </div>
  );
}
