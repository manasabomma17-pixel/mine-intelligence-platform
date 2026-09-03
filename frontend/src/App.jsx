import { useEffect, useState } from "react";

const TABS = ["AI Assistant", "Production Intelligence", "Report"];

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => (res.ok ? setBackendStatus("ok") : setBackendStatus("error")))
      .catch(() => setBackendStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-xl font-semibold">Mine Intelligence Platform</h1>
          <span className="text-sm text-gray-500">Backend status: {backendStatus}</span>
        </div>
      </header>

      <nav className="mx-auto max-w-6xl px-4 pt-4">
        <div className="flex space-x-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded px-4 py-2 text-sm font-medium ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {activeTab === "AI Assistant" && <Placeholder label="AI Mining Assistant" />}
        {activeTab === "Production Intelligence" && <Placeholder label="Production Intelligence" />}
        {activeTab === "Report" && <Placeholder label="Automated Mine Intelligence Report" />}
      </main>
    </div>
  );
}

function Placeholder({ label }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
      <p className="text-sm">{label}</p>
      <p className="mt-2 text-xs">Coming in a future phase.</p>
    </div>
  );
}
