import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser, getForms, getResponses, getCustomSections } from "../store.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import AdminSidebar from "./AdminSidebar.jsx";
import FormAnalytics from "./FormAnalytics.jsx";
import { formatDateDdMmYyyy } from "../dateUtils.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("analytics");
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchState, setSearchState] = useState("");
  // Analytics tab: form search + state filter + selected form
  const [formSearch, setFormSearch] = useState("");
  const [formStateFilter, setFormStateFilter] = useState("");
  const [selectedFormId, setSelectedFormId] = useState(null);

  useEffect(() => {
    document.title = "GA Wing Survey Portal - Admin Dashboard";
    fetchData();
  }, []);

  useEffect(() => {
    if (responses.length > 0 && !selectedResponse) {
      // Select the most recent response by default
      const sortedResponses = [...responses].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setSelectedResponse(sortedResponses[0]);
    }
  }, [responses]);

  useEffect(() => {
    // Default the analytics view to the most recently created/saved form
    if (forms.length > 0 && selectedFormId == null) {
      setSelectedFormId(recentForms[0].id);
    }
  }, [forms]);

  const fetchData = async () => {
    try {
      const [formsData, responsesData, customSectionsData] = await Promise.all([
        getForms(),
        getResponses(),
        getCustomSections()
      ]);
      setForms(formsData);
      setResponses(responsesData);
      setCustomSections(customSectionsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    window.dispatchEvent(new StorageEvent('storage', { key: 'gawing_session', newValue: null }));
    navigate("/login");
  };

  const getFormById = (formId) => {
    return forms.find(f => f.id === formId);
  };

  // Analytics: forms matching the name search + state filter
  const allFormStates = [...new Set(forms.flatMap(f => f.states || []))].sort();
  const formRecency = (f) => new Date(f.savedAt || f.createdAt || 0).getTime();
  const recentForms = [...forms].sort((a, b) => formRecency(b) - formRecency(a));
  const isSearching = formSearch.trim() !== "" || formStateFilter !== "";
  const analyticsForms = recentForms.filter(form => {
    const name = form.name || form.title || "";
    const matchesName = !formSearch || name.toLowerCase().includes(formSearch.toLowerCase());
    const matchesState = !formStateFilter || (form.states || []).some(s => s === formStateFilter);
    return matchesName && matchesState;
  });
  // Only the 3 most recent forms are shown by default; searching reveals the rest
  const visibleForms = isSearching ? analyticsForms : recentForms.slice(0, 3);
  const selectedForm = forms.find(f => f.id === selectedFormId);

  const filteredResponses = responses.filter(response => {
    const form = getFormById(response.formId);
    const matchesQuery = !searchQuery ||
      (form && (form.name || form.title || "").toLowerCase().includes(searchQuery.toLowerCase())) ||
      response.officerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = !searchState || response.state === searchState;
    return matchesQuery && matchesState;
  }).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const uniqueStates = [...new Set(responses.map(r => r.state).filter(Boolean))];

  // Function to get human-readable label for a field key
  const getFieldLabel = (key) => {
    // Standard submission fields
    const standardLabels = {
      sub_name: "Submitter Name",
      sub_desig: "Designation",
      sub_office: "Office",
      sub_date: "Submission Date",
      sub_email: "Email",
      sub_phone: "Phone",
      sub_rem: "Remarks"
    };
    if (standardLabels[key]) {
      return standardLabels[key];
    }

    // Check if it's a custom section field (e.g., "custom_1780230520899_col_0")
    const customFieldMatch = key.match(/^(custom_\d+)_col_(\d+)$/);
    if (customFieldMatch) {
      const sectionId = customFieldMatch[1];
      const colIndex = parseInt(customFieldMatch[2], 10);
      const section = customSections.find(s => s.id === sectionId);
      if (section && section.columns && section.columns[colIndex]) {
        return section.columns[colIndex].name || key;
      }
    }
    return key;
  };

  return (
    <div className="min-h-screen bg-ga-cream font-sans flex flex-col">
      {/* Navbar */}
      <header className="h-[60px] bg-white border-b border-[#E8E6DF] flex items-center justify-between px-8 gap-3.5">
        <div className="flex items-center gap-3.5">
          <div onClick={() => navigate("/")} className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-[#185FA5] to-[#0F6E56] flex items-center justify-center text-white text-[13px] font-extrabold font-serif shrink-0 cursor-pointer">
            GA
          </div>
          <div>
            <div className="text-[15px] font-bold text-[#2C2C2A] leading-tight font-serif">
              GA Wing Survey Portal
            </div>
            <div className="text-[10px] text-[#888780]">
              Office of the Controller General of Accounts · Ministry of Finance
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate("/")} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">🏠 Home</button>
          <button onClick={handleLogout} className="cursor-pointer rounded-lg border border-ga-line bg-ga-surface px-3.5 py-2 text-xs font-semibold text-ga-body">🚪 Logout</button>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="flex-1 flex">
        <AdminSidebar activePage="dashboard" />
        <div className="flex-1">
          <div className="border-b border-ga-border bg-white px-6 py-3">
            <Breadcrumb />
          </div>

          <div className="p-6">
            {/* Toggle Buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer border-none ${
                  activeTab === "analytics"
                    ? "bg-gradient-to-br from-[#185FA5] to-[#0F6E56] text-white"
                    : "bg-white text-[#2C2C2A] border border-[#E8E6DF] hover:bg-[#E6F1FB]"
                }`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setActiveTab("responses")}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer border-none ${
                  activeTab === "responses"
                    ? "bg-gradient-to-br from-[#185FA5] to-[#0F6E56] text-white"
                    : "bg-white text-[#2C2C2A] border border-[#E8E6DF] hover:bg-[#E6F1FB]"
                }`}
              >
                📝 Form Responses
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-sm text-[#888780]">Loading...</div>
              </div>
            ) : activeTab === "analytics" ? (
              <div className="space-y-5">
                {/* Search + state filter */}
                <div className="bg-white rounded-xl border border-[#E8E6DF] p-5">
                  <h3 className="text-sm font-bold text-[#2C2C2A] mb-3">Find a form to view analytics</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="🔍 Search by form name…"
                      value={formSearch}
                      onChange={(e) => setFormSearch(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-sm border border-[#E8E6DF] rounded-lg focus:outline-none focus:border-[#185FA5]"
                    />
                    <select
                      value={formStateFilter}
                      onChange={(e) => setFormStateFilter(e.target.value)}
                      className="sm:w-64 px-4 py-2.5 text-sm border border-[#E8E6DF] rounded-lg focus:outline-none focus:border-[#185FA5] bg-white cursor-pointer"
                    >
                      <option value="">All states</option>
                      {allFormStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form selector — 3 most recent by default, full list while searching */}
                {forms.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#E8E6DF] p-8 text-center text-sm text-[#888780]">
                    No forms created yet
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#B4B2A9]">
                        {isSearching ? `Search results (${analyticsForms.length})` : "Recent forms"}
                      </div>
                      {!isSearching && forms.length > 3 && (
                        <div className="text-[11px] text-[#888780]">Search above to see all {forms.length} forms</div>
                      )}
                    </div>
                    {visibleForms.length === 0 ? (
                      <div className="bg-white rounded-xl border border-[#E8E6DF] p-8 text-center text-sm text-[#888780]">
                        No forms match your search
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {visibleForms.map(form => {
                          const respCount = responses.filter(r => r.formId === form.formId).length;
                          const isActive = form.id === selectedFormId;
                          return (
                            <button
                              key={form.id}
                              onClick={() => setSelectedFormId(form.id)}
                              className={`text-left bg-white rounded-xl border p-5 cursor-pointer transition-all ${
                                isActive
                                  ? "border-[#185FA5] ring-2 ring-[#185FA5]/20 shadow-[0_4px_16px_rgba(24,95,165,0.10)]"
                                  : "border-[#E8E6DF] hover:border-[#185FA5] hover:shadow-[0_4px_16px_rgba(24,95,165,0.10)]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="text-sm font-bold text-[#2C2C2A] leading-snug">{form.name || form.title}</div>
                                <span className="shrink-0 rounded-full bg-[#E6F1FB] px-2 py-0.5 text-[10px] font-bold text-[#185FA5]">{form.status}</span>
                              </div>
                              <div className="text-xs text-[#888780] mb-3">{form.formId}{form.surveyYear ? ` · ${form.surveyYear}` : ""}</div>
                              <div className="flex items-center gap-4 text-xs">
                                <div><span className="font-bold text-[#0F6E56]">{respCount}</span> <span className="text-[#888780]">responses</span></div>
                                <div><span className="font-bold text-[#185FA5]">{(form.states || []).length || "all"}</span> <span className="text-[#888780]">states</span></div>
                              </div>
                              <div className={`mt-3 text-xs font-semibold ${isActive ? "text-[#0F6E56]" : "text-[#185FA5]"}`}>
                                {isActive ? "✓ Showing analytics" : "View analytics →"}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Analytics of the selected form */}
                {selectedForm && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <h2 className="text-xl font-bold text-[#2C2C2A] font-serif">{selectedForm.name || selectedForm.title}</h2>
                      <div className="text-xs text-[#888780] mt-0.5">
                        {selectedForm.formId}{selectedForm.surveyYear ? ` · ${selectedForm.surveyYear}` : ""} · {(selectedForm.states || []).length || "all"} state{(selectedForm.states || []).length === 1 ? "" : "s"} assigned
                      </div>
                    </div>
                    <FormAnalytics form={selectedForm} responses={responses} customSections={customSections} />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-4 h-[calc(100vh-130px)] min-h-[600px]">
                {/* Middle Section - Response Details */}
                <div className="flex-1 bg-white rounded-xl border border-[#E8E6DF] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#E8E6DF] bg-[#F7F5EF]">
                    <h3 className="text-sm font-bold text-[#2C2C2A]">Response Details</h3>
                  </div>
                  <div className="p-6 overflow-y-auto h-[calc(100%-60px)]">
                    {selectedResponse ? (
                      <div className="space-y-4">
                        {/* Officer Details Card */}
                        <div className="bg-gradient-to-br from-[#E6F1FB] to-[#E1F5EE] rounded-xl p-5 border border-[#B5D4F4]">
                          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#185FA5] mb-3">Officer Details</div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#2C2C2A]">Name:</span>
                              <span className="text-sm text-[#2C2C2A]">
                                {selectedResponse.data?.sub_name || selectedResponse.officerName || "Unknown"}
                              </span>
                            </div>
                            {selectedResponse.officerEmail && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[#2C2C2A]">Email:</span>
                                <span className="text-sm text-[#2C2C2A]">{selectedResponse.officerEmail}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#2C2C2A]">State:</span>
                              <span className="text-sm text-[#2C2C2A]">{selectedResponse.state || "Unknown"}</span>
                            </div>
                            {selectedResponse.officerId && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[#2C2C2A]">Officer ID:</span>
                                <span className="text-sm text-[#2C2C2A]">{selectedResponse.officerId}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Form Details */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-[#2C2C2A]">
                              {selectedResponse.formName || getFormById(selectedResponse.formId)?.name || "Unknown Form"}
                            </div>
                            {getFormById(selectedResponse.formId)?.description && (
                              <div className="text-sm text-[#888780] mt-1">
                                {getFormById(selectedResponse.formId).description}
                              </div>
                            )}
                          </div>
                          <div className="px-3 py-1 rounded-full text-xs font-bold bg-[#E1F5EE] text-[#0F6E56]">
                            Submitted
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div className="text-xs text-[#888780]">
                          Submitted: {selectedResponse.submittedAt ? formatDateDdMmYyyy(selectedResponse.submittedAt) : "N/A"}
                        </div>

                        {/* Response Data */}
                        {selectedResponse.data && Object.keys(selectedResponse.data).length > 0 ? (
                          <div className="space-y-3">
                            <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#B4B2A9]">Response Data</div>
                            {(() => {
                              const form = getFormById(selectedResponse.formId);
                              const fieldLabels = {};
                              if (form && form.sections) {
                                form.sections.forEach(section => {
                                  if (section.fields) {
                                    section.fields.forEach(field => {
                                      fieldLabels[field.id] = field.label;
                                    });
                                  }
                                });
                              }
                              return Object.entries(selectedResponse.data).map(([key, value]) => (
                                <div key={key} className="border border-[#E8E6DF] rounded-lg p-4 bg-white">
                                  <div className="text-xs font-bold text-[#2C2C2A] mb-2">
                                    {fieldLabels[key] || getFieldLabel(key)}
                                  </div>
                                  <div className="text-sm text-[#2C2C2A]">
                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        ) : (
                          <div className="text-sm text-[#888780] text-center py-8">
                            No response data available
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-[#888780] text-center py-8">
                        Select a response from the sidebar to view details
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Sidebar - Response List */}
                <div className="w-80 bg-white rounded-xl border border-[#E8E6DF] overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-[#E8E6DF] bg-[#F7F5EF]">
                    <h3 className="text-sm font-bold text-[#2C2C2A] mb-3">All Responses</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Search by form name or officer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#E8E6DF] rounded-lg focus:outline-none focus:border-[#185FA5]"
                      />
                      <select
                        value={searchState}
                        onChange={(e) => setSearchState(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#E8E6DF] rounded-lg focus:outline-none focus:border-[#185FA5]"
                      >
                        <option value="">All States</option>
                        {uniqueStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-[#E8E6DF]">
                    {filteredResponses.length === 0 ? (
                      <div className="p-4 text-center text-sm text-[#888780]">
                        No responses found
                      </div>
                    ) : (
                      filteredResponses.map((response, index) => {
                        const form = getFormById(response.formId);
                        return (
                          <div
                            key={response.id || index}
                            onClick={() => setSelectedResponse(response)}
                            className={`p-4 cursor-pointer hover:bg-[#F7F5EF] transition-colors ${
                              selectedResponse?.id === response.id ? "bg-[#E6F1FB]" : ""
                            }`}
                          >
                            <div className="text-sm font-bold text-[#2C2C2A] mb-1">
                              {response.formName || form?.name || "Unknown Form"}
                            </div>
                            <div className="text-xs text-[#888780] mb-2">
                              {response.data?.sub_name || response.officerName || "Unknown Officer"} • {response.state || "Unknown State"}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-[#888780]">
                                {response.submittedAt ? formatDateDdMmYyyy(response.submittedAt) : "N/A"}
                              </div>
                              <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E1F5EE] text-[#0F6E56]">
                                Submitted
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
