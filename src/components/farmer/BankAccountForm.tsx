'use client'

import { useState } from 'react'
import { Building2, Check, Plus } from 'lucide-react'

interface BankAccount {
  id: string
  bank_code: string
  bank_name: string
  account_number: string
  account_name: string
  is_default: boolean
  is_verified: boolean
}

interface BankAccountFormProps {
  defaultAccount?: BankAccount | null
  allAccounts: BankAccount[]
}

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '063', name: 'Diamond Bank' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '084', name: 'Enterprise Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '014', name: 'Mainstreet Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '039', name: 'Stanbic IBTC Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
]

export function BankAccountForm({ defaultAccount, allAccounts }: BankAccountFormProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAddAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(e.currentTarget)
    const bankCode = formData.get('bankCode') as string
    const accountNumber = formData.get('accountNumber') as string

    try {
      const response = await fetch('/api/farmer/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankCode, accountNumber }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to add bank account')
      } else {
        setSuccess('Bank account added successfully!')
        setIsAdding(false)
        // Reload page to show new account
        window.location.reload()
      }
    } catch {
      setError('Failed to add bank account')
    } finally {
      setIsLoading(false)
    }
  }

  if (allAccounts.length === 0 || isAdding) {
    return (
      <form onSubmit={handleAddAccount} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select Bank</label>
          <select 
            name="bankCode" 
            className="w-full border rounded-md p-2 bg-background"
            required
          >
            <option value="">Choose a bank...</option>
            {NIGERIAN_BANKS.map(bank => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Account Number</label>
          <input
            name="accountNumber"
            type="text"
            pattern="[0-9]{10}"
            maxLength={10}
            placeholder="10-digit account number"
            className="w-full border rounded-md p-2 bg-background"
            required
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded">
            {success}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-pact-green text-white px-4 py-2 rounded-md hover:bg-pact-green/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Add Account'}
          </button>
          {allAccounts.length > 0 && (
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="border px-4 py-2 rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      {/* Existing accounts */}
      <div className="space-y-2">
        {allAccounts.map(account => (
          <div 
            key={account.id} 
            className={`flex items-center justify-between p-3 border rounded-lg ${
              account.is_default ? 'border-pact-green bg-pact-green/5' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{account.bank_name}</div>
                <div className="text-sm text-muted-foreground">
                  {account.account_number} • {account.account_name}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {account.is_verified && (
                <span className="flex items-center text-xs text-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Verified
                </span>
              )}
              {account.is_default && (
                <span className="text-xs bg-pact-green/20 text-pact-green px-2 py-0.5 rounded">
                  Default
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add new account button */}
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 text-sm text-pact-green hover:underline"
      >
        <Plus className="h-4 w-4" />
        Add another bank account
      </button>
    </div>
  )
}
