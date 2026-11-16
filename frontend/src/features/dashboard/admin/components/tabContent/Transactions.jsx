import React, { useEffect, useState } from 'react'
import useWalletModeration from '../../hooks/useWalletModeration.js'
import useAdminSearch from '../../hooks/useAdminSearch'
import AdminSearchBar from '../AdminSearcBar.jsx'
import Modal from "@/components/Model"

const TYPE_BADGE = {
  order_payment: 'text-danger border-danger',
  wallet_credit: 'text-success border-success',
  commission: 'text-warning border-warning',
  withdrawal: 'text-danger border-danger',
  subscription_purchase: 'text-info border-info',
  feature_purchase: 'text-info border-info',
  refund: 'text-secondary border-secondary',
}

const STATUS_BADGE = {
  pending: 'text-warning border-warning',
  completed: 'text-success border-success',
  failed: 'text-danger border-danger',
}

const TYPE_LABEL = {
  order_payment: 'Order Payment',
  wallet_credit: 'Payment Received',
  commission: 'Commission',
  withdrawal: 'Withdrawal',
  subscription_purchase: 'Subscription',
  featured_purchase: 'Featured Ad',
  order_refund: 'Refund',
}

const Transactions = () => {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTxn, setSelectedTxn] = useState(null)

  const { adminWalletLoading, transactions, handleGetAllTransactions } = useWalletModeration()

  // Search bar sirf "transactions" type search karega
  const {
    results: searchResults,
    searchLoading,
    handleSearch,
    clearSearch,
  } = useAdminSearch('transactions')

  // Jab tak search active nahi, table normal transactions dikhayegi
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const params = {}
    if (typeFilter) params.type = typeFilter
    if (statusFilter) params.status = statusFilter
    handleGetAllTransactions(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter])

  const onSearch = (query) => {
    setIsSearching(true)
    handleSearch(query)
  }

  const onClearSearch = () => {
    setIsSearching(false)
    clearSearch()
  }

  const displayedTransactions = isSearching ? searchResults : transactions
  const isLoading = isSearching ? searchLoading : (adminWalletLoading && transactions.length === 0)

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 mb-md-1">
        <h1 className="fs-5 me-3 mb-0">All Transactions</h1>
        <AdminSearchBar
          type="transactions"
          placeholder="Search transactions..."
          onSearch={onSearch}
          onClear={onClearSearch}
        />
      </div>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="table-responsive border rounded-2">
        <table className="table table-hover rounded-2 align-middle mb-0">
          <thead>
            <tr>
              <th className='text-start rounded-start ps-3'>User</th>
              <th className='text-start' style={{ width: "280px" }}>Description</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th className='rounded-end pe-3'>Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : displayedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted">
                  No transactions found
                </td>
              </tr>
            ) : (
              displayedTransactions.map((txn) => (
                <tr
                  key={txn._id}
                  onClick={() => setSelectedTxn(txn)}
                  role="button"
                  style={{ cursor: 'pointer' }}
                  className="border-bottom"
                >
                  <td className="text-start ps-3">
                    <p className="mb-0 small fw-medium">{txn.user?.username || '—'}</p>
                    <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>{txn.user?.email}</p>
                  </td>
                  <td className="text-start small text-muted">
                    <span
                      className="d-inline-block text-truncate"
                      style={{ maxWidth: 280, verticalAlign: 'bottom' }}
                      title={txn.description || ''}
                    >
                      {txn.description || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`border rounded-1 px-2 py-1 small fw-medium text-capitalize ${TYPE_BADGE[txn.type] || 'text-muted border-secondary'}`}>
                      {TYPE_LABEL[txn.type] || txn.type}
                    </span>
                  </td>
                  <td className="fw-medium">Rs {txn.amount?.toLocaleString()}</td>
                  <td>
                    <span className={`border rounded-1 px-2 py-1 small fw-medium text-capitalize ${STATUS_BADGE[txn.status] || 'text-muted border-secondary'}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="small text-muted pe-3">
                    {new Date(txn.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction detail modal */}
      <Modal
        title="Transaction Details"
        show={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        footer={
          <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setSelectedTxn(null)}>
            Close
          </button>
        }
      >
        {selectedTxn && (
          <div className="d-flex flex-column gap-3">
            <div>
              <p className="mb-0 text-muted small">User</p>
              <p className="mb-0 fw-medium">{selectedTxn.user?.username || '—'}</p>
              <p className="mb-0 text-muted small">{selectedTxn.user?.email}</p>
            </div>

            <div className="d-flex flex-wrap gap-3">
              <div>
                <p className="mb-2 text-muted small">Type</p>
                <span className={`border rounded-1 px-2 py-1 small fw-medium text-capitalize ${TYPE_BADGE[selectedTxn.type] || 'text-muted border-secondary'}`}>
                  {TYPE_LABEL[selectedTxn.type] || selectedTxn.type}
                </span>
              </div>
              <div>
                <p className="mb-2 text-muted small">Status</p>
                <span className={`border rounded-1 px-2 py-1 small fw-medium text-capitalize ${STATUS_BADGE[selectedTxn.status] || 'text-muted border-secondary'}`}>
                  {selectedTxn.status}
                </span>
              </div>
            </div>

            <div>
            <span className="mb-0 text-muted">Amount : <span className="mb-0 text-dark fw-semibold">Rs {selectedTxn.amount?.toLocaleString()}</span></span>
            </div>

            <div>
              <p className="mb-0 text-muted small">Description</p>
              <p className="mb-0">{selectedTxn.description || '—'}</p>
            </div>

            <div>
              <p className="mb-0 text-muted small">Date</p>
              <p className="mb-0">
                {new Date(selectedTxn.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                {new Date(selectedTxn.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {selectedTxn._id && (
              <div>
                <p className="mb-0 text-muted small">Transaction ID</p>
                <p className="mb-0 small text-muted" style={{ wordBreak: 'break-all' }}>{selectedTxn._id}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Transactions