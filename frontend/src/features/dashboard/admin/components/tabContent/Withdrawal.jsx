import React, { useEffect, useState } from 'react'
import { IconCheck, IconX } from '@tabler/icons-react'
import useWalletModeration from '../../hooks/useWalletModeration.js'
import useAdminSearch from '../../hooks/useAdminSearch'
import AdminSearchBar from '../AdminSearcBar.jsx'
import Modal from "@/components/Model.jsx"

const STATUS_BADGE = {
  pending: 'text-warning border-warning',
  completed: 'text-success border-success',
  rejected: 'text-danger border-danger',
}

const Withdrawal = () => {
  const [statusFilter, setStatusFilter] = useState('') // '' = All Statuses (default)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [completeTarget, setCompleteTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const { adminWalletLoading, withdrawals, handleGetAllWithdrawals, handleCompleteWithdrawal, handleRejectWithdrawal } = useWalletModeration()

  // Search bar sirf "withdrawals" type search karega
  const {
    results: searchResults,
    searchLoading,
    handleSearch,
    clearSearch,
  } = useAdminSearch('withdrawals')

  // Jab tak search active nahi, table normal withdrawals dikhayegi
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const params = {}
    if (statusFilter) params.status = statusFilter
    handleGetAllWithdrawals(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const refresh = () => {
    const params = {}
    if (statusFilter) params.status = statusFilter
    handleGetAllWithdrawals(params)
  }

  const confirmComplete = async () => {
    await handleCompleteWithdrawal(completeTarget)
    setCompleteTarget(null)
    setSelectedWithdrawal(null)
    refresh()
  }

  const confirmReject = async () => {
    await handleRejectWithdrawal(rejectTarget, { reason: rejectReason })
    setRejectTarget(null)
    setRejectReason('')
    setSelectedWithdrawal(null)
    refresh()
  }

  const onSearch = (query) => {
    setIsSearching(true)
    handleSearch(query)
  }

  const onClearSearch = () => {
    setIsSearching(false)
    clearSearch()
  }

  const displayedWithdrawals = isSearching ? searchResults : withdrawals
  const isLoading = isSearching ? searchLoading : (adminWalletLoading && withdrawals.length === 0)

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 mb-md-1">
        <h1 className="fs-5 me-3 mb-0">Withdrawal Requests</h1>
        <AdminSearchBar
          type="withdrawals"
          placeholder="Search withdrawals..."
          onSearch={onSearch}
          onClear={onClearSearch}
        />
      </div>

      {/* Filter */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="table-responsive border rounded-2">
        <table className="table table-hover rounded-2 align-middle mb-0">
          <thead>
            <tr className="text-muted small" style={{ textTransform: 'capitalize', backgroundColor: 'var(--bs-light, #f8f9fa)' }}>
              <th className="rounded-start text-start ps-3">Seller</th>
              <th>Amount</th>
              <th>Commission</th>
              <th>Net Payout</th>
              <th>Method</th>
              <th>Account</th>
              <th>Status</th>
              <th>Requested</th>
              <th className="rounded-end text-end pe-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : displayedWithdrawals.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4 text-muted">
                  No withdrawal requests found
                </td>
              </tr>
            ) : (
              displayedWithdrawals.map((wd) => (
                <tr
                  key={wd._id}
                  onClick={() => setSelectedWithdrawal(wd)}
                  role="button"
                  style={{ cursor: 'pointer' }}
                  className="border-bottom"
                >
                  <td className="text-start ps-3">
                    <p className="mb-0 small fw-medium">{wd.seller?.username || '—'}</p>
                    <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>{wd.seller?.email}</p>
                  </td>
                  <td className="fw-medium">Rs {wd.amount?.toLocaleString()}</td>
                  <td className="text-muted small">Rs {wd.commissionAmount?.toLocaleString()}</td>
                  <td className="fw-medium">Rs {wd.netAmount?.toLocaleString()}</td>
                  <td className="text-capitalize">{wd.payoutMethod}</td>
                  <td className="small text-muted" style={{ maxWidth: 200 }}>
                    {wd.payoutDetails?.accountTitle} — {wd.payoutDetails?.accountNumber}
                  </td>
                  <td>
                    <span className={`border rounded-1 px-2 py-1 small text-capitalize ${STATUS_BADGE[wd.status] || 'text-muted border-secondary'}`}>
                      {wd.status}
                    </span>
                  </td>
                  <td className="small text-muted">
                    {new Date(wd.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="text-end" onClick={(e) => e.stopPropagation()}>
                    {wd.status === 'pending' ? (
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-outline-success btn-sm rounded-1 p-0"
                          onClick={() => setCompleteTarget(wd._id)}
                          disabled={adminWalletLoading}
                        >
                          <IconCheck size={20}/>
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm rounded-1 p-0"
                          onClick={() => setRejectTarget(wd._id)}
                          disabled={adminWalletLoading}
                        >
                          <IconX size={20}/>
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Withdrawal detail modal — opens on row click */}
      <Modal
        title="Withdrawal Details"
        show={!!selectedWithdrawal}
        onClose={() => setSelectedWithdrawal(null)}
        footer={
          selectedWithdrawal?.status === 'pending' ? (
            <>
              <button
                type="button"
                className="btn btn-outline-danger rounded-2"
                onClick={() => setRejectTarget(selectedWithdrawal._id)}
                disabled={adminWalletLoading}
              >
                <IconX size={20} className="me-1" />
                Reject
              </button>
              <button
                type="button"
                className="btn btn-outline-success rounded-2"
                onClick={() => setCompleteTarget(selectedWithdrawal._id)}
                disabled={adminWalletLoading}
              >
                <IconCheck size={20} className="me-1" />
                Complete
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setSelectedWithdrawal(null)}>
              Close
            </button>
          )
        }
      >
        {selectedWithdrawal && (
          <div className="d-flex flex-column gap-3">
            <div>
              <p className="mb-0 text-muted small">Seller</p>
              <p className="mb-0 fw-medium">{selectedWithdrawal.seller?.username || '—'}</p>
              <p className="mb-0 text-muted small">{selectedWithdrawal.seller?.email}</p>
            </div>

            <div className="d-flex justify-content-between flex-wrap gap-3">
              <div>
                <p className="mb-0 text-muted small">Status</p>
                <span className={`border rounded-1 px-2 py-1 small text-capitalize ${STATUS_BADGE[selectedWithdrawal.status] || 'text-muted border-secondary'}`}>
                  {selectedWithdrawal.status}
                </span>
              </div>
              <div>
                <p className="mb-0 text-muted small">Method</p>
                <p className="mb-0 fw-medium text-capitalize">{selectedWithdrawal.payoutMethod}</p>
              </div>
              <div>
                <p className="mb-0 text-muted small">Requested</p>
                <p className="mb-0">
                  {new Date(selectedWithdrawal.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="d-flex justify-content-between flex-wrap gap-3 border-top pt-3">
              <div>
                <p className="mb-0 text-muted small">Requested Amount</p>
                <p className="mb-0 fw-semibold">Rs {selectedWithdrawal.amount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="mb-0 text-muted small">Commission</p>
                <p className="mb-0 fw-semibold text-danger">Rs {selectedWithdrawal.commissionAmount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="mb-0 text-muted small">Net Payout</p>
                <p className="mb-0 fw-semibold text-success">Rs {selectedWithdrawal.netAmount?.toLocaleString()}</p>
              </div>
            </div>

            <div className="border-top pt-3">
              <p className="mb-1 text-muted small">Account Details</p>
              <p className="mb-0">{selectedWithdrawal.payoutDetails?.accountTitle}</p>
              <p className="mb-0 text-muted">{selectedWithdrawal.payoutDetails?.accountNumber}</p>
            </div>

            {selectedWithdrawal.status === 'rejected' && selectedWithdrawal.rejectionReason && (
              <div className="alert alert-danger mb-0 small">
                <strong>Rejection reason:</strong> {selectedWithdrawal.rejectionReason}
              </div>
            )}

            {selectedWithdrawal.status === 'pending' && (
              <div className="alert alert-warning mb-0 small">
                Confirm you have transferred the net payout amount before marking this as completed.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Complete confirm modal */}
      <Modal
        title="Complete Withdrawal"
        show={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setCompleteTarget(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-success rounded-2" onClick={confirmComplete} disabled={adminWalletLoading}>
              Mark as Completed
            </button>
          </>
        }
      >
        <p className="mb-0 text-muted">
          Confirm that you have transferred the net payout amount to the seller's account. This action cannot be undone.
        </p>
      </Modal>

      {/* Reject modal */}
      <Modal
        title="Reject Withdrawal"
        show={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason('') }}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => { setRejectTarget(null); setRejectReason('') }}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger rounded-2" onClick={confirmReject} disabled={adminWalletLoading}>
              Reject Request
            </button>
          </>
        }
      >
        <label className="form-label small text-muted">Reason (optional)</label>
        <textarea
          className="form-control"
          rows={2}
          placeholder="Why is this request being rejected?"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        <p className="text-muted small mt-2 mb-0">
          Note: rejecting should credit the amount back to the seller's wallet on the backend.
        </p>
      </Modal>
    </div>
  )
}

export default Withdrawal