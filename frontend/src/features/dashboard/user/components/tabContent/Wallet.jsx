import React, { useContext, useEffect, useState } from 'react'
import { IconWallet, IconArrowUpRight, IconArrowDownRight, IconReceipt2, IconCashBanknote, IconInfoCircle } from '@tabler/icons-react'

import { AuthContext } from '../../../../auth/AuthContext'
import useWallet from '../../hooks/useWallet'
import useWithdrawal from '../../hooks/useWithdrawal'
import Modal from "@/components//Model"

const TYPE_BADGE = {
  order_payment: 'text-danger border-danger',
  wallet_credit: 'text-success border-success',
  commission: 'text-warning border-warning',
  withdrawal: 'text-danger border-danger',
  subscription_purchase: 'text-info border-info',
  feature_purchase: 'text-info border-info',
  design_purchase: 'text-info border-info',
  refund: 'text-secondary border-secondary',
}

const STATUS_BADGE = {
  pending: 'text-warning border-warning',
  completed: 'text-success border-success',
  failed: 'text-danger border-danger',
  rejected: 'text-danger border-danger',
}

const TYPE_LABEL = {
  order_payment: 'Order Payment',
  wallet_credit: 'Payment Received',
  commission: 'Commission',
  withdrawal: 'Withdrawal',
  subscription_purchase: 'Subscription',
  feature_purchase: 'Featured Ad',
  design_purchase: 'Design Subscription',
  refund: 'Refund',
}

// Buyer only ever sees the money they paid out and refunds they received.
const BUYER_TYPE_LABEL = {
  order_payment: 'Order Payment',
  design_purchase: 'Design Subscription',
  refund: 'Refund',
}

// credit types show a green up-arrow, debit types show a red down-arrow
const CREDIT_TYPES = ['wallet_credit', 'refund']

const PAYOUT_METHODS = [
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'Easypaisa' },
]

