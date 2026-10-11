// Submit waits on the server's underwriting run (several AI calls), which
// reports no progress of its own, so this is an indeterminate "please wait"
// bar rather than a percentage that would only be a guess.
export default function SubmitProgress() {
  return (
    <div className="mt-4 mb-4">
      <div className="fs-14 fw-medium mb-2">Please wait for your Underwriting Result...</div>
      <div
        className="progress"
        style={{ height: '12px' }}
        role="progressbar"
        aria-label="Please wait for your Underwriting Result"
        aria-busy="true"
      >
        <div
          className="progress-bar progress-bar-striped progress-bar-animated bg-success"
          style={{ width: '100%' }}
        ></div>
      </div>
      <div className="fs-13 text-muted mt-2">Loading... Please do not refresh or close this tab.</div>
    </div>
  )
}
