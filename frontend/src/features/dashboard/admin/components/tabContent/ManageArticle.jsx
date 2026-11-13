import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { IconPlus, IconEdit, IconTrash, IconEye, IconThumbUp, IconThumbDown, IconSearchOff } from "@tabler/icons-react";

import AdminSearchBar from "../AdminSearcBar";
import Modal from "@/components/Model";
import useArticle from "../../../../article/hooks/useArticle";
import useArticleModeration from "../../hooks/useArticleModeration";

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;
const MIN_SEARCH_LENGTH = 2; // backend rejects shorter search queries
const FORM_ID = "article-form";
 
const CATEGORIES = ["buying", "selling", "account", "safety", "orders", "payments"];
 
const CATEGORY_BADGE_STYLES = {
  buying: { backgroundColor: "#e0f2fe", color: "#0284c7" },
  selling: { backgroundColor: "#dcfce7", color: "#15803d" },
  account: { backgroundColor: "#fef9c3", color: "#ca8a04" },
  safety: { backgroundColor: "#fee2e2", color: "#dc2626" },
  orders: { backgroundColor: "#ede9fe", color: "#7c3aed" },
  payments: { backgroundColor: "#ffedd5", color: "#ea580c" },
};
const DEFAULT_BADGE_STYLE = { backgroundColor: "#f3f4f6", color: "#555" };
 
const EMPTY_FORM = { title: "", category: "", content: "", tags: "" };
 
// ── HELPERS ────────────────────────────────────────────────────────────────
const getBadgeStyle = (slug) => CATEGORY_BADGE_STYLES[slug] || DEFAULT_BADGE_STYLE;
const formatCategory = (slug) => (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "");
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
 
