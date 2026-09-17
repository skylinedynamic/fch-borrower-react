import React from 'react'
import { Card, CardBody, CardHeader } from 'reactstrap'

const DetailItemLoader = ({ fullWidth = false }: { fullWidth?: boolean }) => (
  <div className={`mb-3 ${fullWidth ? 'col-12' : 'col-sm-6'}`}>
    <div className="d-flex align-items-center mb-1">
      <span className="placeholder rounded-circle me-2" style={{ width: 12, height: 12 }}></span>
      <span className="placeholder col-4 rounded-1" style={{ height: 10 }}></span>
    </div>
    <span className={`placeholder rounded-2 ${fullWidth ? 'col-11' : 'col-9'}`} style={{ height: 16 }}></span>
  </div>
)

const SectionCardLoader = ({ children }: { children: React.ReactNode }) => (
  <Card className="border shadow-sm mb-4" aria-hidden="true">
    <CardHeader className="bg-white border-bottom py-3">
      <div className="d-flex align-items-center placeholder-glow">
        <div className="avatar-xs me-2">
           <span className="placeholder rounded-circle w-100 h-100"></span>
        </div>
        <span className="placeholder col-5 rounded-2" style={{ height: 16 }}></span>
      </div>
    </CardHeader>
    <CardBody className="pt-4  placeholder-glow">
      <div className="row">
        {children}
      </div>
    </CardBody>
  </Card>
)

export const PreQualificationDetailsLoader: React.FC = () => {
  return (
    <>
      {/* Underwriting Information */}
      <SectionCardLoader>
        <div className="mb-3 col-sm-6">
          <div className="d-flex align-items-center mb-1">
            <span className="placeholder col-6 rounded-1" style={{ height: 10 }}></span>
          </div>
          <span className="placeholder rounded-pill col-5" style={{ height: 22 }}></span>
        </div>

        <div className="mb-3 col-sm-6">
          <div className="d-flex align-items-center mb-1">
            <span className="placeholder rounded-circle me-2" style={{ width: 12, height: 12 }}></span>
            <span className="placeholder col-5 rounded-1" style={{ height: 10 }}></span>
          </div>
          <span className="placeholder rounded-2 col-7" style={{ height: 16 }}></span>
        </div>

        <div className="mb-3 col-12">
          <div className="d-flex align-items-center mb-1">
            <span className="placeholder col-3 rounded-1" style={{ height: 10 }}></span>
          </div>
          <div className="d-flex flex-column gap-1">
            <span className="placeholder rounded-1 col-12" style={{ height: 14 }}></span>
            <span className="placeholder rounded-1 col-10" style={{ height: 14 }}></span>
          </div>
        </div>

        <div className="mb-3 col-12">
          <div className="d-flex align-items-center mb-1">
            <span className="placeholder col-4 rounded-1" style={{ height: 10 }}></span>
          </div>
          <div className="d-flex flex-wrap gap-2 pt-1">
            <span className="placeholder rounded-pill col-4" style={{ height: 24 }}></span>
            <span className="placeholder rounded-pill col-3" style={{ height: 24 }}></span>
          </div>
        </div>

        <div className="mb-3 col-12">
          <div className="d-flex align-items-center mb-1">
            <span className="placeholder col-4 rounded-1" style={{ height: 10 }}></span>
          </div>
          <div className="d-flex flex-column gap-2 ps-3 pt-1">
            <span className="placeholder rounded-1 col-11" style={{ height: 14 }}></span>
            <span className="placeholder rounded-1 col-9" style={{ height: 14 }}></span>
            <span className="placeholder rounded-1 col-10" style={{ height: 14 }}></span>
          </div>
        </div>
      </SectionCardLoader>

      {/* Personal Info */}
      <SectionCardLoader>
        <DetailItemLoader fullWidth />
        <DetailItemLoader />
        <DetailItemLoader />
        <DetailItemLoader fullWidth />
        <DetailItemLoader />
      </SectionCardLoader>

      {/* Business Info */}
      <SectionCardLoader>
        <DetailItemLoader fullWidth />
        <DetailItemLoader />
        <DetailItemLoader />
        <DetailItemLoader />
        <DetailItemLoader />
        <DetailItemLoader />
      </SectionCardLoader>

      {/* Financial Info */}
      <SectionCardLoader>
        <DetailItemLoader />
        <DetailItemLoader />
        <DetailItemLoader fullWidth />

        <div className="col-12"><hr className="border-light my-3 opacity-25" /></div>

        <DetailItemLoader />
        <DetailItemLoader />

        <div className="col-12"><hr className="border-light my-3 opacity-25" /></div>

        <DetailItemLoader />
        <DetailItemLoader />
      </SectionCardLoader>
    </>
  )
}
