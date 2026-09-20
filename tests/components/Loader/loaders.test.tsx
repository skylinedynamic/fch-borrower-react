import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import AdvisorLoader from '../../../src/components/Loader/AdvisorLoader'
import { AgreementSignModalLoader } from '../../../src/components/Loader/AgreementLoader'
import BillingDetailsLoader from '../../../src/components/Loader/BillingDetailsLoader'
import CapitalAccessLoader from '../../../src/components/Loader/CapitalAccessLoader'
import CreditProgressLoader from '../../../src/components/Loader/CreditProgressLoader'
import DashboardLoader from '../../../src/components/Loader/DashboardLoader'
import DetailsSkeletonLoader from '../../../src/components/Loader/DetailsSkeletonLoader'
import DisclosuresSkeleton from '../../../src/components/Loader/DisclosuresSkeleton'
import { DocumentSectionLoader } from '../../../src/components/Loader/DocumentSectionLoader'
import DocumentUploadSkeleton from '../../../src/components/Loader/DocumentUploadSkeleton'
import ErrorState from '../../../src/components/Loader/ErrorState'
import FilterLoader from '../../../src/components/Loader/FilterLoader'
import FormSkeleton from '../../../src/components/Loader/FormSkeleton'
import FundingLoader from '../../../src/components/Loader/FundingLoader'
import PermissionCardsLoader from '../../../src/components/Loader/PermissionCardsLoader'
import { PreQualificationDetailsLoader } from '../../../src/components/Loader/PreQualificationDetailsLoader'
import ResourceDetailLoader from '../../../src/components/Loader/ResourceDetailLoader'
import ResourceHubLoader from '../../../src/components/Loader/ResourceHubLoader'
import RolesGridLoader from '../../../src/components/Loader/RolesGridLoader'
import TabLoader from '../../../src/components/Loader/TabLoader'
import TableLoader from '../../../src/components/Loader/TableLoader'
import { TableRowsLoader } from '../../../src/components/Loader/TableRowsLoader'
import TaskStatusCardsLoader from '../../../src/components/Loader/TaskStatusCardsLoader'
import TierTaskListLoader from '../../../src/components/Loader/TierTaskListLoader'
import VendorCardLoader from '../../../src/components/Loader/VendorCardLoader'
import WizardLoader from '../../../src/components/Loader/WizardLoader'

// These are purely presentational skeleton loaders with no data-fetching or
// business logic — a lightweight "renders without throwing, produces some
// output" smoke test per component, not full behavioral coverage.
const loaders: Array<[string, () => React.ReactElement]> = [
  ['AdvisorLoader', () => <AdvisorLoader />],
  ['AgreementSignModalLoader', () => <AgreementSignModalLoader />],
  ['BillingDetailsLoader', () => <BillingDetailsLoader />],
  ['CapitalAccessLoader (list)', () => <CapitalAccessLoader type="list" />],
  ['CapitalAccessLoader (detail)', () => <CapitalAccessLoader type="detail" />],
  ['CreditProgressLoader', () => <CreditProgressLoader />],
  ['DashboardLoader', () => <DashboardLoader />],
  ['DetailsSkeletonLoader', () => <DetailsSkeletonLoader />],
  ['DisclosuresSkeleton', () => <DisclosuresSkeleton />],
  ['DocumentSectionLoader', () => <DocumentSectionLoader />],
  ['DocumentUploadSkeleton', () => <DocumentUploadSkeleton />],
  ['ErrorState', () => <ErrorState />],
  ['FilterLoader', () => <FilterLoader />],
  ['FormSkeleton', () => <FormSkeleton />],
  ['FundingLoader', () => <FundingLoader />],
  ['PermissionCardsLoader', () => <PermissionCardsLoader />],
  ['PreQualificationDetailsLoader', () => <PreQualificationDetailsLoader />],
  ['ResourceDetailLoader', () => <ResourceDetailLoader />],
  ['ResourceHubLoader', () => <ResourceHubLoader />],
  ['RolesGridLoader', () => <RolesGridLoader />],
  ['TabLoader', () => <TabLoader />],
  ['TableLoader', () => <TableLoader />],
  ['TableRowsLoader', () => <TableRowsLoader />],
  ['TaskStatusCardsLoader', () => <TaskStatusCardsLoader />],
  ['TierTaskListLoader', () => <TierTaskListLoader />],
  ['VendorCardLoader', () => <VendorCardLoader />],
  ['WizardLoader', () => <WizardLoader />],
]

describe('Loader components (smoke)', () => {
  it.each(loaders)('%s renders without throwing', (_name, renderLoader) => {
    const { container } = render(renderLoader())
    expect(container).not.toBeEmptyDOMElement()
  })
})
