import React from 'react';
import { Skeleton } from 'primereact/skeleton';

export default function DetailsSkeletonLoader() {
    return (
        <div className="row">
            <div className="col-xxl-12">
                <div className="card border-0 shadow-sm overflow-hidden">
                    <div className="card-header bg-white p-4">
                        <div className="d-flex align-items-center">
                            <Skeleton shape="circle" size="3rem" className="me-3"></Skeleton>
                            <div className="flex-grow-1">
                                <Skeleton width="40%" height="1.5rem" className="mb-2"></Skeleton>
                                <Skeleton width="20%" height="1rem"></Skeleton>
                            </div>
                            <div className="text-end">
                                <Skeleton width="100px" height="2rem" className="mb-2 ms-auto"></Skeleton>
                                <Skeleton width="60px" height="1.5rem" className="ms-auto"></Skeleton>
                            </div>
                        </div>
                    </div>
                    <div className="card-body p-4 border-bottom border-bottom-dashed">
                        <div className="row g-4">
                            <div className="col-lg-6 col-md-6">
                                <Skeleton width="150px" height="1.5rem" className="mb-3"></Skeleton>
                                <Skeleton width="60%" height="1rem" className="mb-2"></Skeleton>
                                <Skeleton width="50%" height="1rem"></Skeleton>
                            </div>
                            <div className="col-lg-6 col-md-6">
                                <Skeleton width="150px" height="1.5rem" className="mb-3"></Skeleton>
                                <Skeleton width="70%" height="1rem" className="mb-2"></Skeleton>
                                <Skeleton width="60%" height="1rem" className="mb-2"></Skeleton>
                                <Skeleton width="50%" height="1rem"></Skeleton>
                            </div>
                        </div>
                    </div>
                    <div className="card-body p-4">
                        <Skeleton width="100%" height="200px"></Skeleton>
                    </div>
                </div>
            </div>
        </div>
    );
}
