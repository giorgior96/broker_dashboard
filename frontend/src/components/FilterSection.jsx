import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X, ChevronDown, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MultiSelect = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef(null);

    const filteredOptions = options.filter(opt =>
        String(opt).toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 ml-1">{label}</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between group ${isOpen ? 'bg-white border-indigo-500 ring-4 ring-indigo-500/10 shadow-lg' : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white'}`}
            >
                <div className="flex flex-wrap gap-1 overflow-hidden">
                    {selected.length === 0 ? (
                        <span className="text-slate-500 text-sm">Select {label}...</span>
                    ) : (
                        <span className="text-indigo-600 font-medium text-sm">
                            {selected.length} selected
                        </span>
                    )}
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : 'group-hover:text-indigo-500'}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden"
                    >
                        <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                    placeholder={`Search ${label}...`}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto max-h-60 p-2 space-y-1 custom-scrollbar">
                            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        if (selected.includes(opt)) {
                                            onChange(selected.filter(s => s !== opt));
                                        } else {
                                            onChange([...selected, opt]);
                                        }
                                    }}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${selected.includes(opt) ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <span>{opt}</span>
                                    {selected.includes(opt) && <Check size={14} className="text-indigo-600" />}
                                </button>
                            )) : (
                                <div className="p-4 text-xs text-slate-400 text-center">No matches found</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const RangeInput = ({ label, minVal, maxVal, onChangeMin, onChangeMax, step = 1, prefix = "" }) => (
    <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block ml-1">{label}</label>
        <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200 hover:bg-white hover:border-indigo-300 transition-colors group focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 focus-within:bg-white">
            <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">Min</span>
                <input
                    type="number"
                    value={minVal || ''}
                    onChange={(e) => onChangeMin(Number(e.target.value))}
                    className="w-full pl-10 pr-2 py-2.5 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300"
                    placeholder="0"
                    step={step}
                />
            </div>
            <div className="w-px h-6 bg-slate-200 group-focus-within:bg-indigo-100" />
            <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">Max</span>
                <input
                    type="number"
                    value={maxVal || ''}
                    onChange={(e) => onChangeMax(Number(e.target.value))}
                    className="w-full pl-10 pr-2 py-2.5 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300"
                    placeholder="Any"
                    step={step}
                />
            </div>
        </div>
    </div>
);

const FilterSection = ({
    boats,
    filters,
    setFilters,
    uniqueBuilders,
    uniqueModels,
    uniqueCountries,
    uniqueConditions,
    resetFilters
}) => {
    const activeFiltersCount = filters.builders.length + filters.models.length + filters.countries.length + filters.conditions.length;

    return (
        <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-8 relative z-30">
            <div className="flex items-center justify-between border-b border-indigo-50 pb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
                        <SlidersHorizontal size={22} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Advanced Filtering</h3>
                        <p className="text-slate-400 text-xs">Refine your search parameters</p>
                    </div>
                </div>
                <button
                    onClick={resetFilters}
                    className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                >
                    <span className="relative">
                        Clear All
                        {activeFiltersCount > 0 && <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full" />}
                    </span>
                    <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                {/* Row 1: Primary Selectors */}
                <MultiSelect
                    label="Builders"
                    options={uniqueBuilders.sort()}
                    selected={filters.builders}
                    onChange={(newVal) => setFilters({ ...filters, builders: newVal })}
                />

                <MultiSelect
                    label="Models"
                    options={uniqueModels.sort()}
                    selected={filters.models}
                    onChange={(newVal) => setFilters({ ...filters, models: newVal })}
                />

                <MultiSelect
                    label="Location"
                    options={uniqueCountries ? uniqueCountries.sort() : []}
                    selected={filters.countries}
                    onChange={(newVal) => setFilters({ ...filters, countries: newVal })}
                />

                {uniqueConditions && uniqueConditions.length > 0 ? (
                    <MultiSelect
                        label="Condition"
                        options={uniqueConditions.sort()}
                        selected={filters.conditions}
                        onChange={(newVal) => setFilters({ ...filters, conditions: newVal })}
                    />
                ) : (
                    <div className="hidden xl:block"></div> /* Spacer if no condition */
                )}


                {/* Row 2: Ranges */}
                <RangeInput
                    label="Year Range"
                    minVal={filters.yearFrom}
                    maxVal={filters.yearTo}
                    onChangeMin={(v) => setFilters({ ...filters, yearFrom: v })}
                    onChangeMax={(v) => setFilters({ ...filters, yearTo: v })}
                />

                <RangeInput
                    label="Length (Meters)"
                    minVal={filters.lengthFrom}
                    maxVal={filters.lengthTo}
                    onChangeMin={(v) => setFilters({ ...filters, lengthFrom: v })}
                    onChangeMax={(v) => setFilters({ ...filters, lengthTo: v })}
                />

                <div className="md:col-span-2">
                    <RangeInput
                        label="Price Range (€)"
                        minVal={filters.priceFrom}
                        maxVal={filters.priceTo}
                        onChangeMin={(v) => setFilters({ ...filters, priceFrom: v })}
                        onChangeMax={(v) => setFilters({ ...filters, priceTo: v })}
                        step={10000}
                    />
                </div>

            </div>
        </div>
    );
};

export default FilterSection;
