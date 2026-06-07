export const mockPlays = [
  {
    id: "foundation-100",
    name: "Foundation 100 Play™",
    description: "Build $75K - $150K in unsecured business credit.",
    isRecommended: true,
    target_exposure_min: 75000,
    target_exposure_max: 150000,
    est_timeline_min: 5,
    est_timeline_max: 10,
    approval_probability: 82,
    benefits: [
      "Step-by-step card application sequence",
      "Real-time progress tracking",
      "Stop rules to protect your credit",
      "Guidance every step of the way"
    ],
    checklist: [
      { id: "bus_info", label: "Business Information", status: "Complete" },
      { id: "ein_verified", label: "EIN Verified", status: "Complete" },
      { id: "personal_credit", label: "Personal Credit Pulled", status: "Complete" },
      { id: "bus_bank", label: "Business Bank Account", status: "Complete" },
      { id: "identity", label: "Identity Verified", status: "Complete" },
      { id: "no_derog", label: "No Recent Derogatories", status: "Complete" }
    ],
    roadmap: [
      {
        id: "step-1",
        day: 1,
        issuer: "Chase",
        card_name: "Ink Cash",
        exposure_min: 5000,
        exposure_max: 25000,
        status: "Active", // "Completed", "Active", "Locked"
        why: "Great first step with high approval odds and strong limits.",
        approval_odds: 85,
        hard_pull: "Yes",
        requirements: [
          "Good personal credit",
          "Low credit utilization",
          "No recent late payments"
        ],
        result: null // e.g. { status: 'Approved', limit: 12000 }
      },
      {
        id: "step-2",
        day: 2,
        issuer: "Chase",
        card_name: "Ink Unlimited",
        exposure_min: 5000,
        exposure_max: 25000,
        status: "Locked",
        why: "Secondary Chase card to build internal profile.",
        approval_odds: 80,
        hard_pull: "No (often consolidated)",
        requirements: ["Approved for Step 1"],
        result: null
      },
      {
        id: "step-3",
        day: 3,
        issuer: "Amex",
        card_name: "Blue Business Plus",
        exposure_min: 5000,
        exposure_max: 25000,
        status: "Locked",
        why: "High limit potential with no hard pull if existing customer.",
        approval_odds: 75,
        hard_pull: "No (If existing)",
        requirements: ["Strong personal profile"],
        result: null
      },
      {
        id: "step-4",
        day: 5,
        issuer: "Bank of America",
        card_name: "Business Advantage",
        exposure_min: 5000,
        exposure_max: 25000,
        status: "Locked",
        why: "Relationship builder card.",
        approval_odds: 70,
        hard_pull: "Yes",
        requirements: ["Bank account recommended"],
        result: null
      },
      {
        id: "step-5",
        day: 7,
        issuer: "Citi",
        card_name: "CitiBusiness® Card",
        exposure_min: 5000,
        exposure_max: 25000,
        status: "Locked",
        why: "Excellent for final phase rounding out.",
        approval_odds: 65,
        hard_pull: "Yes",
        requirements: ["Few recent inquiries"],
        result: null
      }
    ]
  },
  {
    id: "startup-launch",
    name: "Startup Launch Play™",
    description: "Initial credit lines for brand new entities.",
    isRecommended: false,
    target_exposure_min: 25000,
    target_exposure_max: 75000,
    est_timeline_min: 3,
    est_timeline_max: 7,
    approval_probability: 72,
    benefits: [],
    checklist: [],
    roadmap: []
  },
  {
    id: "zero-cost",
    name: "Zero-Cost Capital Play™",
    description: "Focus on 0% APR intro offers for operational runway.",
    isRecommended: false,
    target_exposure_min: 50000,
    target_exposure_max: 150000,
    est_timeline_min: 7,
    est_timeline_max: 14,
    approval_probability: 78,
    benefits: [],
    checklist: [],
    roadmap: []
  }
];

// Helper to format currency
export const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
