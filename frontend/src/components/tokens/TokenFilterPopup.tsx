import { useState, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Popover from "@/components/Popover";

export interface FilterCriteria {
  keywords: string;
  ageMin: string;
  ageMax: string;
  holdersMin: string;
  holdersMax: string;
  marketCapMin: string;
  marketCapMax: string;
}

export interface SavedFilter {
  id: string;
  criteria: FilterCriteria;
  timestamp: number;
}

interface TokenFilterPopupProps {
  trigger: React.ReactNode;
  onFilterChange: (criteria: FilterCriteria) => void;
  currentFilters: FilterCriteria;
}

const defaultFilters: FilterCriteria = {
  keywords: "",
  ageMin: "",
  ageMax: "",
  holdersMin: "",
  holdersMax: "",
  marketCapMin: "",
  marketCapMax: "",
};

export default function TokenFilterPopup({
  trigger,
  onFilterChange,
  currentFilters,
}: TokenFilterPopupProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "saved">("manual");
  const [filters, setFilters] = useState<FilterCriteria>(currentFilters);
  const [savedFilters, setSavedFilters] = useLocalStorage<SavedFilter[]>("token-saved-filters", []);

  // Update local filters when currentFilters change
  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const handleInputChange = (field: keyof FilterCriteria, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const handleSave = () => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      criteria: { ...filters },
      timestamp: Date.now(),
    };
    setSavedFilters(prev => [...prev, newFilter]);
  };

  const handleDeleteSaved = (id: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== id));
  };

  const handleApplySaved = (criteria: FilterCriteria) => {
    setFilters(criteria);
    onFilterChange(criteria);
    setActiveTab("manual");
  };

  const formatFilterChip = (criteria: FilterCriteria) => {
    const chips = [];
    
    if (criteria.keywords) chips.push(`"${criteria.keywords}"`);
    if (criteria.ageMin && criteria.ageMax) chips.push(`Age ${criteria.ageMin}-${criteria.ageMax}d`);
    else if (criteria.ageMin) chips.push(`Age ≥ ${criteria.ageMin}d`);
    else if (criteria.ageMax) chips.push(`Age ≤ ${criteria.ageMax}d`);
    
    if (criteria.holdersMin && criteria.holdersMax) chips.push(`Holders ${criteria.holdersMin}-${criteria.holdersMax}`);
    else if (criteria.holdersMin) chips.push(`Holders ≥ ${criteria.holdersMin}`);
    else if (criteria.holdersMax) chips.push(`Holders ≤ ${criteria.holdersMax}`);
    
    if (criteria.marketCapMin && criteria.marketCapMax) chips.push(`MC $${criteria.marketCapMin}-$${criteria.marketCapMax}`);
    else if (criteria.marketCapMin) chips.push(`MC ≥ $${criteria.marketCapMin}`);
    else if (criteria.marketCapMax) chips.push(`MC ≤ $${criteria.marketCapMax}`);
    
    return chips;
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  return (
    <Popover
      trigger={trigger}
      contentProps={{
        maxWidth: 400,
        maxHeight: 600,
        className: "p-6",
      }}
    >
        {/* Tabs */}
        <div className="flex mb-6 border-b border-border">
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "manual"
                ? "border-focus text-foreground"
                : "border-transparent text-secondary-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("manual")}
          >
            Manual
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === "saved"
                ? "border-focus text-foreground"
                : "border-transparent text-secondary-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("saved")}
          >
            Saved
            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs">
              {savedFilters.length}
            </span>
          </button>
        </div>

        {activeTab === "manual" ? (
          <div className="space-y-4">
            {/* Search Keywords */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Search keywords
              </label>
              <input
                type="text"
                placeholder="Enter keywords"
                value={filters.keywords}
                onChange={(e) => handleInputChange("keywords", e.target.value)}
                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Age (days)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.ageMin}
                  onChange={(e) => handleInputChange("ageMin", e.target.value)}
                  className="flex-1 px-3 py-2 bg-card border border-border rounded-md text-sm placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.ageMax}
                  onChange={(e) => handleInputChange("ageMax", e.target.value)}
                  className="flex-1 px-3 py-2 bg-card border border-border rounded-md text-sm placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
                />
              </div>
            </div>

            {/* Holders */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Holders
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.holdersMin}
                  onChange={(e) => handleInputChange("holdersMin", e.target.value)}
                  className="flex-1 px-3 py-2 bg-card border border-border rounded-md text-sm placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.holdersMax}
                  onChange={(e) => handleInputChange("holdersMax", e.target.value)}
                  className="flex-1 px-3 py-2 bg-card border border-border rounded-md text-sm placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
                />
              </div>
            </div>

            {/* Market Cap */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Market cap
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.marketCapMin}
                    onChange={(e) => handleInputChange("marketCapMin", e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-card border border-border rounded-md text-sm placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
                  />
                </div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.marketCapMax}
                    onChange={(e) => handleInputChange("marketCapMax", e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-card border border-border rounded-md text-sm placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!hasActiveFilters}
                className={cn(
                  "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  hasActiveFilters
                    ? "bg-button-1 text-button-1-foreground hover:bg-button-1/90"
                    : "bg-secondary text-secondary-foreground cursor-not-allowed"
                )}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {savedFilters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-secondary-foreground">No saved filters</p>
              </div>
            ) : (
              savedFilters.map((savedFilter) => {
                const chips = formatFilterChip(savedFilter.criteria);
                return (
                  <div
                    key={savedFilter.id}
                    className="border border-border rounded-md p-3 space-y-2 hover:bg-card/50 transition-colors"
                  >
                    <div className="flex flex-wrap gap-1">
                      {chips.map((chip, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApplySaved(savedFilter.criteria)}
                        className="px-3 py-1 bg-button-1 text-button-1-foreground rounded text-xs font-medium hover:bg-button-1/90 transition-colors rounded-md"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(savedFilter.id)}
                        className="p-1 text-secondary-foreground hover:text-foreground transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
    </Popover>
  );
}
