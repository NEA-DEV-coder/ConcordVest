/**
 * ConcordVest Admin Analytics Dashboard
 *
 * Visualizes high-level website KPIs, daily traffic trends, marketing sources,
 * campaign attribution, lead mix, and conversion funnels.
 *
 * SECURITY:
 * - Uses ONLY the secure RPC `get_analytics_metrics` via `useAnalytics`
 * - Never queries `analytics_events` directly
 * - Does not expose raw UUIDs, visitor IDs, session IDs, or PII
 * - Restricts access to admin and editor roles
 */

import { useState, useMemo } from "react";
import {
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Globe,
  Lightbulb,
  Mail,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Share2,
  ShieldAlert,
  Sparkles,
  Tag,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAnalytics,
  calculateRate,
  resolveEntityName,
} from "@/hooks/useAnalytics";
import { useAdminProperties } from "@/hooks/useProperties";
import { useServices } from "@/hooks/useContent";
import { demoProperties } from "@/lib/properties";
import { servicePackages } from "@/lib/services";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function AdminAnalytics() {
  const { profile } = useAuth();
  const userRole = profile?.role;
  const isAuthorized =
    userRole === "admin" ||
    userRole === "editor" ||
    (!isSupabaseConfigured() && !userRole);

  const {
    data,
    isLoading,
    error,
    filter,
    setPreset,
    setCustomRange,
    refetch,
  } = useAnalytics();

  // Custom date range input state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Resolving property and service names
  const { properties } = useAdminProperties();
  const { services } = useServices();

  const propertyMap = useMemo(() => {
    const map: Record<string, string> = {};
    (properties || []).forEach(p => {
      map[p.id] = p.title;
    });
    demoProperties.forEach(p => {
      map[p.id] = p.title;
    });
    return map;
  }, [properties]);

  const serviceMap = useMemo(() => {
    const map: Record<string, string> = {};
    (services || []).forEach(s => {
      map[s.id] = s.name;
    });
    servicePackages.forEach(s => {
      map[s.id] = s.name;
    });
    return map;
  }, [services]);

  const overview = data?.overview;
  const isEmpty = !isLoading && !error && (!overview || overview.totalEvents === 0);

  // Conversion rates calculated safely in frontend (guarding against division by zero)
  const whatsappConversionRate = useMemo(() => {
    if (!overview) return "0.0%";
    return calculateRate(overview.whatsappClicks, overview.propertyViews);
  }, [overview]);

  const enquiryConversionRate = useMemo(() => {
    if (!overview) return "0.0%";
    return calculateRate(overview.enquiries, overview.propertyViews);
  }, [overview]);

  // Total enquiries calculated for lead mix share
  const totalEnquiriesCount = useMemo(() => {
    if (data?.enquiryTypes && data.enquiryTypes.length > 0) {
      return data.enquiryTypes.reduce((acc, curr) => acc + curr.count, 0);
    }
    return overview?.enquiries || 0;
  }, [data?.enquiryTypes, overview?.enquiries]);

  // Derived factual intelligence insights (strictly grounded in returned data)
  const keyInsights = useMemo(() => {
    if (!data || !overview || overview.totalEvents === 0) return [];
    const insights: {
      id: string;
      title: string;
      description: string;
      icon: React.ComponentType<{ size?: number; className?: string }>;
    }[] = [];

    // 1. Top Traffic & Lead Source
    const topLeadSource = [...(data.trafficSources || [])]
      .filter(s => s.enquiries > 0)
      .sort((a, b) => b.enquiries - a.enquiries)[0];

    if (topLeadSource) {
      const srcName = topLeadSource.source === "direct" ? "Direct traffic" : topLeadSource.source;
      insights.push({
        id: "top-source",
        title: "Primary Lead Channel",
        description: `${srcName} generated ${topLeadSource.enquiries} form ${
          topLeadSource.enquiries === 1 ? "enquiry" : "enquiries"
        } and ${topLeadSource.whatsappClicks} WhatsApp inquiries.`,
        icon: Target,
      });
    } else if (data.trafficSources && data.trafficSources.length > 0) {
      const topVisitorSource = data.trafficSources[0];
      const srcName = topVisitorSource.source === "direct" ? "Direct traffic" : topVisitorSource.source;
      insights.push({
        id: "top-source",
        title: "Primary Traffic Channel",
        description: `${srcName} leads overall acquisition with ${topVisitorSource.visitors.toLocaleString()} visitors.`,
        icon: Target,
      });
    }

    // 2. Top Performing Property
    if (data.topProperties && data.topProperties.length > 0) {
      const topProp = data.topProperties[0];
      const propTitle = resolveEntityName(topProp.propertyId, propertyMap, "Listing");
      const propRate = calculateRate(topProp.enquiries, topProp.views);
      insights.push({
        id: "top-property",
        title: "Top Listing Demand",
        description: `"${propTitle}" leads listing interest with ${topProp.views.toLocaleString()} views (${topProp.enquiries} enquiries, ${propRate} conversion).`,
        icon: Building2,
      });
    }

    // 3. Top Active Campaign
    const activeCampaigns = (data.campaigns || []).filter(
      c => c.campaign !== "none" && (c.visitors > 0 || c.events > 0)
    );
    if (activeCampaigns.length > 0) {
      const topCamp = [...activeCampaigns].sort(
        (a, b) => b.enquiries - a.enquiries || b.visitors - a.visitors
      )[0];
      insights.push({
        id: "top-campaign",
        title: "Active Campaign Performance",
        description: `"${topCamp.campaign}" brought ${topCamp.visitors.toLocaleString()} visitors and ${topCamp.enquiries} form submissions.`,
        icon: TrendingUp,
      });
    }

    // 4. Leading Enquiry Type (Lead Mix)
    if (data.enquiryTypes && data.enquiryTypes.length > 0 && totalEnquiriesCount > 0) {
      const topType = data.enquiryTypes[0];
      const share = calculateRate(topType.count, totalEnquiriesCount);
      insights.push({
        id: "lead-mix",
        title: "Dominant Lead Type",
        description: `"${topType.type}" accounts for ${topType.count} enquiries (${share} of all incoming leads).`,
        icon: CheckCircle2,
      });
    }

    // 5. Top Performing Service
    if (data.topServices && data.topServices.length > 0) {
      const topSvc = data.topServices[0];
      const svcTitle = resolveEntityName(topSvc.serviceId, serviceMap, "Service");
      insights.push({
        id: "top-service",
        title: "Top Service Engagement",
        description: `"${svcTitle}" generated ${topSvc.views.toLocaleString()} views and ${topSvc.whatsappClicks} WhatsApp conversations.`,
        icon: Sparkles,
      });
    }

    return insights;
  }, [data, overview, propertyMap, serviceMap, totalEnquiriesCount]);

  // Authorization guard
  if (!isAuthorized) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-red-100 p-4 text-red-600">
          <ShieldAlert size={36} />
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-[#012770]">
          Access Restricted
        </h2>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-[#637085]">
          The analytics performance dashboard is restricted to Administrators and
          Content Editors. Staff members do not have permission to view marketing
          and website traffic analytics.
        </p>
      </div>
    );
  }

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      setCustomRange(customStart, customEnd);
      setShowCustomModal(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-6 border-b border-[#012770]/12 pb-7 lg:flex-row lg:items-end">
        <div>
          <p className="admin-eyebrow">ANALYTICS</p>
          <h1 className="mt-3 text-[2.4rem] font-extrabold tracking-[-0.06em] text-[#012770] sm:text-[3.2rem]">
            Website Performance
          </h1>
          <p className="mt-3 max-w-2xl text-[0.78rem] leading-[1.7] text-[#637085]">
            Track traffic channels, campaign attribution, lead mix, property demand, and WhatsApp conversion rates.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-none border border-[#012770]/15 bg-white p-1 shadow-xs">
            {(
              [
                { id: "today", label: "Today" },
                { id: "7d", label: "Last 7 days" },
                { id: "30d", label: "Last 30 days" },
                { id: "90d", label: "Last 90 days" },
                { id: "custom", label: "Custom range" },
              ] as const
            ).map(item => {
              const isActive = filter.preset === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === "custom") {
                      setShowCustomModal(true);
                    } else {
                      setPreset(item.id);
                    }
                  }}
                  className={`px-3 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-wider transition-colors ${
                    isActive
                      ? "bg-[#012770] text-white"
                      : "text-[#637085] hover:text-[#012770] hover:bg-[#012770]/5"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh metrics"
            className="grid h-8 w-8 place-items-center border border-[#012770]/15 bg-white text-[#012770] transition-colors hover:border-[#ED7D01] disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-[#ED7D01]" : ""} />
          </button>
        </div>
      </div>

      {/* Custom Range Picker Dialog/Drawer */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#012770]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md border border-[#012770]/15 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#012770]/10 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#012770]">
                Select Custom Date Range
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-[#637085] hover:text-[#012770]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleApplyCustomRange} className="mt-4 space-y-4">
              <div>
                <label className="admin-eyebrow block">Start Date</label>
                <input
                  type="date"
                  required
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="mt-1.5 w-full border border-[#012770]/15 p-2.5 text-xs text-[#012770] outline-none focus:border-[#ED7D01]"
                />
              </div>
              <div>
                <label className="admin-eyebrow block">End Date (Inclusive)</label>
                <input
                  type="date"
                  required
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="mt-1.5 w-full border border-[#012770]/15 p-2.5 text-xs text-[#012770] outline-none focus:border-[#ED7D01]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="admin-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="admin-primary">
                  Apply Range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-bold text-red-800">
            Analytics data could not be loaded.
          </p>
          <p className="mt-1 text-xs text-red-600">
            Please check your connection and try refreshing the report.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="admin-primary mt-4"
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="border border-[#012770]/10 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f4f1ea] text-[#637085]">
            <Calendar size={22} />
          </div>
          <h3 className="mt-4 text-sm font-extrabold text-[#012770]">
            No analytics data for this period.
          </h3>
          <p className="mt-1 text-xs text-[#637085]">
            Traffic events, property views, and visitor engagements recorded during this date window will appear here.
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse border border-[#012770]/10 bg-white p-5 shadow-xs"
              >
                <div className="h-2.5 w-16 bg-[#012770]/10" />
                <div className="mt-4 h-7 w-20 bg-[#012770]/15" />
              </div>
            ))}
          </div>
          <div className="h-72 animate-pulse border border-[#012770]/10 bg-white" />
        </div>
      )}

      {/* Analytics Content */}
      {!isLoading && !error && data && overview && overview.totalEvents > 0 && (
        <>
          {/* Executive Intelligence & Attribution Insights */}
          {keyInsights.length > 0 && (
            <div className="border border-[#012770]/15 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-[#012770]/10 pb-3">
                <div className="grid h-6 w-6 place-items-center rounded-full bg-[#ED7D01]/10 text-[#ED7D01]">
                  <Lightbulb size={13} />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#012770]">
                    Executive Intelligence & Attribution Insights
                  </h3>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {keyInsights.map(ins => (
                  <div
                    key={ins.id}
                    className="flex items-start gap-3 border border-[#012770]/10 bg-[#fbfaf7] p-3.5"
                  >
                    <ins.icon size={15} className="mt-0.5 shrink-0 text-[#012770]" />
                    <div>
                      <p className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#637085]">
                        {ins.title}
                      </p>
                      <p className="mt-1 text-[0.68rem] font-medium leading-relaxed text-[#012770]">
                        {ins.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard
              label="Visitors"
              value={overview.uniqueVisitors}
              icon={Users}
              detail="Unique individuals"
            />
            <KpiCard
              label="Sessions"
              value={overview.sessions}
              icon={Clock}
              detail="Browsing visits"
            />
            <KpiCard
              label="Property Views"
              value={overview.propertyViews}
              icon={Building2}
              detail="Detail opens"
            />
            <KpiCard
              label="Service Views"
              value={overview.serviceViews}
              icon={Sparkles}
              detail="Service package visits"
            />
            <KpiCard
              label="WhatsApp Clicks"
              value={overview.whatsappClicks}
              icon={MessageCircle}
              detail="Enquiry conversations"
            />
            <KpiCard
              label="Enquiries"
              value={overview.enquiries}
              icon={Mail}
              detail="Form submissions"
            />
          </div>

          {/* Daily Traffic Chart */}
          <div className="border border-[#012770]/12 bg-white p-6 shadow-xs">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <p className="admin-kicker">TRAFFIC TRENDS</p>
                <h3 className="text-base font-extrabold text-[#012770]">
                  Daily Visitor Activity
                </h3>
              </div>
              <div className="flex items-center gap-4 text-[0.62rem] font-bold text-[#637085]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#ED7D01]" />
                  Unique Visitors
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#012770]/30" />
                  Total Events
                </span>
              </div>
            </div>

            <div className="mt-6 h-72 w-full">
              {data.dailyTraffic && data.dailyTraffic.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.dailyTraffic}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ED7D01" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ED7D01" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#012770" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#012770" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#01277012" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={{ stroke: "#01277020" }}
                      tick={{ fill: "#637085", fontSize: 10 }}
                      tickFormatter={val => {
                        const parts = String(val).split("-");
                        return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: "#01277020" }}
                      tick={{ fill: "#637085", fontSize: 10 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#01277020",
                        fontSize: "11px",
                        boxShadow: "0 4px 20px rgba(1, 39, 112, 0.08)",
                      }}
                      labelFormatter={label => `Date: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="events"
                      name="Total Events"
                      stroke="#012770"
                      strokeWidth={1.5}
                      strokeOpacity={0.4}
                      fillOpacity={1}
                      fill="url(#eventsGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      name="Unique Visitors"
                      stroke="#ED7D01"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#visitorsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#637085]">
                  No daily records available for this range.
                </div>
              )}
            </div>
          </div>

          {/* Marketing & Campaign Performance Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Marketing Performance (Traffic Sources) */}
            <div className="border border-[#012770]/12 bg-white shadow-xs">
              <div className="border-b border-[#012770]/10 p-5">
                <p className="admin-kicker">ACQUISITION</p>
                <h3 className="text-sm font-extrabold text-[#012770]">
                  Marketing Performance by Source
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[0.68rem]">
                  <thead>
                    <tr className="border-b border-[#012770]/10 bg-[#fbfaf7] text-[0.58rem] font-extrabold uppercase tracking-wider text-[#637085]">
                      <th className="px-5 py-3.5">Source</th>
                      <th className="px-4 py-3.5 text-right">Visitors</th>
                      <th className="px-4 py-3.5 text-right">WhatsApp</th>
                      <th className="px-4 py-3.5 text-right">Enquiries</th>
                      <th className="px-5 py-3.5 text-right">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#012770]/5">
                    {data.trafficSources && data.trafficSources.length > 0 ? (
                      data.trafficSources.map((item, idx) => {
                        const sourceLabel = item.source === "direct" ? "Direct" : item.source;
                        const convRate = calculateRate(item.enquiries, item.visitors);
                        return (
                          <tr key={item.source || idx} className="hover:bg-[#fbfaf7]">
                            <td className="px-5 py-3.5 font-bold capitalize text-[#012770]">
                              {sourceLabel}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-[#637085]">
                              {item.visitors.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-[#ED7D01]">
                              {item.whatsappClicks.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-[#012770]">
                              {item.enquiries.toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-right font-extrabold text-green-700">
                              {convRate}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-6 text-center text-[#637085]">
                          No traffic source data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Campaign Attribution */}
            <div className="border border-[#012770]/12 bg-white shadow-xs">
              <div className="border-b border-[#012770]/10 p-5">
                <p className="admin-kicker">ATTRIBUTION</p>
                <h3 className="text-sm font-extrabold text-[#012770]">
                  Campaign Attribution
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[0.68rem]">
                  <thead>
                    <tr className="border-b border-[#012770]/10 bg-[#fbfaf7] text-[0.58rem] font-extrabold uppercase tracking-wider text-[#637085]">
                      <th className="px-5 py-3.5">Campaign Name</th>
                      <th className="px-4 py-3.5 text-right">Visitors</th>
                      <th className="px-4 py-3.5 text-right">WhatsApp</th>
                      <th className="px-4 py-3.5 text-right">Enquiries</th>
                      <th className="px-5 py-3.5 text-right">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#012770]/5">
                    {data.campaigns && data.campaigns.length > 0 ? (
                      data.campaigns.map((item, idx) => {
                        const campaignLabel =
                          item.campaign === "none" ? "Direct / Unattributed" : item.campaign;
                        const convRate = calculateRate(item.enquiries, item.visitors);
                        return (
                          <tr key={item.campaign || idx} className="hover:bg-[#fbfaf7]">
                            <td className="px-5 py-3.5 font-bold text-[#012770]">
                              {campaignLabel}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-[#637085]">
                              {item.visitors.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-[#ED7D01]">
                              {item.whatsappClicks.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-[#012770]">
                              {item.enquiries.toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-right font-extrabold text-green-700">
                              {convRate}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-6 text-center text-[#637085]">
                          No campaign attribution data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Performance Tables Grid: Properties & Services */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top Properties */}
            <div className="border border-[#012770]/12 bg-white shadow-xs">
              <div className="border-b border-[#012770]/10 p-5">
                <p className="admin-kicker">LISTING CONVERSION</p>
                <h3 className="text-sm font-extrabold text-[#012770]">
                  Top Performing Properties
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[0.68rem]">
                  <thead>
                    <tr className="border-b border-[#012770]/10 bg-[#fbfaf7] text-[0.58rem] font-extrabold uppercase tracking-wider text-[#637085]">
                      <th className="px-5 py-3.5">Property Name</th>
                      <th className="px-3 py-3.5 text-right">Views</th>
                      <th className="px-3 py-3.5 text-right">WhatsApp</th>
                      <th className="px-3 py-3.5 text-right">Enquiries</th>
                      <th className="px-3 py-3.5 text-right">WA Rate</th>
                      <th className="px-4 py-3.5 text-right">Enquiry Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#012770]/5">
                    {data.topProperties && data.topProperties.length > 0 ? (
                      data.topProperties.map((p, idx) => {
                        const name = resolveEntityName(p.propertyId, propertyMap, "Unknown Property");
                        const waRate = calculateRate(p.whatsappClicks, p.views);
                        const enqRate = calculateRate(p.enquiries, p.views);
                        return (
                          <tr key={p.propertyId || idx} className="hover:bg-[#fbfaf7]">
                            <td className="px-5 py-3.5 font-bold text-[#012770]">
                              {name}
                            </td>
                            <td className="px-3 py-3.5 text-right font-medium text-[#637085]">
                              {p.views.toLocaleString()}
                            </td>
                            <td className="px-3 py-3.5 text-right font-medium text-[#ED7D01]">
                              {p.whatsappClicks.toLocaleString()}
                            </td>
                            <td className="px-3 py-3.5 text-right font-bold text-[#012770]">
                              {p.enquiries.toLocaleString()}
                            </td>
                            <td className="px-3 py-3.5 text-right font-semibold text-[#ED7D01]">
                              {waRate}
                            </td>
                            <td className="px-4 py-3.5 text-right font-extrabold text-green-700">
                              {enqRate}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-6 text-center text-[#637085]">
                          No property views recorded in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Services */}
            <div className="border border-[#012770]/12 bg-white shadow-xs">
              <div className="border-b border-[#012770]/10 p-5">
                <p className="admin-kicker">SERVICE ENGAGEMENT</p>
                <h3 className="text-sm font-extrabold text-[#012770]">
                  Top Performing Services
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[0.68rem]">
                  <thead>
                    <tr className="border-b border-[#012770]/10 bg-[#fbfaf7] text-[0.58rem] font-extrabold uppercase tracking-wider text-[#637085]">
                      <th className="px-5 py-3.5">Service Name</th>
                      <th className="px-3 py-3.5 text-right">Views</th>
                      <th className="px-3 py-3.5 text-right">WhatsApp</th>
                      <th className="px-3 py-3.5 text-right">Enquiries</th>
                      <th className="px-3 py-3.5 text-right">WA Rate</th>
                      <th className="px-4 py-3.5 text-right">Enquiry Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#012770]/5">
                    {data.topServices && data.topServices.length > 0 ? (
                      data.topServices.map((s, idx) => {
                        const name = resolveEntityName(s.serviceId, serviceMap, "Unknown Service");
                        const waRate = calculateRate(s.whatsappClicks, s.views);
                        const enqRate = calculateRate(s.enquiries, s.views);
                        return (
                          <tr key={s.serviceId || idx} className="hover:bg-[#fbfaf7]">
                            <td className="px-5 py-3.5 font-bold text-[#012770]">
                              {name}
                            </td>
                            <td className="px-3 py-3.5 text-right font-medium text-[#637085]">
                              {s.views.toLocaleString()}
                            </td>
                            <td className="px-3 py-3.5 text-right font-medium text-[#ED7D01]">
                              {s.whatsappClicks.toLocaleString()}
                            </td>
                            <td className="px-3 py-3.5 text-right font-bold text-[#012770]">
                              {s.enquiries.toLocaleString()}
                            </td>
                            <td className="px-3 py-3.5 text-right font-semibold text-[#ED7D01]">
                              {waRate}
                            </td>
                            <td className="px-4 py-3.5 text-right font-extrabold text-green-700">
                              {enqRate}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-6 text-center text-[#637085]">
                          No service views recorded in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Lead Mix, Traffic Mediums & Referrers Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Lead Mix Table */}
            <div className="border border-[#012770]/12 bg-white shadow-xs">
              <div className="border-b border-[#012770]/10 p-4">
                <p className="admin-kicker">DEMAND BREAKDOWN</p>
                <h4 className="text-xs font-extrabold text-[#012770]">
                  Lead Mix (Enquiry Type)
                </h4>
              </div>
              <div className="divide-y divide-[#012770]/5">
                {data.enquiryTypes && data.enquiryTypes.length > 0 ? (
                  data.enquiryTypes.map((item, idx) => {
                    const share = calculateRate(item.count, totalEnquiriesCount);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-4 py-3 text-[0.68rem]"
                      >
                        <span className="font-bold text-[#012770]">
                          {item.type}
                        </span>
                        <div className="text-right">
                          <span className="font-extrabold text-[#012770]">
                            {item.count.toLocaleString()}
                          </span>
                          <span className="ml-1.5 text-[0.58rem] font-bold text-[#ED7D01]">
                            ({share})
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-[#637085]">
                    No enquiry type submissions recorded.
                  </div>
                )}
              </div>
            </div>

            {/* Traffic Mediums */}
            <div className="border border-[#012770]/12 bg-white shadow-xs">
              <div className="border-b border-[#012770]/10 p-4">
                <p className="admin-kicker">CHANNELS</p>
                <h4 className="text-xs font-extrabold text-[#012770]">
                  Traffic Mediums
                </h4>
              </div>
              <div className="divide-y divide-[#012770]/5">
                {data.trafficMediums && data.trafficMediums.length > 0 ? (
                  data.trafficMediums.slice(0, 7).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-3 text-[0.68rem]"
                    >
                      <span className="font-bold capitalize text-[#012770]">
                        {item.medium === "none" ? "None (Direct)" : item.medium}
                      </span>
                      <div className="text-right">
                        <span className="font-extrabold text-[#012770]">
                          {item.visitors.toLocaleString()}
                        </span>
                        <span className="ml-1 text-[0.58rem] text-[#637085]">
                          ({item.enquiries} enq)
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-[#637085]">
                    No medium data
                  </div>
                )}
              </div>
            </div>

            {/* Top Referrers */}
            <div className="border border-[#012770]/12 bg-white shadow-xs">
              <div className="border-b border-[#012770]/10 p-4">
                <p className="admin-kicker">ORIGINS</p>
                <h4 className="text-xs font-extrabold text-[#012770]">
                  Top Referrers
                </h4>
              </div>
              <div className="divide-y divide-[#012770]/5">
                {data.referrers && data.referrers.length > 0 ? (
                  data.referrers.slice(0, 7).map((item, idx) => {
                    const cleanRef =
                      item.referrer === "direct"
                        ? "Direct"
                        : item.referrer.replace(/^https?:\/\/(www\.)?/, "");
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-4 py-3 text-[0.68rem]"
                      >
                        <span
                          className="truncate pr-2 font-bold text-[#012770]"
                          title={item.referrer}
                        >
                          {cleanRef}
                        </span>
                        <div className="shrink-0 text-right">
                          <span className="font-extrabold text-[#012770]">
                            {item.visitors.toLocaleString()}
                          </span>
                          <span className="ml-1 text-[0.58rem] text-[#637085]">
                            ({item.events} ev)
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-[#637085]">
                    No referrer data
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Engagement Funnel Section */}
          <div className="border border-[#012770]/12 bg-white p-6 shadow-xs">
            <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
              <div>
                <p className="admin-kicker">OVERALL ENGAGEMENT</p>
                <h3 className="text-base font-extrabold text-[#012770]">
                  Website Engagement Overview
                </h3>
              </div>
              <p className="text-[0.68rem] text-[#637085]">
                Overall engagement metrics across property and contact touchpoints.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="border border-[#012770]/10 bg-[#fbfaf7] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#637085]">
                    1. Property Discovery
                  </span>
                  <Eye size={16} className="text-[#012770]" />
                </div>
                <div className="mt-3 text-2xl font-extrabold text-[#012770]">
                  {overview.propertyViews.toLocaleString()}
                </div>
                <p className="mt-1 text-[0.68rem] text-[#637085]">
                  Total property detail views
                </p>
              </div>

              <div className="relative border border-[#012770]/10 bg-[#fbfaf7] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#637085]">
                    2. WhatsApp Contact
                  </span>
                  <MessageCircle size={16} className="text-[#ED7D01]" />
                </div>
                <div className="mt-3 text-2xl font-extrabold text-[#012770]">
                  {overview.whatsappClicks.toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[0.68rem] font-bold text-[#ED7D01]">
                  <span>WhatsApp rate: {whatsappConversionRate}</span>
                </div>
              </div>

              <div className="border border-[#012770]/10 bg-[#fbfaf7] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#637085]">
                    3. Form Enquiries
                  </span>
                  <CheckCircle2 size={16} className="text-green-600" />
                </div>
                <div className="mt-3 text-2xl font-extrabold text-[#012770]">
                  {overview.enquiries.toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[0.68rem] font-bold text-green-700">
                  <span>Enquiry rate: {enquiryConversionRate}</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-[0.65rem] leading-relaxed text-[#637085]">
              * Note: Conversion percentages are calculated relative to property views as an overall engagement benchmark. WhatsApp contacts and lead enquiries may also originate from service pages, navigation headers, and general CTAs.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// KPI Metric Card Component
function KpiCard({
  label,
  value,
  icon: Icon,
  detail,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  detail: string;
}) {
  return (
    <div className="border border-[#012770]/12 bg-white p-4.5 shadow-xs transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[0.58rem] font-extrabold uppercase tracking-wider text-[#637085]">
          {label}
        </span>
        <Icon size={14} className="text-[#012770]/40" />
      </div>
      <div className="mt-3 text-2xl font-extrabold tracking-tight text-[#012770]">
        {value.toLocaleString()}
      </div>
      <p className="mt-1 text-[0.6rem] text-[#637085]">{detail}</p>
    </div>
  );
}
