import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, ChevronLeft, Image, LayoutDashboard, LogOut, Menu, MessageSquare, Package, Save, Settings, Star, Trash2, Upload, X } from "lucide-react";
import { api, assetUrl } from "../api";

const sections = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["inquiries", "Inquiries", MessageSquare],
  ["bookings", "Bookings", CalendarDays],
  ["gallery", "Gallery", Image],
  ["services", "Services", Package],
  ["events", "Stories & Events", BookOpen],
  ["settings", "Site Settings", Settings]
];

const serviceOptions = [
  "Wedding Photography",
  "Outdoor Photography",
  "Pre-Wedding",
  "Portrait Photography",
  "Event Photography",
  "Cinematic Films",
  "Studio Portraits"
];

const configs = {
  services: {
    title: "Services", fields: [
      ["title", "Service", "select", serviceOptions], ["description", "Description", "textarea"], ["image", "Image", "file"], ["active", "Active", "checkbox"]
    ], create: { title: serviceOptions[0], description: "", image: "", active: true }
  },
  gallery: {
    title: "Gallery", fields: [["title", "Title"], ["category", "Category"]],
    create: { title: "New photograph", category: "Wedding" }
  },
  events: {
    title: "Stories & events", fields: [
      ["title", "Title"], ["date", "Date"], ["excerpt", "Excerpt", "textarea"],
      ["image", "Image URL"], ["published", "Published", "checkbox"]
    ], create: { title: "New story", date: "", excerpt: "", image: "", published: true }
  }
};

function Login({ onLogin }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify(Object.fromEntries(form.entries())) });
      localStorage.setItem("rp_token", data.token);
      localStorage.setItem("rp_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="admin-login">
    <form onSubmit={submit}>
      <div className="admin-logo">RP</div><h1>Studio Admin</h1><p>Manage the complete website from one place.</p>
      {error && <div className="admin-error">{error}</div>}
      <label>Username<input name="username" defaultValue="admin" autoComplete="username" /></label>
      <label>Password<input name="password" type="password" defaultValue="admin123" autoComplete="current-password" /></label>
      <button disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      <small>Default: admin / admin123</small>
    </form>
  </div>;
}

