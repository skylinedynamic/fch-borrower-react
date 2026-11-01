import { http, HttpResponse, type HttpHandler } from 'msw'

/**
 * MSW request handlers, grouped by module namespace to mirror
 * src/lib/query/queryKeys.ts. Empty until a phase adds handlers for
 * the endpoints it covers — keeps unhandled requests failing loudly
 * (see onUnhandledRequest: 'error' in src/test/setup.ts) rather than
 * silently hitting the network.
 */
export const handlers: HttpHandler[] = [
  // The layout (header bell + sidebar "Notifications" badge) loads the latest
  // notifications - and the unread count in their meta - on every page. Default
  // it to empty so tests that render the layout for something else don't need
  // to; notification tests override it with server.use().
  http.get('*/common/notifications', () =>
    HttpResponse.json({ status: true, data: [], meta: { current_page: 1, last_page: 1, per_page: 5, total: 0, unread_count: 0 } })
  ),

  // The credit profile request form starts from the borrower's profile - its
  // address and the SSN on file. Default to a blank profile with no SSN so a
  // test rendering that form for something else is not an unhandled request;
  // tests about the prefill or the SSN override it with server.use().
  http.get('*/borrower/profile/personal-info', () =>
    HttpResponse.json({
      status: true,
      data: {
        id: 1,
        first_name: '',
        middle_name: null,
        last_name: '',
        email: '',
        pending_email: null,
        home_address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        home_phone: '',
        phone_number: '',
        ssn: null,
        date_of_birth: '',
      },
    })
  ),
]
