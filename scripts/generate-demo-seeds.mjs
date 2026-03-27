import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "data");

const TIMESTAMP = "2026-03-26T00:00:00.000Z";
const MONTHS = [
  { label: "Jan", index: 1, season: 0.94 },
  { label: "Feb", index: 2, season: 0.97 },
  { label: "Mar", index: 3, season: 1.0 },
  { label: "Apr", index: 4, season: 1.03 },
  { label: "May", index: 5, season: 1.08 },
  { label: "Jun", index: 6, season: 1.11 },
  { label: "Jul", index: 7, season: 1.09 },
  { label: "Aug", index: 8, season: 1.07 },
  { label: "Sep", index: 9, season: 1.14 },
  { label: "Oct", index: 10, season: 1.19 },
  { label: "Nov", index: 11, season: 1.28 },
  { label: "Dec", index: 12, season: 1.42 }
];

function round(value, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function stableHash(...parts) {
  const input = parts.join("|");
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 1000003;
  }
  return hash;
}

function toAscii(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function compareDescByPeriod(left, right) {
  if (left.period === right.period) return 0;
  return left.period < right.period ? 1 : -1;
}

async function readExistingDatasets() {
  const raw = await fs.readFile(path.join(dataDir, "datasets.json"), "utf8");
  const parsed = JSON.parse(raw);
  return parsed.datasets ?? [];
}

async function buildHrDataset() {
  const datasets = await readExistingDatasets();
  const existing =
    datasets.find((dataset) => dataset.id === "hr_dataset") ??
    datasets.find((dataset) => dataset.name === "HR_dataset");

  if (!existing) {
    throw new Error("Could not find an existing HR_dataset seed to translate.");
  }

  const departmentMap = {
    "Recursos Humanos": "Human Resources",
    "Human Resources": "Human Resources",
    "Tecnología": "Technology",
    Tecnologia: "Technology",
    "Tecnologia": "Technology",
    Technology: "Technology",
    Ventas: "Sales",
    Sales: "Sales",
    Operaciones: "Operations",
    Operations: "Operations",
    Marketing: "Marketing",
    Finanzas: "Finance",
    Finance: "Finance"
  };

  const genderMap = {
    Femenino: "Female",
    Female: "Female",
    Masculino: "Male",
    Male: "Male"
  };

  const locationMap = {
    Sevilla: "Seville",
    Seville: "Seville",
    Madrid: "Madrid",
    Barcelona: "Barcelona",
    Valencia: "Valencia",
    Bilbao: "Bilbao"
  };

  const rows = existing.rows
    .map((row) => ({
      employee_id: String(row.employee_id),
      full_name: toAscii(String(row.full_name)),
      department: departmentMap[String(row.department)] ?? toAscii(String(row.department)),
      position: toAscii(String(row.position)),
      level: toAscii(String(row.level)),
      salary: Number(row.salary),
      hire_date: String(row.hire_date),
      hire_year: Number(String(row.hire_date).slice(0, 4)),
      age: Number(row.age),
      gender: genderMap[String(row.gender)] ?? toAscii(String(row.gender)),
      performance_score: Number(row.performance_score),
      training_hours: Number(row.training_hours),
      satisfaction_score: Number(row.satisfaction_score),
      absenteeism_days: Number(row.absenteeism_days),
      overtime_hours: Number(row.overtime_hours),
      location: locationMap[String(row.location)] ?? toAscii(String(row.location))
    }))
    .sort((left, right) => {
      if (left.performance_score === right.performance_score) {
        return left.full_name.localeCompare(right.full_name, "en");
      }
      return right.performance_score - left.performance_score;
    });

  return {
    id: "hr_dataset",
    name: "HR_dataset",
    columns: [
      "employee_id",
      "full_name",
      "department",
      "position",
      "level",
      "salary",
      "hire_date",
      "hire_year",
      "age",
      "gender",
      "performance_score",
      "training_hours",
      "satisfaction_score",
      "absenteeism_days",
      "overtime_hours",
      "location"
    ],
    rows,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    readOnly: false
  };
}

function buildCoffeeDataset() {
  const blends = [
    {
      blend: "Aurora Blend",
      origin: "Ethiopia",
      roast_profile: "Light",
      bag_price: 21,
      demand: 1.06,
      subscription: 1.08,
      cup_score: 87.8
    },
    {
      blend: "Summit Espresso",
      origin: "Colombia",
      roast_profile: "Medium",
      bag_price: 19,
      demand: 1.2,
      subscription: 1.14,
      cup_score: 86.9
    },
    {
      blend: "Harbor Decaf",
      origin: "Guatemala",
      roast_profile: "Dark",
      bag_price: 18,
      demand: 0.82,
      subscription: 0.78,
      cup_score: 84.7
    },
    {
      blend: "Night Shift",
      origin: "Kenya",
      roast_profile: "Espresso",
      bag_price: 23,
      demand: 0.96,
      subscription: 0.9,
      cup_score: 88.4
    }
  ];

  const rows = [];
  for (const month of MONTHS) {
    for (const blend of blends) {
      const year = 2025;
      const period = `${year}-${String(month.index).padStart(2, "0")}`;
      const variance = 0.94 + (stableHash(blend.blend, period) % 11) / 100;
      const bagsSold = Math.round(205 * blend.demand * month.season * variance);
      const subscriptionOrders = Math.round(48 * blend.subscription * (0.92 + month.index * 0.015) * variance);
      const revenue = Math.round((bagsSold * blend.bag_price + subscriptionOrders * blend.bag_price * 1.12) * 1.04);
      const cupScore = round(blend.cup_score + ((stableHash(period, blend.origin) % 7) - 3) * 0.12, 1);
      rows.push({
        year,
        month: month.label,
        period,
        blend: blend.blend,
        origin: blend.origin,
        roast_profile: blend.roast_profile,
        bags_sold: bagsSold,
        subscription_orders: subscriptionOrders,
        revenue,
        cup_score: cupScore
      });
    }
  }

  rows.sort((left, right) => {
    const periodOrder = compareDescByPeriod(left, right);
    if (periodOrder !== 0) return periodOrder;
    return right.revenue - left.revenue;
  });

  return {
    id: "coffee_roastery_lab",
    name: "coffee_roastery_lab",
    columns: [
      "year",
      "month",
      "period",
      "blend",
      "origin",
      "roast_profile",
      "bags_sold",
      "subscription_orders",
      "revenue",
      "cup_score"
    ],
    rows,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    readOnly: false
  };
}

function buildSalesDataset() {
  const countries = {
    US: { demand: 1.34, ticket: 1.18 },
    Canada: { demand: 1.05, ticket: 1.08 },
    Mexico: { demand: 0.84, ticket: 0.79 },
    UK: { demand: 1.13, ticket: 1.14 }
  };

  const channels = {
    Online: { demand: 1.28, ticket: 1.02 },
    Retail: { demand: 1.0, ticket: 0.95 },
    Wholesale: { demand: 0.72, ticket: 0.88 }
  };

  const categories = {
    Electronics: { demand: 0.84, ticket: 420 },
    Furniture: { demand: 0.52, ticket: 610 },
    "Office Supplies": { demand: 1.42, ticket: 165 },
    Accessories: { demand: 1.88, ticket: 92 }
  };

  const yearFactors = {
    2024: 1.0,
    2025: 1.12
  };

  const rows = [];
  for (const year of [2024, 2025]) {
    for (const month of MONTHS) {
      const period = `${year}-${String(month.index).padStart(2, "0")}`;
      for (const [country, countryConfig] of Object.entries(countries)) {
        for (const [channel, channelConfig] of Object.entries(channels)) {
          for (const [category, categoryConfig] of Object.entries(categories)) {
            const variance = 0.91 + (stableHash(period, country, channel, category) % 17) / 100;
            const orders = Math.round(
              132 *
                yearFactors[year] *
                month.season *
                countryConfig.demand *
                channelConfig.demand *
                categoryConfig.demand *
                variance
            );
            const avgOrderValue = round(
              categoryConfig.ticket *
                countryConfig.ticket *
                channelConfig.ticket *
                (0.97 + month.index * 0.008) *
                (year === 2025 ? 1.04 : 1.0) *
                variance,
              2
            );
            const sales = Math.round(orders * avgOrderValue);
            rows.push({
              year,
              month: month.label,
              period,
              country,
              channel,
              category,
              sales,
              orders,
              avg_order_value: avgOrderValue
            });
          }
        }
      }
    }
  }

  rows.sort((left, right) => {
    const periodOrder = compareDescByPeriod(left, right);
    if (periodOrder !== 0) return periodOrder;
    return right.sales - left.sales;
  });

  return {
    id: "sales_complex",
    name: "Sales Complex",
    columns: [
      "year",
      "month",
      "period",
      "country",
      "channel",
      "category",
      "sales",
      "orders",
      "avg_order_value"
    ],
    rows,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    readOnly: false
  };
}

function buildMarketingDataset() {
  const channelConfig = {
    "Google Search": { impressions: 210000, ctr: 4.6, cpc: 4.2, convMultiplier: 1.04 },
    "Meta Ads": { impressions: 320000, ctr: 1.7, cpc: 2.4, convMultiplier: 0.92 },
    LinkedIn: { impressions: 120000, ctr: 0.95, cpc: 7.8, convMultiplier: 0.76 },
    Email: { impressions: 95000, ctr: 3.5, cpc: 0.58, convMultiplier: 1.18 }
  };

  const objectiveConfig = {
    "Lead Generation": { impression: 1.0, conversionRate: 4.6, revenuePerConversion: 520 },
    "Brand Awareness": { impression: 1.12, conversionRate: 1.4, revenuePerConversion: 260 },
    Retention: { impression: 0.88, conversionRate: 7.8, revenuePerConversion: 210 },
    "Product Launch": { impression: 1.08, conversionRate: 2.9, revenuePerConversion: 680 }
  };

  const regionConfig = {
    "North America": { impressions: 1.0, cost: 1.12, revenue: 1.16 },
    Europe: { impressions: 0.87, cost: 1.0, revenue: 1.04 },
    "Latin America": { impressions: 0.78, cost: 0.74, revenue: 0.82 }
  };

  const audienceConfig = {
    SMB: { conversion: 1.08, revenue: 0.8 },
    Enterprise: { conversion: 0.66, revenue: 1.45 },
    Prospects: { conversion: 0.92, revenue: 1.0 },
    "Existing Customers": { conversion: 1.22, revenue: 0.72 }
  };

  const campaigns = [
    { campaign_id: "cmp_google_brand_search", campaign_name: "Brand Search Acceleration", channel: "Google Search", objective: "Lead Generation", audience: "Prospects", region: "North America", multiplier: 1.05 },
    { campaign_id: "cmp_google_product_demo", campaign_name: "Product Demo Demand", channel: "Google Search", objective: "Product Launch", audience: "Enterprise", region: "North America", multiplier: 1.12 },
    { campaign_id: "cmp_google_latam_launch", campaign_name: "LATAM Search Launch", channel: "Google Search", objective: "Product Launch", audience: "Prospects", region: "Latin America", multiplier: 0.94 },
    { campaign_id: "cmp_meta_demand_capture", campaign_name: "Social Demand Capture", channel: "Meta Ads", objective: "Lead Generation", audience: "SMB", region: "Europe", multiplier: 1.03 },
    { campaign_id: "cmp_meta_retargeting", campaign_name: "Always-On Retargeting", channel: "Meta Ads", objective: "Retention", audience: "Existing Customers", region: "North America", multiplier: 1.08 },
    { campaign_id: "cmp_meta_latam_awareness", campaign_name: "LATAM Awareness Boost", channel: "Meta Ads", objective: "Brand Awareness", audience: "SMB", region: "Latin America", multiplier: 0.96 },
    { campaign_id: "cmp_linkedin_abm_enterprise", campaign_name: "Enterprise ABM Pipeline", channel: "LinkedIn", objective: "Lead Generation", audience: "Enterprise", region: "North America", multiplier: 0.98 },
    { campaign_id: "cmp_linkedin_exec_expansion", campaign_name: "Executive Reach Expansion", channel: "LinkedIn", objective: "Brand Awareness", audience: "Enterprise", region: "Europe", multiplier: 0.92 },
    { campaign_id: "cmp_linkedin_partner_pipeline", campaign_name: "Partner Pipeline Builder", channel: "LinkedIn", objective: "Lead Generation", audience: "Enterprise", region: "Europe", multiplier: 0.95 },
    { campaign_id: "cmp_email_renewal_nurture", campaign_name: "Renewal Nurture Flow", channel: "Email", objective: "Retention", audience: "Existing Customers", region: "North America", multiplier: 1.14 },
    { campaign_id: "cmp_email_upsell_sequence", campaign_name: "Upsell Sequence", channel: "Email", objective: "Retention", audience: "Existing Customers", region: "Europe", multiplier: 1.09 },
    { campaign_id: "cmp_email_launch_education", campaign_name: "Launch Education Series", channel: "Email", objective: "Product Launch", audience: "Prospects", region: "Europe", multiplier: 1.0 }
  ];

  const yearFactor = {
    2024: 1.0,
    2025: 1.1
  };

  const rows = [];
  for (const year of [2024, 2025]) {
    for (const month of MONTHS) {
      const period = `${year}-${String(month.index).padStart(2, "0")}`;
      for (const campaign of campaigns) {
        const channel = channelConfig[campaign.channel];
        const objective = objectiveConfig[campaign.objective];
        const region = regionConfig[campaign.region];
        const audience = audienceConfig[campaign.audience];
        const variance = 0.93 + (stableHash(campaign.campaign_id, period) % 13) / 100;
        const impressions = Math.round(
          channel.impressions *
            objective.impression *
            region.impressions *
            month.season *
            yearFactor[year] *
            campaign.multiplier *
            variance
        );
        const ctr = round(
          channel.ctr *
            (campaign.objective === "Retention" ? 1.08 : 1.0) *
            (campaign.audience === "Existing Customers" ? 1.12 : 1.0) *
            (0.96 + month.index * 0.01) *
            variance,
          2
        );
        const clicks = Math.max(1, Math.round(impressions * (ctr / 100)));
        const conversionRate = round(
          objective.conversionRate *
            channel.convMultiplier *
            audience.conversion *
            (year === 2025 ? 1.04 : 1.0) *
            (0.95 + (stableHash(period, campaign.channel, campaign.objective) % 9) / 100),
          2
        );
        const conversions = Math.max(1, Math.round(clicks * (conversionRate / 100)));
        const cost = Math.round(
          clicks *
            channel.cpc *
            region.cost *
            (0.95 + (stableHash(campaign.region, campaign.audience, period) % 8) / 100)
        );
        const revenueMultiple = Math.max(
          0.7,
          round(
            0.82 +
              (campaign.channel === "Google Search"
                ? 1.05
                : campaign.channel === "Meta Ads"
                  ? 0.55
                  : campaign.channel === "LinkedIn"
                    ? 0.78
                    : 1.18) +
              (campaign.objective === "Lead Generation"
                ? 0.34
                : campaign.objective === "Brand Awareness"
                  ? -0.18
                  : campaign.objective === "Retention"
                    ? 0.52
                    : 0.43) +
              (campaign.audience === "Enterprise"
                ? 0.42
                : campaign.audience === "Existing Customers"
                  ? 0.3
                  : campaign.audience === "Prospects"
                    ? 0.12
                    : 0.05) +
              (campaign.region === "North America" ? 0.18 : campaign.region === "Europe" ? 0.08 : -0.03) +
              (year === 2025 ? 0.1 : 0) +
              ((stableHash(campaign.campaign_name, period) % 9) - 4) * 0.06 +
              (month.season - 1) * 0.45,
            2
          )
        );
        const revenue = Math.round(cost * revenueMultiple);
        const cac = round(cost / conversions, 2);
        const roi = round(((revenue - cost) / cost) * 100, 1);
        rows.push({
          year,
          month: month.label,
          period,
          campaign_id: campaign.campaign_id,
          campaign_name: campaign.campaign_name,
          channel: campaign.channel,
          objective: campaign.objective,
          audience: campaign.audience,
          region: campaign.region,
          impressions,
          clicks,
          conversions,
          cost,
          revenue,
          ctr,
          conversion_rate: conversionRate,
          cac,
          roi
        });
      }
    }
  }

  rows.sort((left, right) => {
    const periodOrder = compareDescByPeriod(left, right);
    if (periodOrder !== 0) return periodOrder;
    return right.revenue - left.revenue;
  });

  return {
    id: "marketing_campaign_performance",
    name: "marketing_campaign_performance",
    columns: [
      "year",
      "month",
      "period",
      "campaign_id",
      "campaign_name",
      "channel",
      "objective",
      "audience",
      "region",
      "impressions",
      "clicks",
      "conversions",
      "cost",
      "revenue",
      "ctr",
      "conversion_rate",
      "cac",
      "roi"
    ],
    rows,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    readOnly: false
  };
}

function filter(id, field, fieldType = "string") {
  return {
    id,
    field,
    fieldType,
    op: "eq",
    value: ""
  };
}

function buildDashboards() {
  return [
    {
      id: "db_demo_coffee",
      name: "Coffee Roastery Lab",
      subtitle: "A simple filter-free sandbox for trying chart layouts and themes.",
      themePreset: "pastel",
      presentation: {
        numberFormat: "compact",
        decimals: 1
      },
      charts: [
        {
          id: "coffee_revenue_combo",
          type: "combo",
          title: "Revenue and Subscription Orders by Period",
          datasetId: "coffee_roastery_lab",
          x: "period",
          barY: "revenue",
          lineY: "subscription_orders",
          source: {
            datasetId: "coffee_roastery_lab",
            xField: "period",
            barField: "revenue",
            lineField: "subscription_orders",
            aggregation: "sum"
          }
        },
        {
          id: "coffee_roast_mix",
          type: "donut",
          title: "Revenue Share by Roast Profile",
          datasetId: "coffee_roastery_lab",
          source: {
            datasetId: "coffee_roastery_lab",
            categoryField: "roast_profile",
            valueField: "revenue",
            aggregation: "sum"
          }
        },
        {
          id: "coffee_origin_radar",
          type: "radar",
          title: "Average Cup Score by Origin",
          datasetId: "coffee_roastery_lab",
          indexField: "origin",
          valueField: "cup_score",
          presentation: {
            numberFormat: "number",
            decimals: 1
          },
          source: {
            datasetId: "coffee_roastery_lab",
            indexField: "origin",
            valueField: "cup_score",
            aggregation: "avg"
          }
        },
        {
          id: "coffee_blend_table",
          type: "table",
          title: "Blend Snapshot",
          datasetId: "coffee_roastery_lab",
          columns: ["period", "blend", "origin", "roast_profile", "bags_sold", "revenue", "cup_score"],
          limit: 12,
          source: {
            datasetId: "coffee_roastery_lab",
            columns: ["period", "blend", "origin", "roast_profile", "bags_sold", "revenue", "cup_score"],
            limit: 12
          }
        }
      ],
      layout: {
        grid: { columns: 5, rows: 2 },
        items: [
          { chart: "coffee_revenue_combo", x: 0, y: 0, w: 3, h: 1 },
          { chart: "coffee_roast_mix", x: 3, y: 0, w: 2, h: 1 },
          { chart: "coffee_origin_radar", x: 0, y: 1, w: 2, h: 1 },
          { chart: "coffee_blend_table", x: 2, y: 1, w: 3, h: 1 }
        ]
      },
      filters: [],
      published: true,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP
    },
    {
      id: "db_demo_hr",
      name: "HR Workforce Overview",
      subtitle: "Headcount, pay, engagement, and hiring patterns across the organization.",
      themePreset: "clean",
      presentation: {
        numberFormat: "compact",
        decimals: 1
      },
      charts: [
        {
          id: "hr_headcount_kpi",
          type: "kpi_card",
          title: "Active Headcount",
          datasetId: "hr_dataset",
          label: "employees",
          format: "number",
          presentation: {
            icon: "users",
            decimals: 0
          },
          source: {
            datasetId: "hr_dataset",
            valueField: "employee_id",
            aggregation: "count",
            format: "number"
          }
        },
        {
          id: "hr_department_donut",
          type: "donut",
          title: "Headcount by Department",
          datasetId: "hr_dataset",
          source: {
            datasetId: "hr_dataset",
            categoryField: "department",
            valueField: "employee_id",
            aggregation: "count"
          }
        },
        {
          id: "hr_department_gender_grouped",
          type: "bar_grouped",
          title: "Headcount by Department and Gender",
          datasetId: "hr_dataset",
          indexBy: "department",
          keys: [],
          source: {
            datasetId: "hr_dataset",
            xField: "department",
            seriesField: "gender",
            valueField: "employee_id",
            aggregation: "count"
          }
        },
        {
          id: "hr_salary_bar",
          type: "bar",
          title: "Average Salary by Department",
          datasetId: "hr_dataset",
          x: "department",
          y: "salary",
          presentation: {
            numberFormat: "currency",
            currency: "USD",
            decimals: 0
          },
          source: {
            datasetId: "hr_dataset",
            xField: "department",
            yField: "salary",
            aggregation: "avg"
          }
        },
        {
          id: "hr_satisfaction_radar",
          type: "radar",
          title: "Average Satisfaction by Department and Level",
          datasetId: "hr_dataset",
          indexField: "department",
          valueField: "satisfaction_score",
          seriesField: "level",
          presentation: {
            numberFormat: "number",
            decimals: 1
          },
          source: {
            datasetId: "hr_dataset",
            indexField: "department",
            valueField: "satisfaction_score",
            seriesField: "level",
            aggregation: "avg"
          }
        },
        {
          id: "hr_perf_scatter",
          type: "scatter",
          title: "Performance vs Satisfaction",
          datasetId: "hr_dataset",
          x: "performance_score",
          y: "satisfaction_score",
          series: "department",
          presentation: {
            numberFormat: "number",
            decimals: 1
          },
          source: {
            datasetId: "hr_dataset",
            xField: "performance_score",
            yField: "satisfaction_score",
            seriesField: "department"
          }
        },
        {
          id: "hr_hires_line",
          type: "line",
          title: "Hires by Year",
          datasetId: "hr_dataset",
          x: "hire_year",
          y: "employee_id",
          presentation: {
            numberFormat: "number",
            decimals: 0
          },
          source: {
            datasetId: "hr_dataset",
            xField: "hire_year",
            yField: "employee_id",
            aggregation: "count"
          }
        },
        {
          id: "hr_employee_table",
          type: "table",
          title: "Employee Snapshot",
          datasetId: "hr_dataset",
          columns: ["full_name", "department", "level", "location", "salary", "performance_score"],
          limit: 10,
          source: {
            datasetId: "hr_dataset",
            columns: ["full_name", "department", "level", "location", "salary", "performance_score"],
            limit: 10
          }
        }
      ],
      layout: {
        grid: { columns: 5, rows: 4 },
        items: [
          { chart: "hr_headcount_kpi", x: 0, y: 0, w: 1, h: 1 },
          { chart: "hr_department_donut", x: 1, y: 0, w: 2, h: 1 },
          { chart: "hr_department_gender_grouped", x: 3, y: 0, w: 2, h: 1 },
          { chart: "hr_salary_bar", x: 0, y: 1, w: 2, h: 1 },
          { chart: "hr_satisfaction_radar", x: 2, y: 1, w: 3, h: 1 },
          { chart: "hr_perf_scatter", x: 0, y: 2, w: 3, h: 1 },
          { chart: "hr_hires_line", x: 3, y: 2, w: 2, h: 1 },
          { chart: "hr_employee_table", x: 0, y: 3, w: 5, h: 1 }
        ]
      },
      filters: [
        filter("filter_department", "department"),
        filter("filter_level", "level"),
        filter("filter_gender", "gender"),
        filter("filter_location", "location")
      ],
      published: true,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP
    },
    {
      id: "db_demo_sales",
      name: "Sales Performance Hub",
      subtitle: "Revenue, order volume, and product mix across markets and channels.",
      themePreset: "business",
      presentation: {
        numberFormat: "compact",
        decimals: 1
      },
      charts: [
        {
          id: "sales_total_kpi",
          type: "kpi_card",
          title: "Total Sales",
          datasetId: "sales_complex",
          label: "gross revenue",
          format: "currency",
          currency: "USD",
          presentation: {
            icon: "trend",
            decimals: 0
          },
          source: {
            datasetId: "sales_complex",
            valueField: "sales",
            aggregation: "sum",
            format: "currency",
            currency: "USD"
          }
        },
        {
          id: "sales_period_combo",
          type: "combo",
          title: "Revenue and Orders by Period",
          datasetId: "sales_complex",
          x: "period",
          barY: "sales",
          lineY: "orders",
          source: {
            datasetId: "sales_complex",
            xField: "period",
            barField: "sales",
            lineField: "orders",
            aggregation: "sum"
          }
        },
        {
          id: "sales_channel_area",
          type: "area",
          title: "Sales Trend by Channel",
          datasetId: "sales_complex",
          x: "period",
          y: "sales",
          series: "channel",
          source: {
            datasetId: "sales_complex",
            xField: "period",
            yField: "sales",
            seriesField: "channel",
            aggregation: "sum"
          }
        },
        {
          id: "sales_country_channel_stack",
          type: "bar_stacked",
          title: "Sales by Country and Channel",
          datasetId: "sales_complex",
          indexBy: "country",
          keys: [],
          source: {
            datasetId: "sales_complex",
            xField: "country",
            seriesField: "channel",
            valueField: "sales",
            aggregation: "sum"
          }
        },
        {
          id: "sales_category_donut",
          type: "donut",
          title: "Sales Share by Category",
          datasetId: "sales_complex",
          source: {
            datasetId: "sales_complex",
            categoryField: "category",
            valueField: "sales",
            aggregation: "sum"
          }
        },
        {
          id: "sales_orders_bar",
          type: "bar",
          title: "Orders by Category",
          datasetId: "sales_complex",
          x: "category",
          y: "orders",
          source: {
            datasetId: "sales_complex",
            xField: "category",
            yField: "orders",
            aggregation: "sum"
          }
        },
        {
          id: "sales_aov_radar",
          type: "radar",
          title: "Average Order Value by Country and Channel",
          datasetId: "sales_complex",
          indexField: "country",
          valueField: "avg_order_value",
          seriesField: "channel",
          presentation: {
            numberFormat: "currency",
            currency: "USD",
            decimals: 0
          },
          source: {
            datasetId: "sales_complex",
            indexField: "country",
            valueField: "avg_order_value",
            seriesField: "channel",
            aggregation: "avg"
          }
        },
        {
          id: "sales_perf_scatter",
          type: "scatter",
          title: "Sales vs Orders",
          datasetId: "sales_complex",
          x: "sales",
          y: "orders",
          series: "country",
          source: {
            datasetId: "sales_complex",
            xField: "sales",
            yField: "orders",
            seriesField: "country"
          }
        },
        {
          id: "sales_detail_table",
          type: "table",
          title: "Sales Detail",
          datasetId: "sales_complex",
          columns: ["period", "country", "channel", "category", "sales", "orders", "avg_order_value"],
          limit: 12,
          source: {
            datasetId: "sales_complex",
            columns: ["period", "country", "channel", "category", "sales", "orders", "avg_order_value"],
            limit: 12
          }
        }
      ],
      layout: {
        grid: { columns: 5, rows: 5 },
        items: [
          { chart: "sales_total_kpi", x: 0, y: 0, w: 1, h: 1 },
          { chart: "sales_period_combo", x: 1, y: 0, w: 4, h: 1 },
          { chart: "sales_channel_area", x: 0, y: 1, w: 3, h: 1 },
          { chart: "sales_category_donut", x: 3, y: 1, w: 2, h: 1 },
          { chart: "sales_perf_scatter", x: 0, y: 2, w: 3, h: 1 },
          { chart: "sales_country_channel_stack", x: 3, y: 2, w: 2, h: 1 },
          { chart: "sales_orders_bar", x: 0, y: 3, w: 2, h: 1 },
          { chart: "sales_aov_radar", x: 2, y: 3, w: 3, h: 1 },
          { chart: "sales_detail_table", x: 0, y: 4, w: 5, h: 1 }
        ]
      },
      filters: [
        filter("filter_year", "year", "number"),
        filter("filter_month", "month"),
        filter("filter_country", "country"),
        filter("filter_channel", "channel"),
        filter("filter_category", "category")
      ],
      published: true,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP
    },
    {
      id: "db_demo_marketing",
      name: "Marketing Campaign Command Center",
      subtitle: "Spend allocation, campaign efficiency, and conversion performance by channel.",
      themePreset: "dark_analytics",
      presentation: {
        numberFormat: "compact",
        decimals: 1
      },
      charts: [
        {
          id: "mkt_roi_kpi",
          type: "kpi_card",
          title: "Blended ROI",
          datasetId: "marketing_campaign_performance",
          label: "average campaign ROI",
          format: "percent",
          presentation: {
            icon: "target",
            decimals: 1
          },
          source: {
            datasetId: "marketing_campaign_performance",
            valueField: "roi",
            aggregation: "avg",
            format: "percent"
          }
        },
        {
          id: "mkt_spend_revenue_combo",
          type: "combo",
          title: "Spend and Revenue by Period",
          datasetId: "marketing_campaign_performance",
          x: "period",
          barY: "cost",
          lineY: "revenue",
          presentation: {
            numberFormat: "currency",
            currency: "USD",
            decimals: 0
          },
          source: {
            datasetId: "marketing_campaign_performance",
            xField: "period",
            barField: "cost",
            lineField: "revenue",
            aggregation: "sum"
          }
        },
        {
          id: "mkt_conversions_grouped",
          type: "bar_grouped",
          title: "Conversions by Channel and Objective",
          datasetId: "marketing_campaign_performance",
          indexBy: "channel",
          keys: [],
          source: {
            datasetId: "marketing_campaign_performance",
            xField: "channel",
            seriesField: "objective",
            valueField: "conversions",
            aggregation: "sum"
          }
        },
        {
          id: "mkt_spend_donut",
          type: "donut",
          title: "Spend Share by Channel",
          datasetId: "marketing_campaign_performance",
          source: {
            datasetId: "marketing_campaign_performance",
            categoryField: "channel",
            valueField: "cost",
            aggregation: "sum"
          }
        },
        {
          id: "mkt_impressions_area",
          type: "area",
          title: "Impressions Trend by Channel",
          datasetId: "marketing_campaign_performance",
          x: "period",
          y: "impressions",
          series: "channel",
          source: {
            datasetId: "marketing_campaign_performance",
            xField: "period",
            yField: "impressions",
            seriesField: "channel",
            aggregation: "sum"
          }
        },
        {
          id: "mkt_ctr_radar",
          type: "radar",
          title: "Average CTR by Channel and Region",
          datasetId: "marketing_campaign_performance",
          indexField: "channel",
          valueField: "ctr",
          seriesField: "region",
          presentation: {
            numberFormat: "percent",
            decimals: 1
          },
          source: {
            datasetId: "marketing_campaign_performance",
            indexField: "channel",
            valueField: "ctr",
            seriesField: "region",
            aggregation: "avg"
          }
        },
        {
          id: "mkt_cost_revenue_scatter",
          type: "scatter",
          title: "Cost vs Revenue by Campaign",
          datasetId: "marketing_campaign_performance",
          x: "cost",
          y: "revenue",
          series: "channel",
          presentation: {
            numberFormat: "currency",
            currency: "USD",
            decimals: 0
          },
          source: {
            datasetId: "marketing_campaign_performance",
            xField: "cost",
            yField: "revenue",
            seriesField: "channel"
          }
        },
        {
          id: "mkt_cac_bar",
          type: "bar",
          title: "Average CAC by Channel",
          datasetId: "marketing_campaign_performance",
          x: "channel",
          y: "cac",
          presentation: {
            numberFormat: "currency",
            currency: "USD",
            decimals: 0
          },
          source: {
            datasetId: "marketing_campaign_performance",
            xField: "channel",
            yField: "cac",
            aggregation: "avg"
          }
        },
        {
          id: "mkt_campaign_table",
          type: "table",
          title: "Campaign Detail",
          datasetId: "marketing_campaign_performance",
          columns: ["period", "campaign_name", "channel", "objective", "region", "conversions", "cost", "revenue", "roi", "cac"],
          limit: 12,
          source: {
            datasetId: "marketing_campaign_performance",
            columns: ["period", "campaign_name", "channel", "objective", "region", "conversions", "cost", "revenue", "roi", "cac"],
            limit: 12
          }
        }
      ],
      layout: {
        grid: { columns: 5, rows: 5 },
        items: [
          { chart: "mkt_roi_kpi", x: 0, y: 0, w: 1, h: 1 },
          { chart: "mkt_spend_revenue_combo", x: 1, y: 0, w: 2, h: 1 },
          { chart: "mkt_spend_donut", x: 3, y: 0, w: 2, h: 1 },
          { chart: "mkt_conversions_grouped", x: 0, y: 1, w: 3, h: 1 },
          { chart: "mkt_impressions_area", x: 3, y: 1, w: 2, h: 1 },
          { chart: "mkt_cost_revenue_scatter", x: 0, y: 2, w: 3, h: 2 },
          { chart: "mkt_ctr_radar", x: 3, y: 2, w: 2, h: 1 },
          { chart: "mkt_cac_bar", x: 3, y: 3, w: 2, h: 1 },
          { chart: "mkt_campaign_table", x: 0, y: 4, w: 5, h: 1 }
        ]
      },
      filters: [
        filter("filter_year", "year", "number"),
        filter("filter_month", "month"),
        filter("filter_channel", "channel"),
        filter("filter_objective", "objective"),
        filter("filter_region", "region"),
        filter("filter_audience", "audience")
      ],
      published: true,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP
    }
  ];
}

function toCsv(dataset) {
  const escapeCell = (value) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const lines = [dataset.columns.join(",")];
  for (const row of dataset.rows) {
    lines.push(dataset.columns.map((column) => escapeCell(row[column])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

async function writeJson(relativePath, payload) {
  const target = path.join(repoRoot, relativePath);
  await fs.writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function writeText(relativePath, contents) {
  const target = path.join(repoRoot, relativePath);
  await fs.writeFile(target, contents, "utf8");
}

async function main() {
  const hrDataset = await buildHrDataset();
  const coffeeDataset = buildCoffeeDataset();
  const salesDataset = buildSalesDataset();
  const marketingDataset = buildMarketingDataset();

  const datasets = [coffeeDataset, hrDataset, salesDataset, marketingDataset];
  const dashboards = buildDashboards();

  await writeJson("data/datasets.json", { datasets });
  await writeJson("data/dashboards.json", { dashboards });
  await writeJson("data/dashboard_versions.json", { snapshots: [] });
  await writeJson("data/deleted_dashboards.json", { dashboards: [] });
  await writeText("data/sales_xyz_complex.csv", toCsv(salesDataset));
  await writeText("data/hr_dashboard_dataset.csv", toCsv(hrDataset));

  const summary = {
    datasets: datasets.map((dataset) => ({ id: dataset.id, rows: dataset.rows.length })),
    dashboards: dashboards.map((dashboard) => ({ id: dashboard.id, charts: dashboard.charts.length }))
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
