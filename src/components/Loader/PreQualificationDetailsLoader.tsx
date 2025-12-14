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
