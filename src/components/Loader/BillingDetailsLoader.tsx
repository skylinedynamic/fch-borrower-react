import React from 'react';
import { Skeleton } from 'primereact/skeleton';

export default function BillingDetailsLoader() {
  return (
    <div className="row g-3 mb-3">
      {/* 3 Metric Cards Skeletons */}
      {[1, 2, 3].map((item) => (
        <div className="col-xl-4 col-md-6 col-12" key={item}>
          <div className="card billing-card-wrapper h-100 mb-0">
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <Skeleton width="38px" height="38px" borderRadius="4px"></Skeleton>
                  <Skeleton width="130px" height="0.85rem" borderRadius="4px"></Skeleton>
                </div>
                <Skeleton width="65px" height="1.3rem" borderRadius="20px"></Skeleton>
              </div>
              <div className="my-1">
                <Skeleton width="110px" height="1.5rem" borderRadius="4px" className="mb-2"></Skeleton>
                <Skeleton width="160px" height="0.8rem" borderRadius="4px" className="mb-1"></Skeleton>
                <Skeleton width="120px" height="0.8rem" borderRadius="4px"></Skeleton>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Subscription Overview Skeleton Row */}
      <div className="col-12">
        <div className="card billing-card-wrapper mb-0">
          <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between p-3 pb-0">
            <div className="d-flex align-items-center gap-2">
              <Skeleton width="38px" height="38px" borderRadius="4px"></Skeleton>
              <div>
                <Skeleton width="160px" height="1.2rem" borderRadius="4px" className="mb-1"></Skeleton>
                <Skeleton width="210px" height="0.8rem" borderRadius="4px"></Skeleton>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Skeleton width="65px" height="1.4rem" borderRadius="20px"></Skeleton>
            </div>
          </div>
          <div className="card-body p-3">
            <div className="row g-3">
              {[1, 2, 3, 4].map((col) => (
                <div key={col} className="col-xl-3 col-md-6 col-12">
                  <div className="p-3 bg-light rounded-1">
                    <Skeleton width="100px" height="0.75rem" borderRadius="4px" className="mb-2"></Skeleton>
                    <Skeleton width="120px" height="1.1rem" borderRadius="4px"></Skeleton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="col-12">
        <div className="card border-0 shadow-sm rounded-1">
          <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between p-3 pb-2">
            <Skeleton width="180px" height="1.4rem" borderRadius="4px"></Skeleton>
            <Skeleton width="120px" height="0.9rem" borderRadius="4px"></Skeleton>
          </div>
          <div className="card-body p-0">
            <div className="p-3 pt-0">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="d-flex align-items-center justify-content-between py-3 border-bottom border-light-subtle">
                  <Skeleton width="15%" height="0.9rem" borderRadius="4px"></Skeleton>
                  <Skeleton width="15%" height="0.9rem" borderRadius="4px"></Skeleton>
                  <Skeleton width="15%" height="0.9rem" borderRadius="4px"></Skeleton>
                  <Skeleton width="12%" height="0.9rem" borderRadius="4px"></Skeleton>
                  <Skeleton width="10%" height="0.9rem" borderRadius="4px"></Skeleton>
                  <Skeleton width="10%" height="0.9rem" borderRadius="4px"></Skeleton>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
