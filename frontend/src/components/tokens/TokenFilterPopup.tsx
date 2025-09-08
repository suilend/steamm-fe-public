import { useEffect, useState } from "react";

import { Trash2 } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";

import Popover from "@/components/Popover";
import { cn } from "@/lib/utils";

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
  const [savedFilters, setSavedFilters] = useLocalStorage<SavedFilter[]>(
    "token-saved-filters",
    [],
  );

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
    setSavedFilters((prev) => [...prev, newFilter]);
  };

  const handleDeleteSaved = (id: string) => {
    setSavedFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const handleApplySaved = (criteria: FilterCriteria) => {
    setFilters(criteria);
    onFilterChange(criteria);
    setActiveTab("manual");
  };

  const formatFilterChip = (criteria: FilterCriteria) => {
    const chips = [];

    if (criteria.keywords) chips.push(`"${criteria.keywords}"`);
    if (criteria.ageMin && criteria.ageMax)
      chips.push(`Age ${criteria.ageMin}-${criteria.ageMax}d`);
    else if (criteria.ageMin) chips.push(`Age ≥ ${criteria.ageMin}d`);
    else if (criteria.ageMax) chips.push(`Age ≤ ${criteria.ageMax}d`);

    if (criteria.holdersMin && criteria.holdersMax)
      chips.push(`Holders ${criteria.holdersMin}-${criteria.holdersMax}`);
    else if (criteria.holdersMin)
      chips.push(`Holders ≥ ${criteria.holdersMin}`);
    else if (criteria.holdersMax)
      chips.push(`Holders ≤ ${criteria.holdersMax}`);

    if (criteria.marketCapMin && criteria.marketCapMax)
      chips.push(`MC $${criteria.marketCapMin}-$${criteria.marketCapMax}`);
    else if (criteria.marketCapMin)
      chips.push(`MC ≥ $${criteria.marketCapMin}`);
    else if (criteria.marketCapMax)
      chips.push(`MC ≤ $${criteria.marketCapMax}`);

    return chips;
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

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
      <div className="mb-6 flex border-b border-border">
        <button
          className={cn(
            "text-sm border-b-2 px-4 py-2 font-medium transition-colors",
            activeTab === "manual"
              ? "border-focus text-foreground"
              : "border-transparent text-secondary-foreground hover:text-foreground",
          )}
          onClick={() => setActiveTab("manual")}
        >
          Manual
        </button>
        <button
          className={cn(
            "text-sm flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors",
            activeTab === "saved"
              ? "border-focus text-foreground"
              : "border-transparent text-secondary-foreground hover:text-foreground",
          )}
          onClick={() => setActiveTab("saved")}
        >
          Saved
          <span className="text-xs rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
            {savedFilters.length}
          </span>
        </button>
      </div>

      {activeTab === "manual" ? (
        <div className="space-y-4">
          {/* Search Keywords */}
          <div>
            <label className="text-sm mb-2 block font-medium text-foreground">
              Search keywords
            </label>
            <input
              type="text"
              placeholder="Enter keywords"
              value={filters.keywords}
              onChange={(e) => handleInputChange("keywords", e.target.value)}
              className="text-sm w-full rounded-md border border-border bg-card px-3 py-2 placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
            />
          </div>

          {/* Age */}
          <div>
            <label className="text-sm mb-2 block font-medium text-foreground">
              Age (days)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.ageMin}
                onChange={(e) => handleInputChange("ageMin", e.target.value)}
                className="text-sm flex-1 rounded-md border border-border bg-card px-3 py-2 placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.ageMax}
                onChange={(e) => handleInputChange("ageMax", e.target.value)}
                className="text-sm flex-1 rounded-md border border-border bg-card px-3 py-2 placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
              />
            </div>
          </div>

          {/* Holders */}
          <div>
            <label className="text-sm mb-2 block font-medium text-foreground">
              Holders
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.holdersMin}
                onChange={(e) =>
                  handleInputChange("holdersMin", e.target.value)
                }
                className="text-sm flex-1 rounded-md border border-border bg-card px-3 py-2 placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.holdersMax}
                onChange={(e) =>
                  handleInputChange("holdersMax", e.target.value)
                }
                className="text-sm flex-1 rounded-md border border-border bg-card px-3 py-2 placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
              />
            </div>
          </div>

          {/* Market Cap */}
          <div>
            <label className="text-sm mb-2 block font-medium text-foreground">
              Market cap
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="text-sm absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.marketCapMin}
                  onChange={(e) =>
                    handleInputChange("marketCapMin", e.target.value)
                  }
                  className="text-sm w-full rounded-md border border-border bg-card py-2 pl-8 pr-3 placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
                />
              </div>
              <div className="relative flex-1">
                <span className="text-sm absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.marketCapMax}
                  onChange={(e) =>
                    handleInputChange("marketCapMax", e.target.value)
                  }
                  className="text-sm w-full rounded-md border border-border bg-card py-2 pl-8 pr-3 placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleReset}
              className="text-sm flex-1 rounded-md bg-secondary px-4 py-2 font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasActiveFilters}
              className={cn(
                "text-sm flex-1 rounded-md px-4 py-2 font-medium transition-colors",
                hasActiveFilters
                  ? "bg-button-1 text-button-1-foreground hover:bg-button-1/90"
                  : "cursor-not-allowed bg-secondary text-secondary-foreground",
              )}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {savedFilters.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-secondary-foreground">
                No saved filters
              </p>
            </div>
          ) : (
            savedFilters.map((savedFilter) => {
              const chips = formatFilterChip(savedFilter.criteria);
              return (
                <div
                  key={savedFilter.id}
                  className="space-y-2 rounded-md border border-border p-3 transition-colors hover:bg-card/50"
                >
                  <div className="flex flex-wrap gap-1">
                    {chips.map((chip, index) => (
                      <span
                        key={index}
                        className="rounded text-xs bg-secondary px-2 py-1 text-secondary-foreground"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleApplySaved(savedFilter.criteria)}
                      className="rounded text-xs rounded-md bg-button-1 px-3 py-1 font-medium text-button-1-foreground transition-colors hover:bg-button-1/90"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => handleDeleteSaved(savedFilter.id)}
                      className="p-1 text-secondary-foreground transition-colors hover:text-foreground"
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
