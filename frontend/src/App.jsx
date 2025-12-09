
import React, { useEffect, useState, useMemo } from 'react';
import { LayoutDashboard, TrendingUp, DollarSign, Anchor, RefreshCw, BarChart3, Search, Calendar, Ruler, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchBoats, fetchDashboardStats, fetchSyncStatus } from './api';
import StatCard from './components/StatCard';
import BoatCard from './components/BoatCard';
import Charts from './components/Charts';
import FilterSection from './components/FilterSection';
import { motion } from 'framer-motion';

const LoadingScreen = ({ status }) => {
  const progress = status ? Math.round((status.total_fetched / (status.total_estimated || 1)) * 100) : 0;
  const count = status ? status.total_fetched : 0;
  const total = status ? status.total_estimated : 0;

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="bg-indigo-600 text-white p-3 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center shadow-indigo-200 shadow-xl mb-6">
          <Anchor size={32} className="animate-pulse" />
        </div>
        <h2 className="2xl font-display font-bold text-slate-900">Synchronizing Fleet Data</h2>
        <p className="text-slate-500 text-sm">Connecting to global boat inventory...</p>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Fetching Data</span>
            <span>{count} / {total > 0 ? total : "..."}</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const formatNumber = (num) => {
  if (num === null || num === undefined) return "-";
  return new Intl.NumberFormat('it-IT').format(Math.round(num));
};

function App() {
  const [boats, setBoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    builders: [],
    models: [],
    countries: [],
    conditions: [],
    yearFrom: 0, // Relaxed from 1990 to include all
    yearTo: 2026,
    lengthFrom: 0,
    lengthTo: 200, // Increased range
    priceFrom: 0,
    priceTo: 300000000 // Increased default max
  });

  useEffect(() => {
    // Initial Load Logic with Polling
    let pollInterval;

    const checkStatus = async () => {
      const status = await fetchSyncStatus();
      if (status) {
        setSyncStatus(status);

        // If loading is done and we have boats (or expected to have), fetch data
        if (!status.is_loading && status.boat_count > 0) {
          clearInterval(pollInterval);

          // Fetch final data
          try {
            const data = await fetchBoats();
            setBoats(data);
          } catch (e) {
            console.error("Failed to fetch final boats", e);
          } finally {
            setLoading(false);
          }
        } else if (!status.is_loading && status.boat_count === 0 && status.total_estimated === 0) {
          // Not started yet? Trigger sync
          await fetchBoats({ refresh: true }); // This triggers sync in backend
        }
      }
    };

    pollInterval = setInterval(checkStatus, 800);
    checkStatus(); // Initial check

    return () => clearInterval(pollInterval);
  }, []);

  const triggerResync = async () => {
    setLoading(true);
    setBoats([]);
    // Trigger sync logic again (reload page or reset state to trigger polling)
    await fetchBoats({ refresh: true });
    window.location.reload(); // Simplest way to restart polling cycle for this prototype
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  // Derived Data & Filtering
  const filteredBoats = useMemo(() => {
    return boats.filter(b => {
      const matchesSearch = !searchTerm ||
        b.Model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.Builder?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.BoatID?.toString().includes(searchTerm);

      const matchesBuilder = filters.builders.length === 0 || filters.builders.includes(b.Builder);
      const matchesModel = filters.models.length === 0 || filters.models.includes(b.Model);
      const matchesCountry = filters.countries.length === 0 || filters.countries.includes(b.Country);
      // Assuming 'Condition' or 'Type' might be keys. Inspecting logs failed, so we play safe.
      // If key doesn't exist, this filter is effectively ignored if generic.
      // But let's try 'Condition' if present in data.
      const matchesCondition = filters.conditions.length === 0 || filters.conditions.includes(b.Condition);

      const boatYear = b.YearBuilt || 0;
      const matchesYear = boatYear >= filters.yearFrom && boatYear <= filters.yearTo;

      const boatLen = b.Length || 0;
      const matchesLength = boatLen >= filters.lengthFrom && boatLen <= filters.lengthTo;

      const boatPrice = b.SellPrice || 0;
      const matchesPrice = boatPrice >= filters.priceFrom && boatPrice <= filters.priceTo;

      return matchesSearch && matchesBuilder && matchesModel && matchesCountry && matchesCondition && matchesYear && matchesLength && matchesPrice;
    });
  }, [boats, searchTerm, filters]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredBoats.length / itemsPerPage);
  const paginatedBoats = filteredBoats.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Dynamic Stats based on Filtered Data
  const stats = useMemo(() => {
    if (filteredBoats.length === 0) return null;

    const prices = filteredBoats.map(b => b.SellPrice).filter(p => p > 0);
    const years = filteredBoats.map(b => b.YearBuilt).filter(y => y > 1900);

    return {
      total_boats: filteredBoats.length,
      avg_price: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      max_price: prices.length ? Math.max(...prices) : 0,
      min_price: prices.length ? Math.min(...prices) : 0,
      avg_year: years.length ? Math.round(years.reduce((a, b) => a + b, 0) / years.length) : 0,
      max_year: years.length ? Math.max(...years) : 0,
      min_year: years.length ? Math.min(...years) : 0,
    };
  }, [filteredBoats]);

  // Extract Unique Values for Dropdowns
  const uniqueBuilders = useMemo(() => [...new Set(boats.map(b => b.Builder).filter(Boolean))], [boats]);
  const uniqueCountries = useMemo(() => [...new Set(boats.map(b => b.Country).filter(Boolean))], [boats]);
  const uniqueConditions = useMemo(() => [...new Set(boats.map(b => b.Condition).filter(Boolean))], [boats]);

  const uniqueModels = useMemo(() => {
    // Filter models based on selected builders if any present
    const source = filters.builders.length > 0 ? boats.filter(b => filters.builders.includes(b.Builder)) : boats;
    return [...new Set(source.map(b => b.Model).filter(Boolean))];
  }, [boats, filters.builders]);


  if (loading) {
    return <LoadingScreen status={syncStatus} />;
  }

  return (
    <div className="min-h-screen pb-20">

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <Anchor size={24} />
              </div>
              <span className="text-sm font-bold text-indigo-600 tracking-wider uppercase">Broker Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight">
              Market <span className="text-gradient">Dashboard</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4"
          >
            <button
              onClick={triggerResync}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              {loading ? "Syncing..." : "Sync Data"}
            </button>
          </motion.div>
        </div>

        {/* Filters */}
        <FilterSection
          boats={boats}
          filters={filters}
          setFilters={setFilters}
          uniqueBuilders={uniqueBuilders}
          uniqueModels={uniqueModels}
          uniqueCountries={uniqueCountries}
          uniqueConditions={uniqueConditions}
          resetFilters={() => setFilters({
            builders: [],
            models: [],
            countries: [],
            conditions: [],
            yearFrom: 0,
            yearTo: 2026,
            lengthFrom: 0,
            lengthTo: 200,
            priceFrom: 0,
            priceTo: 300000000
          })}
        />

        {/* Stats Grid - EXPANDED */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Fleet Size"
            value={stats ? formatNumber(stats.total_boats) : "-"}
            subtext={<span>of <span className="font-bold text-indigo-600">{formatNumber(boats.length)}</span> total vessels</span>}
            icon={Anchor}
            delay={0.1}
          />
          <StatCard
            title="Avg Market Price"
            value={stats ? `€ ${formatNumber(stats.avg_price)}` : "-"}
            subtext={stats ? `Range: €${formatNumber(stats.min_price)} - €${formatNumber(stats.max_price)}` : "Select filters"}
            icon={DollarSign}
            delay={0.2}
          />
          <StatCard
            title="Avg Build Year"
            value={stats ? stats.avg_year : "-"}
            subtext={stats ? `Oldest: ${stats.min_year} | Newest: ${stats.max_year}` : "Select filters"}
            icon={Calendar}
            delay={0.3}
          />
          <StatCard
            title="Top Builder"
            value={stats && filteredBoats.length > 0 ?
              Object.entries(filteredBoats.reduce((acc, b) => { acc[b.Builder] = (acc[b.Builder] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"
              : "-"}
            subtext="Most common in selection"
            icon={TrendingUp}
            delay={0.4}
          />
        </div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-panel rounded-2xl p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <BarChart3 size={20} />
              </div>
              <h3 className="font-bold text-xl text-slate-800">Market Distribution</h3>
            </div>
          </div>
          <Charts boats={filteredBoats} />
        </motion.div>

        {/* Inventory Section (Collapsible) */}
        {!isInventoryExpanded ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Detailed Inventory</h2>
            <p className="text-slate-500 mb-8 max-w-lg mx-auto">
              View detailed specifications, pricing, and imagery for all {formatNumber(stats?.total_boats)} vessels matching your criteria.
            </p>
            <button
              onClick={() => setIsInventoryExpanded(true)}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 mx-auto"
            >
              Show Inventory <ChevronDown size={20} />
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Inventory List</h2>
              <button
                onClick={() => setIsInventoryExpanded(false)}
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1"
              >
                Hide Inventory <ChevronUp size={16} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search model, builder, or ID..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedBoats.map((boat, index) => (
                <BoatCard key={boat.BoatID} boat={boat} index={index % itemsPerPage} />
              ))}
            </div>

            {filteredBoats.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                <div className="text-slate-300 mb-4"><Anchor size={48} className="mx-auto" /></div>
                <p className="text-slate-500 text-lg">No boats found matching criteria</p>
                <button onClick={() => setFilters({ builders: [], models: [], countries: [], conditions: [], yearFrom: 0, yearTo: 2026, lengthFrom: 0, lengthTo: 200, priceFrom: 0, priceTo: 300000000 })} className="mt-4 text-indigo-600 font-medium hover:underline">Clear Filters</button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>

                <span className="text-sm font-medium text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;