const Wallet = () => {
  const { user } = useContext(AuthContext)
  const isSeller = user?.accountType === 'seller'

  const [activeTab, setActiveTab] = useState('transactions') // "transactions" | "withdrawals"
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('bank')
  const [accountTitle, setAccountTitle] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [formError, setFormError] = useState('')
  const [reasonModal, setReasonModal] = useState(null) // rejected withdrawal object

  const { walletLoading, wallet, transactions, handleGetMyWallet, handleGetMyTransactions } = useWallet()
  const { withdrawalLoading, withdrawals, handleRequestWithdrawal, handleGetMyWithdrawals } = useWithdrawal()

  useEffect(() => {
    handleGetMyWallet()
    if (isSeller) {
      handleGetMyWithdrawals()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const params = {}
    if (typeFilter) params.type = typeFilter
    if (statusFilter) params.status = statusFilter
    handleGetMyTransactions(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter])

  // If a buyer somehow lands on the withdrawals tab (stale state), snap back.
  useEffect(() => {
    if (!isSeller && activeTab === 'withdrawals') {
      setActiveTab('transactions')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeller])

  const openWithdrawModal = () => {
    setAmount('')
    setPayoutMethod('bank')
    setAccountTitle('')
    setAccountNumber('')
    setFormError('')
    setShowWithdrawModal(true)
  }

  const submitWithdrawal = async () => {
    const numericAmount = Number(amount)

    if (!numericAmount || numericAmount <= 0) {
      setFormError('Enter a valid amount')
      return
    }
    if (numericAmount > (wallet?.balance ?? 0)) {
      setFormError('Amount exceeds your available balance')
      return
    }
    if (!accountTitle.trim() || !accountNumber.trim()) {
      setFormError('Enter your account title and account number')
      return
    }

    setFormError('')
    const result = await handleRequestWithdrawal({
      amount: numericAmount,
      payoutMethod,
      payoutDetails: { accountTitle, accountNumber },
    })

    if (result) {
      setShowWithdrawModal(false)
      handleGetMyWallet()
      handleGetMyWithdrawals()
    }
  }

  const typeOptions = isSeller ? TYPE_LABEL : BUYER_TYPE_LABEL

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h1 className="fs-5 me-3 mb-0">{isSeller ? 'Wallet' : 'Transactions'}</h1>
      </div>

      {/* Balance card + Withdraw — seller only */}
      {isSeller && (
        <div className="border rounded-3 p-4 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center rounded-3 bg-light flex-shrink-0" style={{ width: 48, height: 48 }}>
              <IconWallet size={24} className="text-primary" />
            </div>
            <div>
              <p className="mb-0 text-muted small">Available Balance</p>
              <h3 className="mb-0 fw-semibold">{walletLoading && !wallet ? '...' : `Rs ${(wallet?.balance ?? 0).toLocaleString()}`}</h3>
            </div>
          </div>
          <button className="btn btn-primary rounded-2" onClick={openWithdrawModal} disabled={!wallet || wallet.balance <= 0}>
            <IconCashBanknote size={16} className="me-2" />
            Withdraw
          </button>
        </div>
      )}

      {/* Tabs — Withdrawal Requests only for seller */}
      <ul className="nav nav-pills mb-3 gap-2">
        <li className="nav-item">
          <button className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
            <IconReceipt2 size={16} />
            Transactions
          </button>
        </li>
        {isSeller && (
          <li className="nav-item">
            <button className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'withdrawals' ? 'active' : ''}`} onClick={() => setActiveTab('withdrawals')}>
              <IconCashBanknote size={16} />
              Withdrawal Requests
            </button>
          </li>
        )}
      </ul>

      {activeTab === 'transactions' && (
        <>
          {/* Filters */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            <select className="form-select form-select-sm" style={{ width: 'auto', maxWidth: '100%' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {Object.entries(typeOptions).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select className="form-select form-select-sm" style={{ width: 'auto', maxWidth: '100%' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Transaction list */}
          {walletLoading && transactions.length === 0 ? (
            <div className="text-center py-5 text-muted">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-5">
              <IconReceipt2 size={50} className="text-muted mb-2" />
              <h5 className="fw-semibold mb-2 mt-3">No transactions yet</h5>
              <p className="text-muted mb-0">Your payment history will show up here</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {transactions.map((txn) => {
                const isCredit = CREDIT_TYPES.includes(txn.type)
                const typeBadge = TYPE_BADGE[txn.type] || 'text-muted border-secondary'
                const statusBadge = STATUS_BADGE[txn.status] || 'text-muted border-secondary'

                return (
                  <div key={txn._id} className="border rounded-3 p-3 d-flex flex-column flex-xxl-row align-items-xxl-center justify-content-between gap-2">
                    {/* Left: icon + description + date */}
                    <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                      <div className={`d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ${isCredit ? 'bg-success-subtle' : 'bg-danger-subtle'}`} style={{ width: 36, height: 36 }}>
                        {isCredit ? <IconArrowDownRight size={18} className="text-success" /> : <IconArrowUpRight size={18} className="text-danger" />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p className="mb-0 small fw-medium text-break">{txn.description || TYPE_LABEL[txn.type] || txn.type}</p>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                          {new Date(txn.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Right: badges + amount */}
                    <div className="d-flex align-items-center flex-wrap gap-2 flex-xxl-shrink-0">
                      <span className={`border rounded-1 px-2 py-1 small fw-medium text-capitalize text-nowrap ${typeBadge}`}>{TYPE_LABEL[txn.type] || txn.type}</span>
                      <span className={`border rounded-1 px-2 py-1 small fw-medium text-capitalize text-nowrap ${statusBadge}`}>{txn.status}</span>
                      <span className={`fw-semibold text-nowrap ms-auto ms-xxl-0 text-end ${isCredit ? 'text-success' : 'text-danger'}`}>
                        {isCredit ? '+' : '-'} Rs {txn.amount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {isSeller && activeTab === 'withdrawals' && (
        <>
          {withdrawalLoading && withdrawals.length === 0 ? (
            <div className="text-center py-5 text-muted">Loading withdrawal requests...</div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-5">
              <IconCashBanknote size={50} className="text-muted mb-2" />
              <h5 className="fw-semibold mb-2 mt-3">No withdrawal requests yet</h5>
              <p className="text-muted mb-0">Requests you submit will show up here</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {withdrawals.map((wd) => {
                const statusBadge = STATUS_BADGE[wd.status] || 'text-muted border-secondary'
                return (
                  <div key={wd._id} className="border rounded-3 p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                      <p className="mb-0 small fw-medium text-capitalize">{PAYOUT_METHODS.find((m) => m.value === wd.payoutMethod)?.label || wd.payoutMethod}</p>
                      <p className="mb-0 text-muted text-break" style={{ fontSize: '12px' }}>{wd.payoutDetails?.accountTitle} — {wd.payoutDetails?.accountNumber}</p>
                      <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                        {new Date(wd.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {/* Right: status badge + reason button (rejected only) + amount */}
                    <div className="d-flex align-items-center justify-content-end gap-3 flex-grow-1">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        {wd.status === 'rejected' && (
                          <button type="button" title="View reason" className="btn btn-sm btn-outline-danger px-1" onClick={() => setReasonModal(wd)}>
                            <IconInfoCircle stroke={1.5} size={20} />
                          </button>
                        )}
                        <span className={`border rounded-1 px-2 py-1 small fw-medium text-capitalize text-nowrap ${statusBadge}`}>{wd.status}</span>
                      </div>
                      <div className="text-end">
                        <p className="mb-0 fw-semibold text-nowrap">Rs {wd.amount?.toLocaleString()}</p>
                        <p className="mb-0 text-muted text-nowrap" style={{ fontSize: '11px' }}>Net: Rs {wd.netAmount?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Withdraw request modal — seller only */}
      {isSeller && (
        <Modal
          title="Request Withdrawal"
          show={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setShowWithdrawModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary rounded-2" onClick={submitWithdrawal} disabled={withdrawalLoading}>Submit Request</button>
            </>
          }
        >
          <div className="mb-3">
            <label className="form-label small text-muted">Amount (Rs)</label>
            <input type="number" className="form-control" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <p className="mb-0 text-muted small mt-1">Available: Rs {(wallet?.balance ?? 0).toLocaleString()}</p>
          </div>

          <div className="mb-3">
            <label className="form-label small text-muted">Payout Method</label>
            <select className="form-select" value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}>
              {PAYOUT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label small text-muted">Account Title</label>
            <input type="text" className="form-control" placeholder="Name on the account" value={accountTitle} onChange={(e) => setAccountTitle(e.target.value)} />
          </div>

          <div className="mb-2">
            <label className="form-label small text-muted">Account Number</label>
            <input type="text" className="form-control" placeholder="Account number, IBAN, or mobile number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          </div>

          {formError && <p className="text-danger small mb-0">{formError}</p>}
        </Modal>
      )}

      {/* Rejection reason modal — seller only */}
      {isSeller && (
        <Modal
          title="Withdrawal Rejected"
          show={!!reasonModal}
          onClose={() => setReasonModal(null)}
          footer={<button type="button" className="btn btn-outline-secondary rounded-2" onClick={() => setReasonModal(null)}>Close</button>}
        >
          <p className="mb-1 small text-muted">Reason from admin</p>
          <p className="mb-0">{reasonModal?.rejectionReason || 'No reason provided'}</p>
        </Modal>
      )}
    </div>
  )
}

export default Wallet