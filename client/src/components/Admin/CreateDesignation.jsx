import { useState } from "react";
import { API_BASE_URL } from "../../config";

const CreateDesignation = ({ token, onSuccess }) => {
  const [designation, setDesignation] = useState("");
  const [status, setStatus] = useState(null); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!designation.trim()) {
      setStatus("error");
      setMessage("Designation is required.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/create-designation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ designation }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to create designation.");
        return;
      }

      setStatus("success");
      setMessage("Designation created successfully!");
      setDesignation("");
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  const inputClass = [
    "w-full px-3 py-2 text-sm border rounded-lg outline-none bg-gray-50 text-gray-900 transition-colors",
    status === "error" ? "border-red-400 bg-red-50" : "",
    status === "success" ? "border-green-400 bg-green-50" : "",
    status !== "error" && status !== "success" ? "border-gray-300 focus:border-blue-500" : "",
  ].join(" ");

  return (
    <div className="flex justify-center items-start p-8">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-7 w-full max-w-md">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">New Designation</h2>
            <p className="text-xs text-gray-500 mt-0.5">Add a new role to the system</p>
          </div>
        </div>

        <hr className="border-gray-100 mb-5" />

        {/* Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
            Designation Name
          </label>
          <input
            type="text"
            value={designation}
            onChange={(e) => {
              setDesignation(e.target.value);
              if (status) setStatus(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. Principal, Teacher, Clerk"
            disabled={status === "loading"}
            className={inputClass}
          />
        </div>

        {/* Feedback */}
        {message && (
          <div className={[
            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium mb-4",
            status === "success" ? "bg-green-50 text-green-700 border border-green-200" : "",
            status === "error" ? "bg-red-50 text-red-700 border border-red-200" : "",
          ].join(" ")}>
            <span className="font-bold">{status === "success" ? "✓" : "✕"}</span>
            {message}
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleSubmit}
          disabled={status === "loading"}
          className={[
            "w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors",
            status === "loading"
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 cursor-pointer",
          ].join(" ")}
        >
          {status === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Creating...
            </span>
          ) : (
            "Create Designation"
          )}
        </button>

      </div>
    </div>
  );
};

export default CreateDesignation;