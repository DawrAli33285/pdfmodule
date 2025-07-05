"use client"

// Example: Embed account selection in your dashboard
import { useState, useEffect } from "react"

function YourDashboard() {
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    // Fetch Basiq accounts
    const userId = localStorage.getItem("basiq_user_id")
    if (userId) {
      fetch(`/api/users/${userId}/accounts`)
        .then((res) => res.json())
        .then((data) => setAccounts(data.data || []))
    }
  }, [])

  return (
    <div>
      {/* Your existing dashboard content */}

      {/* Basiq accounts section */}
      <section>
        <h2>Connected Bank Accounts</h2>
        {accounts.map((account) => (
          <div key={account.id}>
            {account.name}: ${account.balance?.current || "0.00"}
          </div>
        ))}
      </section>
    </div>
  )
}