export default function Admin() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("rp_user") || "null"));
  const [page, setPage] = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [content, setContent] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([api("/api/admin/content"), api("/api/admin/dashboard")])
      .then(([site, dash]) => { setContent(site); setDashboard(dash); })
      .catch(handleAuthError);
  }, [user]);

  useEffect(() => {
    if (!user || page === "dashboard") return;
    if (page === "inquiries") api("/api/admin/inquiries").then(setInquiries).catch(handleAuthError);
    if (page === "bookings") api("/api/admin/bookings").then(setBookings).catch(handleAuthError);
  }, [page, user]);

  function handleAuthError(error) {
    if (/authentication|session|expired/i.test(error.message)) logout();
    else setNotice(error.message);
  }
  function logout() {
    localStorage.removeItem("rp_token");
    localStorage.removeItem("rp_user");
    setUser(null);
  }
  async function saveCollection(section, value) {
    try {
      const updated = await api(`/api/admin/content/${section}`, { method: "PUT", body: JSON.stringify(value) });
      setContent(updated);
      setEditing(null);
      setNotice("Changes saved.");
    } catch (error) { handleAuthError(error); }
  }
  async function saveSettings(value, imageFile) {
    try {
      if (imageFile) {
        const body = new FormData();
        body.append("images", imageFile);
        body.append("category", "Hero");
        const uploaded = await api("/api/admin/upload", { method: "POST", body });
        if (uploaded?.[0]?.image) {
          value.heroImages = [uploaded[0].image];
        }
      }
      await saveCollection("settings", value);
    } catch (error) { handleAuthError(error); }
  }
  async function removeInquiry(id) {
    if (!confirm("Delete this inquiry?")) return;
    await api(`/api/admin/inquiries/${id}`, { method: "DELETE" });
    setInquiries(inquiries.filter((item) => item._id !== id));
  }
  async function updateInquiry(id, status) {
    const updated = await api(`/api/admin/inquiries/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setInquiries(inquiries.map((item) => item._id === id ? updated : item));
  }
  async function makeBooking(item) {
    const booking = await api(`/api/admin/inquiries/${item._id}/booking`, { method: "POST", body: "{}" });
    setBookings([booking, ...bookings]);
    setNotice("Inquiry converted to a booking.");
    updateInquiry(item._id, "Confirmed");
  }
  async function removeBooking(id) {
    if (!confirm("Delete this booking?")) return;
    await api(`/api/admin/bookings/${id}`, { method: "DELETE" });
    setBookings(bookings.filter((item) => item._id !== id));
  }
  async function uploadImages(event) {
    const files = event.target.files;
    if (!files.length) return;
    const body = new FormData();
    [...files].forEach((file) => body.append("images", file));
    body.append("category", "Portfolio");
    try {
      const uploaded = await api("/api/admin/upload", { method: "POST", body });
      await saveCollection("gallery", [...content.gallery, ...uploaded]);
    } catch (error) { setNotice(error.message); }
    event.target.value = "";
  }

  if (!user) return <Login onLogin={setUser} />;
  if (!content) return <div className="admin-loading">Loading studio...</div>;

  const currentLabel = sections.find(([id]) => id === page)?.[1];

  return <div className="admin-shell">
    {notice && <button className="admin-notice" onClick={() => setNotice("")}>{notice}</button>}
    <aside className={mobileNav ? "admin-sidebar open" : "admin-sidebar"}>
      <div className="admin-brand"><b>RP</b><div><strong>Photography</strong><span>Studio CMS</span></div><button onClick={() => setMobileNav(false)}><X /></button></div>
      <nav>{sections.map(([id, label, Icon]) => <button className={page === id ? "active" : ""} key={id} onClick={() => { setPage(id); setEditing(null); setMobileNav(false); }}><Icon size={17} /><span>{label}</span></button>)}</nav>
      <div className="admin-user"><div>{user.name?.[0] || "A"}</div><span><strong>{user.name}</strong><small>{user.role}</small></span><button title="Log out" onClick={logout}><LogOut size={17} /></button></div>
    </aside>
    <div className="admin-main">
      <header><button className="admin-menu" onClick={() => setMobileNav(true)}><Menu /></button><div><small>RP Photography</small><h1>{currentLabel}</h1></div><a href="/" target="_blank">View website <ChevronLeft size={14} /></a></header>
      <div className="admin-content">
        {page === "dashboard" && <Dashboard data={dashboard} onNavigate={setPage} />}
        {page === "inquiries" && <Inquiries data={inquiries} onStatus={updateInquiry} onDelete={removeInquiry} onBooking={makeBooking} />}
        {page === "bookings" && <Bookings data={bookings} setData={setBookings} onDelete={removeBooking} setNotice={setNotice} />}
        {configs[page] && <CollectionEditor section={page} data={content[page]} config={configs[page]} editing={editing} setEditing={setEditing} onSave={saveCollection} onUpload={page === "gallery" ? uploadImages : null} />}
        {page === "settings" && <SettingsEditor data={content.settings} onSave={saveSettings} />}
      </div>
    </div>
  </div>;
}

function Dashboard({ data, onNavigate }) {
  if (!data) return null;
  const cards = [
    ["Inquiries", data.stats.inquiries, "inquiries"], ["New leads", data.stats.newInquiries, "inquiries"],
    ["Bookings", data.stats.bookings, "bookings"], ["Gallery images", data.stats.gallery, "gallery"],
    ["Services", data.stats.services, "services"]
  ];
  return <>
    <div className="admin-stats">{cards.map(([label, value, page]) => <button key={label} onClick={() => onNavigate(page)}><span>{label}</span><strong>{value}</strong><small>Open manager →</small></button>)}</div>
    <section className="admin-panel"><div className="panel-head"><div><small>Lead activity</small><h2>Latest inquiries</h2></div><button onClick={() => onNavigate("inquiries")}>View all</button></div>
      <div className="table-wrap"><table><thead><tr><th>Client</th><th>Service</th><th>Phone</th><th>Status</th><th>Received</th></tr></thead><tbody>
        {data.recent.map((item) => <tr key={item._id}><td><strong>{item.name}</strong></td><td>{item.service || "General inquiry"}</td><td>{item.phone}</td><td><span className={`status ${item.status?.toLowerCase()}`}>{item.status}</span></td><td>{new Date(item.createdAt).toLocaleDateString()}</td></tr>)}
      </tbody></table></div>
    </section>
  </>;
}

function Inquiries({ data, onStatus, onDelete, onBooking }) {
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? data : data.filter((item) => item.status === filter);
  return <section className="admin-panel">
    <div className="panel-head"><div><small>Lead inbox</small><h2>{shown.length} inquiries</h2></div><div className="admin-filters">{["All", "New", "Pending", "Confirmed", "Completed", "Cancelled"].map((item) => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div></div>
    <div className="table-wrap"><table><thead><tr><th>Client</th><th>Contact</th><th>Request</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {shown.map((item) => <tr key={item._id}><td><strong>{item.name}</strong><small>{item.eventDate || "Date not set"}</small></td><td>{item.phone}<small>{item.email}</small></td><td>{item.service || "General inquiry"}</td><td className="message-cell">{item.message || "—"}</td><td><select value={item.status} onChange={(e) => onStatus(item._id, e.target.value)}>{["New", "Pending", "Confirmed", "Completed", "Cancelled"].map((value) => <option key={value}>{value}</option>)}</select></td><td><div className="row-actions"><button title="Convert to booking" onClick={() => onBooking(item)}><CalendarDays size={16} /></button><button className="danger" onClick={() => onDelete(item._id)}><Trash2 size={16} /></button></div></td></tr>)}
    </tbody></table></div>
  </section>;
}

function Bookings({ data, setData, onDelete, setNotice }) {
  const [form, setForm] = useState(null);
  async function save(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const created = await api("/api/admin/bookings", { method: "POST", body: JSON.stringify(values) });
    setData([created, ...data]); setForm(null); setNotice("Booking added.");
  }
  return <>
    <div className="admin-toolbar"><p>Track confirmed work, payment progress, and event dates.</p><button onClick={() => setForm({})}>+ Add booking</button></div>
    <section className="admin-panel"><div className="table-wrap"><table><thead><tr><th>Client</th><th>Service</th><th>Event</th><th>Total</th><th>Paid</th><th>Status</th><th /></tr></thead><tbody>
      {data.map((item) => <tr key={item._id}><td><strong>{item.client}</strong><small>{item.phone}</small></td><td>{item.service}</td><td>{item.eventDate || "—"}</td><td>₹{Number(item.amount || 0).toLocaleString("en-IN")}</td><td>₹{Number(item.paid || 0).toLocaleString("en-IN")}</td><td><span className="status confirmed">{item.status}</span></td><td><button className="icon-danger" onClick={() => onDelete(item._id)}><Trash2 size={16} /></button></td></tr>)}
    </tbody></table></div></section>
    {form && <Modal title="Add booking" onClose={() => setForm(null)}><form className="edit-form" onSubmit={save}><label>Client<input name="client" required /></label><label>Phone<input name="phone" /></label><label>Service<input name="service" /></label><label>Event date<input name="eventDate" type="date" /></label><label>Total amount<input name="amount" type="number" /></label><label>Paid<input name="paid" type="number" /></label><label className="wide">Notes<textarea name="notes" /></label><button className="save-button wide"><Save size={16} /> Save booking</button></form></Modal>}
  </>;
}

function CollectionEditor({ section, data, config, editing, setEditing, onSave, onUpload }) {
  const items = Array.isArray(data) ? data : [];
  function remove(index) {
    if (confirm("Delete this item?")) onSave(section, items.filter((_, itemIndex) => itemIndex !== index));
  }
  async function saveItem(value) {
    const next = [...items];
    if (section === "services" && value.imageFile) {
      const body = new FormData();
      body.append("images", value.imageFile);
      body.append("category", "Services");
      const uploaded = await api("/api/admin/upload", { method: "POST", body });
      value.image = uploaded?.[0]?.image || value.image;
      delete value.imageFile;
    }
    if (editing.index === -1) next.unshift(value); else next[editing.index] = value;
    await onSave(section, next);
  }
  return <>
    <div className="admin-toolbar"><p>{items.length} items published on the website.</p><div>{onUpload && <label className="upload-button"><Upload size={16} /> Upload images<input type="file" multiple accept="image/*" onChange={onUpload} /></label>}{section !== "gallery" && <button onClick={() => setEditing({ index: -1, item: config.create })}>+ Add item</button>}</div></div>
    <div className={`collection-grid ${section === "gallery" ? "gallery-admin-grid" : ""}`}>
      {items.map((item, index) => <article key={`${item.title || item.name || item.question}-${index}`}>
        {(item.image || section === "gallery") && <div className="collection-image">{item.image ? <img src={assetUrl(item.image)} alt="" /> : <Image />}</div>}
        <div className="collection-body"><small>{item.category || item.tier || item.role || item.date || config.title}</small><h3>{item.title || item.name || item.question}</h3><p>{item.description || item.excerpt || item.text || item.answer}</p>
          {item.price !== undefined && <strong>₹{Number(item.price).toLocaleString("en-IN")}</strong>}
          <div><button onClick={() => setEditing({ index, item })}>Edit</button><button className="danger" onClick={() => remove(index)}><Trash2 size={15} /></button></div>
        </div>
      </article>)}
    </div>
    {editing && <EditModal title={`${editing.index === -1 ? "Add" : "Edit"} ${config.title}`} fields={config.fields} item={editing.item} onClose={() => setEditing(null)} onSave={saveItem} />}
  </>;
}

function EditModal({ title, fields, item, onClose, onSave }) {
  const [value, setValue] = useState({ ...item });
  const [busy, setBusy] = useState(false);
  function update(key, next, type) {
    if (type === "number") next = Number(next);
    if (type === "lines") next = next.split("\n");
    setValue({ ...value, [key]: next });
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave(value);
      onClose();
    } finally {
      setBusy(false);
    }
  }
  return <Modal title={title} onClose={onClose}><form className="edit-form" onSubmit={submit}>
    {fields.map(([key, label, type = "text", options]) => <label className={type === "textarea" || type === "lines" ? "wide" : ""} key={key}>{label}
      {type === "textarea" || type === "lines" ? <textarea value={type === "lines" ? (value[key] || []).join("\n") : value[key] || ""} onChange={(e) => update(key, e.target.value, type)} /> :
        type === "checkbox" ? <input className="toggle-input" type="checkbox" checked={Boolean(value[key])} onChange={(e) => update(key, e.target.checked, type)} /> :
          type === "select" ? <select value={value[key] ?? options?.[0] ?? ""} onChange={(e) => update(key, e.target.value, type)}>{options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> :
            type === "file" ? <>
              {value.image && !value.imageFile && <img src={assetUrl(value.image)} alt="Preview" style={{ width: "100%", height: "auto", marginBottom: "0.75rem", borderRadius: "10px" }} />}
              <input type="file" accept="image/*" onChange={(e) => update("imageFile", e.target.files?.[0])} />
            </> :
              <input type={type} value={value[key] ?? ""} onChange={(e) => update(key, e.target.value, type)} />}
    </label>)}
    <button className="save-button wide" disabled={busy}>{busy ? "Saving..." : <><Save size={16} /> Save changes</>}</button>
  </form></Modal>;
}

function SettingsEditor({ data, onSave }) {
  const [value, setValue] = useState(data);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(data.heroImages?.[0] || "");
  const fields = useMemo(() => [
    ["brandName", "Studio name"], ["tagline", "Tagline"], ["announcement", "Announcement"],
    ["heroHeading", "Hero heading"], ["heroAccent", "Hero accent"], ["heroSubtitle", "Hero subtitle", "textarea"],
    ["aboutHeading", "About heading"], ["aboutQuote", "About quote"], ["aboutText", "About text", "textarea"],
    ["address", "Address"], ["phone", "Phone"], ["email", "Email"], ["whatsapp", "WhatsApp"],
    ["instagram", "Instagram URL"], ["facebook", "Facebook URL"],
    ["cinematicImage", "Cinematic background URL"], ["contactImage", "Contact background URL"]
  ], []);

  useEffect(() => {
    setValue(data);
    setImagePreview(data.heroImages?.[0] || "");
    setImageFile(null);
  }, [data]);

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  return <section className="admin-panel settings-panel"><div className="panel-head"><div><small>Global content</small><h2>Brand, homepage and contact details</h2></div><button className="save-top" onClick={() => onSave(value, imageFile)}><Save size={16} /> Save all</button></div>
    <div className="edit-form settings-form">
      <div className="settings-section-head">
        <h3>Background image (hero image)</h3>
        <p>Select a file to upload as the homepage hero background image. After saving, this image will be used on the public hero section.</p>
      </div>
      <label className="wide">Upload hero image<input type="file" accept="image/*" onChange={handleImageChange} /></label>
      {imagePreview && <div className="hero-image-preview"><img src={imagePreview} alt="Hero preview" /></div>}
      <label className="wide">Current hero image URL<input value={value.heroImages?.[0] || ""} readOnly /></label>
      <div className="settings-section-head">
        <h3>Hero text & other homepage settings</h3>
      </div>
      {fields.map(([key, label, type]) => <label className={type === "textarea" ? "wide" : ""} key={key}>{label}{type === "textarea" ? <textarea value={value[key] || ""} onChange={(e) => setValue({ ...value, [key]: e.target.value })} /> : <input value={value[key] || ""} onChange={(e) => setValue({ ...value, [key]: e.target.value })} />}</label>)}
      <label className="wide">Story images (one URL per line)<textarea value={(value.storyImages || []).join("\n")} onChange={(e) => setValue({ ...value, storyImages: e.target.value.split("\n").filter(Boolean) })} /></label>
    </div>
  </section>;
}

function Modal({ title, onClose, children }) {
  return <div className="admin-modal-backdrop" onMouseDown={onClose}><div className="admin-modal" onMouseDown={(e) => e.stopPropagation()}><header><h2>{title}</h2><button onClick={onClose}><X /></button></header>{children}</div></div>;
}
