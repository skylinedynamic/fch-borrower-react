import React from 'react';
import StatisticsCard from '../../../components/Common/StatisticsCard';
import StatisticsCardSkeleton from '../../../components/Common/StatisticsCardSkeleton';

export default function FundingReviewStats({ stats, loading }: { stats?: any, loading?: boolean }) {
    if (loading && !stats) {
        return (
            <div className="row">
                <StatisticsCardSkeleton />
                <StatisticsCardSkeleton />
                <StatisticsCardSkeleton />
                <StatisticsCardSkeleton />
            </div>
        );
    }
    
    const config = [
        {
            title: "Total Reviews",
            dataKey: "total_reviews",
            icon: "ri-file-list-3-line",
            colorVariant: "primary",
            isAmount: false
        },
        {
            title: "Total Approved",
            dataKey: "approved",
            icon: "ri-checkbox-circle-line",
            colorVariant: "success",
            isAmount: false
        },
        {
            title: "Total Pending",
            dataKey: "pending",
            icon: "ri-time-line",
            colorVariant: "info",
            isAmount: false
        },
        {
            title: "Total Rejected",
            dataKey: "rejected",
            icon: "ri-close-circle-line",
            colorVariant: "danger",
            isAmount: false
        }
    ];

    return (
        <div className="row">
            {config.map((item, index) => (
                <StatisticsCard
                    key={`stat-${index}`}
                    title={item.title}
                    count={item.isAmount ? `$${Number(stats?.[item.dataKey] || 0).toLocaleString()}` : (stats?.[item.dataKey] || 0)}
                    icon={item.icon}
                    colorVariant={item.colorVariant}
                />
            ))}
        </div>
    );
}