// ── ARTICLE FORM (rendered inside <Modal>) ─────────────────────────────────
// The submit button lives in the Modal footer and is linked to this form via the `form` attribute.
function ArticleForm({ article, onSubmit }) {
  const isEdit = Boolean(article);
 
  const [form, setForm] = useState(
    article
      ? {
          title: article.title,
          category: article.category,
          content: article.content,
          tags: (article.tags || []).join(", "),
        }
      : EMPTY_FORM
  );
 
  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
 
  const handleSubmit = (e) => {
    e.preventDefault();
 
    if (!form.title.trim()) return toast.warning("Please enter a title.");
    if (!form.category) return toast.warning("Please select a category.");
    if (!form.content.trim()) return toast.warning("Please enter the article content.");
 
    const tags = [...new Set(form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];
 
    onSubmit({
      title: form.title.trim(),
      category: form.category,
      content: form.content.trim(),
      tags,
    });
  };
 
  return (
    <form id={FORM_ID} onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label fw-semibold small">
          Title <span className="text-danger">*</span>
        </label>
        <input
          name="title"
          className="form-control form-control-sm"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. How to reset your password"
          maxLength={150}
        />
        {isEdit && <div className="form-text">Changing the title also changes the article's URL slug.</div>}
      </div>
 
      <div className="mb-3">
        <label className="form-label fw-semibold small">
          Category <span className="text-danger">*</span>
        </label>
        <select name="category" className="form-select form-select-sm py-2" value={form.category} onChange={handleChange}>
          <option value="">Select a category</option>
          {CATEGORIES.map((slug) => (
            <option key={slug} value={slug}>
              {formatCategory(slug)}
            </option>
          ))}
        </select>
      </div>
 
      <div className="mb-3">
        <label className="form-label fw-semibold small">
          Content <span className="text-danger">*</span>
        </label>
        <textarea
          name="content"
          className="form-control form-control-sm"
          rows={7}
          value={form.content}
          onChange={handleChange}
          placeholder="Write the full article here..."
        />
      </div>
 
      <div>
        <label className="form-label fw-semibold small">Tags</label>
        <input
          name="tags"
          className="form-control form-control-sm"
          value={form.tags}
          onChange={handleChange}
          placeholder="Separate with commas: password, login, security"
        />
      </div>
    </form>
  );
}
 
// ── MAIN PAGE ──────────────────────────────────────────────────────────────
const ManageArticles = () => {
  // Reading / searching the list
  const { articleLoading: listLoading, articles, handleGetArticles, handleSearchArticles } = useArticle();
  // Create / update / delete
  const { articleLoading: saving, handleCreateArticle, handleUpdateArticle, handleDeleteArticle } = useArticleModeration();
 
  const [activeQuery, setActiveQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
 
  // Modal visibility is kept separate from the data it shows, so the content
  // doesn't change while the modal is fading out.
  const [showForm, setShowForm] = useState(false);
  const [formKey, setFormKey] = useState(0); // forces a fresh form every time it opens
  const [editingArticle, setEditingArticle] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
 
  // Initial load
  useEffect(() => {
    handleGetArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  const loadArticles = (query) => {
    if (query) handleSearchArticles(query);
    else handleGetArticles();
    setVisibleCount(PAGE_SIZE);
  };
 
  // AdminSearchBar already debounces typing, so results update live — no Enter needed
  const handleSearch = (value) => {
    const query = value.trim();
    // Too short to search: show the full list so it always matches the search box
    const effectiveQuery = query.length >= MIN_SEARCH_LENGTH ? query : "";
    setActiveQuery(effectiveQuery);
    loadArticles(effectiveQuery);
  };
 
  const handleClear = () => {
    setActiveQuery("");
    loadArticles("");
  };
 
  // ── Modals ──
  const openCreateModal = () => {
    setEditingArticle(null);
    setFormKey((k) => k + 1);
    setShowForm(true);
  };
 
  const openUpdateModal = (article) => {
    setEditingArticle(article);
    setFormKey((k) => k + 1);
    setShowForm(true);
  };
 
  const closeFormModal = () => {
    if (saving) return;
    setShowForm(false);
  };
 
  const openDeleteModal = (article) => {
    setDeleteTarget(article);
    setShowDelete(true);
  };
 
  const closeDeleteModal = () => {
    if (saving) return;
    setShowDelete(false);
  };
 
  const handleFormSubmit = async (payload) => {
    const result = editingArticle
      ? await handleUpdateArticle(editingArticle._id, payload)
      : await handleCreateArticle(payload);
 
    if (result) {
      setShowForm(false);
      loadArticles(activeQuery); // refresh, keeping the current search
    }
  };
 
  const handleConfirmDelete = async () => {
    const result = await handleDeleteArticle(deleteTarget._id);
    if (result) {
      setShowDelete(false);
      loadArticles(activeQuery);
    }
  };
 
  const initialLoading = listLoading && articles.length === 0;
  const visibleArticles = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;
 
  return (
    <div className="py-2">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <h1 className="fs-5 me-3 mb-0">Manage Articles</h1>

        <div className="d-flex align-items-center gap-2 flex-wrap flex-md-nowrap">
          <AdminSearchBar type="articles" onSearch={handleSearch} onClear={handleClear} />
          <button
            onClick={openCreateModal}
            className="btn btn-dark btn-sm rounded-1 d-inline-flex align-items-center gap-1 px-3 py-2 flex-shrink-0"
            style={{ fontSize: 13 }}
          >
            <IconPlus size={16} /> New Article
          </button>
        </div>
      </div>
 
      {/* Table */}
      <div className="border rounded-3 bg-white">
        <div className="table-responsive" style={{ opacity: listLoading && !initialLoading ? 0.6 : 1, transition: "opacity 0.15s" }}>
          <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th className="text-start">Title</th>
                <th>Category</th>
                <th>Views</th>
                <th>Helpful</th>
                <th>Updated</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan={7}>
                      <div className="bg-light rounded-2" style={{ height: 32 }} />
                    </td>
                  </tr>
                ))
              ) : visibleArticles.length > 0 ? (
                visibleArticles.map((item, idx) => (
                  <tr className="border-bottom" key={item._id}>
                    <td className="text-muted">{idx + 1}</td>
                    <td className="text-start">
                      <div style={{ maxWidth: 360, minWidth: 200 }}>
                        <div className="fw-semibold text-dark text-truncate">{item.title}</div>
                        <div className="text-muted text-truncate" style={{ fontSize: 12 }}>
                          {item.content}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="rounded-pill px-2 py-1 fw-semibold" style={{ fontSize: 11, ...getBadgeStyle(item.category) }}>
                        {formatCategory(item.category)}
                      </span>
                    </td>
                    <td>
                      <span className="d-inline-flex align-items-center gap-1 text-secondary">
                        <IconEye size={14} /> {item.views}
                      </span>
                    </td>
                    <td>
                      <span className="d-inline-flex align-items-center gap-3 text-secondary">
                        <span className="d-inline-flex align-items-center gap-1">
                          <IconThumbUp size={14} /> {item.helpful?.yes || 0}
                        </span>
                        <span className="d-inline-flex align-items-center gap-1">
                          <IconThumbDown size={14} /> {item.helpful?.no || 0}
                        </span>
                      </span>
                    </td>
                    <td className="text-secondary" style={{ whiteSpace: "nowrap" }}>
                      {formatDate(item.updatedAt)}
                    </td>
                    <td>
                      <div className="d-flex align-items-center justify-content-end">
                        <button
                          type="button"
                          title="Edit"
                          className="btn btn-sm btn-outline-primary me-1 p-0"
                          onClick={() => openUpdateModal(item)}
                        >
                          <IconEdit stroke={1.5} size={20} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          className="btn btn-sm btn-outline-danger p-0"
                          onClick={() => openDeleteModal(item)}
                        >
                          <IconTrash stroke={1.5} size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-secondary">
                    <IconSearchOff size={40} stroke={1.5} className="mb-2" />
                    <div>{activeQuery ? "No articles match your search." : "No articles yet. Create your first one."}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
 
      {/* Show more */}
      {hasMore && !initialLoading && (
        <div className="text-center mt-3">
          <button
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="btn btn-sm btn-dark border-0 rounded-pill px-3 py-2"
            style={{ fontSize: 13 }}
          >
            Show More <span className="opacity-75 ms-1" style={{ fontSize: 11 }}>({articles.length - visibleCount} remaining)</span>
          </button>
        </div>
      )}
 
      {/* Create / Edit modal */}
      <Modal
        show={showForm}
        onClose={closeFormModal}
        title={editingArticle ? "Edit Article" : "New Article"}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeFormModal} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form={FORM_ID} className="btn btn-sm btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>Saving...
                </>
              ) : editingArticle ? (
                "Save Changes"
              ) : (
                "Create Article"
              )}
            </button>
          </>
        }
      >
        <ArticleForm key={formKey} article={editingArticle} onSubmit={handleFormSubmit} />
      </Modal>
 
      {/* Delete modal */}
      <Modal
        show={showDelete}
        onClose={closeDeleteModal}
        title="Delete this article?"
        footer={
          <>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeDeleteModal} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-sm btn-danger" onClick={handleConfirmDelete} disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </>
        }
      >
        <p className="mb-0 text-secondary">
          "<strong className="text-dark">{deleteTarget?.title}</strong>" will be permanently removed from the Help Center. This can't be undone.
        </p>
      </Modal>
    </div>
  );
};
 
export default ManageArticles;