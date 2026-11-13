import { useEffect, useState } from "react";
import * as TablerIcons from "@tabler/icons-react";
import { IconEdit, IconTrash, IconPlus, IconToggleLeft, IconToggleRight, IconChevronLeft, IconCategory, IconSearch, IconAlertTriangle } from "@tabler/icons-react";
import Modal from "@/components/Model";
import useCategoryModeration from "../../hooks/useCategoryModeration";

const SUGGESTED_ICONS = [
  "IconCar", "IconHome", "IconDeviceMobile", "IconShirt", "IconSofa", "IconTool",
  "IconBike", "IconBabyCarriage", "IconBriefcase", "IconBook", "IconPaw",
  "IconDeviceLaptop", "IconCamera", "IconMusic", "IconBuildingStore", "IconPlant",
  "IconWatch", "IconArmchair", "IconDeviceGamepad2", "IconShoe", "IconDog",
  "IconBuildingSkyscraper", "IconArmchair2", "IconDeviceTv",
];

const getIconComponent = (iconName) => {
  const Icon = TablerIcons[iconName];
  return Icon ? <Icon size={20} stroke={1.75} /> : <IconCategory size={20} stroke={1.75} />;
};

const ManageCategory = () => {
  const { categoryLoading, allCategories, handleCreateCategory, handleReadAdminAllCategoryCategory, handleUpdateCategory, handleToggleCategory, handleDeleteCategory,
  } = useCategoryModeration();

  const [activeParent, setActiveParent] = useState(null); // null = viewing top-level parents
  const [breadcrumbName, setBreadcrumbName] = useState("");

  // ── Create modal state ──────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createIcon, setCreateIcon] = useState("");
  const [createIconSearch, setCreateIconSearch] = useState("");

  // ── Update modal state ──────────────────────────────
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateTarget, setUpdateTarget] = useState(null);
  const [updateName, setUpdateName] = useState("");
  const [updateIcon, setUpdateIcon] = useState("");
  const [updateIconSearch, setUpdateIconSearch] = useState("");

  // ── Delete modal state ──────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    handleReadAdminAllCategoryCategory(activeParent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParent]);

  // ── Navigation ──────────────────────────────────────
  const enterSubcategories = (cat) => {
    setActiveParent(cat._id);
    setBreadcrumbName(cat.name);
  };

  const backToParents = () => {
    setActiveParent(null);
    setBreadcrumbName("");
  };

  // ── Create handlers ─────────────────────────────────
  const openCreateModal = () => {
    setCreateName("");
    setCreateIcon("");
    setCreateIconSearch("");
    setShowCreateModal(true);
  };

  const closeCreateModal = () => setShowCreateModal(false);

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;

    const success = await handleCreateCategory({ name: createName, icon: createIcon, parent: activeParent });
    if (success) {
      closeCreateModal();
      handleReadAdminAllCategoryCategory(activeParent);
    }
  };

  const filteredCreateIcons = createIconSearch
    ? SUGGESTED_ICONS.filter((i) => i.toLowerCase().includes(createIconSearch.toLowerCase()))
    : SUGGESTED_ICONS;

  // ── Update handlers ─────────────────────────────────
  const openUpdateModal = (cat) => {
    setUpdateTarget(cat);
    setUpdateName(cat.name || "");
    setUpdateIcon(cat.icon || "");
    setUpdateIconSearch(cat.icon || "");
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setUpdateTarget(null);
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    if (!updateName.trim() || !updateTarget) return;

    const parent = updateTarget.parent?._id || updateTarget.parent || null;
    const success = await handleUpdateCategory(updateTarget._id, { name: updateName, icon: updateIcon, parent });
    if (success) {
      closeUpdateModal();
      handleReadAdminAllCategoryCategory(activeParent);
    }
  };

  const filteredUpdateIcons = updateIconSearch
    ? SUGGESTED_ICONS.filter((i) => i.toLowerCase().includes(updateIconSearch.toLowerCase()))
    : SUGGESTED_ICONS;

  // ── Delete handlers ─────────────────────────────────
  const openDeleteModal = (cat) => {
    setDeleteTarget(cat);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const success = await handleDeleteCategory(deleteTarget._id);
    if (success) {
      closeDeleteModal();
      handleReadAdminAllCategoryCategory(activeParent);
    }
  };

  // ── Toggle handler ──────────────────────────────────
  const onToggle = async (id) => {
    const success = await handleToggleCategory(id);
    if (success) handleReadAdminAllCategoryCategory(activeParent);
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="fs-5 me-3">Manage Categories</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 small">
              <li
                className={`breadcrumb-item ${!activeParent ? "active" : ""}`}
                style={{ cursor: activeParent ? "pointer" : "default" }}
                onClick={backToParents}>
                All Categories
              </li>
              {activeParent && (
                <li className="breadcrumb-item active" aria-current="page">
                  {breadcrumbName}
                </li>
              )}
            </ol>
          </nav>
        </div>

        <div className="d-flex gap-2">
          {activeParent && (
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={backToParents}>
              <IconChevronLeft size={16} /> Back
            </button>
          )}
          <button className="btn btn-sm btn-dark d-flex align-items-center gap-1" onClick={openCreateModal}>
            <IconPlus size={16} /> {activeParent ? "Add Subcategory" : "Add Category"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive border rounded-2 position-relative">
        <table className="table table-hover rounded-2 align-middle mb-0">
          <thead>
            <tr>
              <th className="rounded-start" style={{ width: "60px" }}>Icon</th>
              <th className="text-start">Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th className="rounded-end text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {categoryLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : allCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted">
                  No categories found
                </td>
              </tr>
            ) : (
              allCategories.map((cat) => (
                <tr
                  key={cat._id}
                  className="border-bottom"
                  role={!activeParent ? "button" : undefined}
                  style={!activeParent ? { cursor: "pointer" } : {}}
                  onClick={!activeParent ? () => enterSubcategories(cat) : undefined}
                >
                  <td className="px-xl-0">
                    <span className="d-inline-flex align-items-center justify-content-center bg-light rounded-2 p-2">
                      {getIconComponent(cat.icon)}
                    </span>
                  </td>
                  <td className="text-start">
                    <span className={!activeParent ? "fw-medium text-dark" : ""}>{cat.name}</span>
                    {!activeParent && (
                      <IconChevronLeft size={14} className="ms-1 text-muted" style={{ transform: "rotate(180deg)" }} />
                    )}
                  </td>
                  <td className="text-muted small">{cat.slug}</td>
                  <td>
                    <span className={`badge text-white fw-normal p-2 ${cat.isActive ? "bg-success" : "bg-secondary"}`}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div
                      className="d-flex justify-content-center"
                      style={{ width: "fit-content", margin: "0 auto" }}
                    >
                      <button
                        type="button"
                        title={cat.isActive ? "Deactivate" : "Activate"}
                        className="btn btn-sm btn-outline-secondary me-1 p-0"
                        onClick={() => onToggle(cat._id)}
                      >
                        {cat.isActive ? <IconToggleRight stroke={1.5} size={20} /> : <IconToggleLeft stroke={1.5} size={20} />}
                      </button>
                      <button
                        type="button"
                        title="Edit"
                        className="btn btn-sm btn-outline-primary me-1 p-0"
                        onClick={() => openUpdateModal(cat)}
                      >
                        <IconEdit stroke={1.5} size={20} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        className="btn btn-sm btn-outline-danger p-0"
                        onClick={() => openDeleteModal(cat)}
                      >
                        <IconTrash stroke={1.5} size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create Modal ─────────────────────────────── */}
      <Modal show={showCreateModal} onClose={closeCreateModal} title={activeParent ? "Add Subcategory" : "Add Category"}>
        <form onSubmit={submitCreate}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Vehicles"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Icon</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-white">
                <IconSearch size={16} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search or type Tabler icon name (e.g. IconCar)"
                value={createIconSearch}
                onChange={(e) => {
                  setCreateIconSearch(e.target.value);
                  setCreateIcon(e.target.value);
                }}
              />
              {createIcon && <span className="input-group-text bg-white">{getIconComponent(createIcon)}</span>}
            </div>

            <div className="d-flex flex-wrap gap-2">
              {filteredCreateIcons.map((iconName) => (
                <button
                  type="button"
                  key={iconName}
                  className={`btn btn-sm d-flex align-items-center justify-content-center ${
                    createIcon === iconName ? "btn-dark" : "btn-outline-secondary"
                  }`}
                  style={{ width: "38px", height: "38px" }}
                  title={iconName}
                  onClick={() => {
                    setCreateIcon(iconName);
                    setCreateIconSearch(iconName);
                  }}
                >
                  {getIconComponent(iconName)}
                </button>
              ))}
              {filteredCreateIcons.length === 0 && (
                <p className="text-muted small mb-0">No matching icon found — you can still type an exact Tabler icon name above.</p>
              )}
            </div>
          </div>

          {activeParent && (
            <p className="text-muted small mb-0">
              This will be added as a subcategory of <strong>{breadcrumbName}</strong>.
            </p>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-outline-secondary" onClick={closeCreateModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark" disabled={categoryLoading}>
              {categoryLoading ? "Creating..." : "Create Category"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Update Modal ─────────────────────────────── */}
      <Modal show={showUpdateModal} onClose={closeUpdateModal} title="Edit Category">
        <form onSubmit={submitUpdate}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Vehicles"
              value={updateName}
              onChange={(e) => setUpdateName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Icon</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-white">
                <IconSearch size={16} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search or type Tabler icon name (e.g. IconCar)"
                value={updateIconSearch}
                onChange={(e) => {
                  setUpdateIconSearch(e.target.value);
                  setUpdateIcon(e.target.value);
                }}
              />
              {updateIcon && <span className="input-group-text bg-white">{getIconComponent(updateIcon)}</span>}
            </div>

            <div className="d-flex flex-wrap gap-2">
              {filteredUpdateIcons.map((iconName) => (
                <button
                  type="button"
                  key={iconName}
                  className={`btn btn-sm d-flex align-items-center justify-content-center ${
                    updateIcon === iconName ? "btn-dark" : "btn-outline-secondary"
                  }`}
                  style={{ width: "38px", height: "38px" }}
                  title={iconName}
                  onClick={() => {
                    setUpdateIcon(iconName);
                    setUpdateIconSearch(iconName);
                  }}
                >
                  {getIconComponent(iconName)}
                </button>
              ))}
              {filteredUpdateIcons.length === 0 && (
                <p className="text-muted small mb-0">No matching icon found — you can still type an exact Tabler icon name above.</p>
              )}
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-outline-secondary" onClick={closeUpdateModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark" disabled={categoryLoading}>
              {categoryLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Modal ─────────────────────────────── */}
      <Modal
        show={showDeleteModal}
        onClose={closeDeleteModal}
        title="Delete Category"
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={closeDeleteModal}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" disabled={categoryLoading} onClick={confirmDelete}>
              {categoryLoading ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <div className="alert alert-danger d-flex align-items-start gap-2" role="alert">
          <IconAlertTriangle stroke={1.5} size={20} className="mt-1 flex-shrink-0" />
          <div>This action cannot be undone. Any subcategories or listings tied to it must be removed first.</div>
        </div>
        <p className="mb-0">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
};

export default ManageCategory;