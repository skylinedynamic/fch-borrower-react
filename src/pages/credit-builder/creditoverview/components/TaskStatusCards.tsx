import React from 'react'
import { useTaskOverview } from '../../../../modules/credit-builder/overview'
import TaskStatusCardsLoader from '../../../../components/Loader/TaskStatusCardsLoader'

export default function TaskStatusCards() {
  const { data, isLoading, isError, error } = useTaskOverview()

  if (isLoading) {
    return <TaskStatusCardsLoader />
  }

  if (isError) {
    return (
      <div className="card mb-3">
        <div className="card-body">
          <div className="alert alert-danger mb-0">
            <i className="ri-error-warning-line me-2"></i>
            {error instanceof Error ? error.message : 'Failed to load task overview'}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { tier, verified, processing, pending, rejected } = data
  const totalTasks = verified.length + processing.length + pending.length + rejected.length
  const completedTasks = verified.length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row g-3">
          {/* Pending Tasks Panel */}
          <div className="col-lg-3">
            <div className="panel panel--pending h-100">
              <div className="panel-header">
                <div className="panel-title">
                  <span className="icon-badge">
                    <i className="ri-time-line"></i>
                  </span>
                  <span>Pending Tasks</span>
                </div>
                <span className="badge">
                  {pending.length} tasks
                </span>
              </div>
              <div className="panel-body">
                {pending.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon mb-3">
                      <i className="ri-checkbox-circle-line" style={{ color: '#52a573' }}></i>
                    </div>
                    <div className="empty-state-text">
                      <h6>All Caught Up!</h6>
                      <p>No pending tasks at the moment</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="tasks-list">
                      {pending.map((task) => (
                        <div key={task.id} className="task">
                          <div className="d-flex align-items-start gap-2">
                            <span className="task-dot"></span>
                            <div className="flex-grow-1">
                              <div className="task-title">{task.title}</div>
                              <div className="task-subtitle">{task.subtitle}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <button type="button" className="btn btn-start w-100">
                        <i className="ri-play-circle-line me-2"></i>
                        Start Next Task
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Processing Tasks Panel */}
          <div className="col-lg-3">
            <div className="panel panel--processing h-100">
              <div className="panel-header">
                <div className="panel-title">
                  <span className="icon-badge">
                    <i className="ri-loader-4-line"></i>
                  </span>
                  <span>In Progress</span>
                </div>
                <span className="badge">
                  {processing.length} active
                </span>
              </div>
              <div className="panel-body">
                {processing.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon mb-3">
                      <i className="ri-time-line" style={{ color: '#5785c3' }}></i>
                    </div>
                    <div className="empty-state-text">
                      <h6>No Tasks Processing</h6>
                      <p>Start a task to see it here</p>
                    </div>
                  </div>
                ) : (
                  <div className="tasks-list">
                    {processing.map((task) => (
                      <div key={task.id} className="task">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div className="d-flex align-items-start gap-2 flex-grow-1">
                            <div className="spinner-border text-primary" style={{ width: '16px', height: '16px', borderWidth: '2px', marginTop: '2px' }}></div>
                            <div className="flex-grow-1">
                              <div className="task-title">{task.title}</div>
                              <div className="task-subtitle">{task.subtitle}</div>
                            </div>
                          </div>
                          <span className="status-badge">In Progress</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verified/Completed Tasks Panel */}
          <div className="col-lg-3">
            <div className="panel panel--completed h-100">
              <div className="panel-header">
                <div className="panel-title">
                  <span className="icon-badge">
                    <i className="ri-checkbox-circle-line"></i>
                  </span>
                  <span>Verified</span>
                </div>
                <span className="badge">
                  {verified.length} completed
                </span>
              </div>
              <div className="panel-body">
                {verified.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon mb-3">
                      <i className="ri-trophy-line" style={{ color: '#52a573' }}></i>
                    </div>
                    <div className="empty-state-text">
                      <h6>Start Your Journey</h6>
                      <p>Complete tasks to build credit</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="tasks-list">
                      {verified.map((task) => (
                        <div key={task.id} className="task">
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <div className="d-flex align-items-start gap-2 flex-grow-1">
                              <i className="ri-check-line" style={{ color: '#52a573', fontSize: '18px', marginTop: '2px' }}></i>
                              <div className="flex-grow-1">
                                <div className="task-title">{task.title}</div>
                                <div className="task-subtitle">{task.subtitle}</div>
                                {task.completed_at && (
                                  <div className="task-meta">
                                    <i className="ri-calendar-check-line me-1"></i>
                                    {task.completed_at}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="status-badge">Verified</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="progress-section">
                      <div className="progress">
                        <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <span className="task-subtitle">
                          <i className="ri-trophy-line me-1"></i>
                          {tier.name} Progress
                        </span>
                        <span className="fw-semibold" style={{ color: '#52a573', fontSize: '13px' }}>
                          {progressPercentage}%
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Rejected Tasks Panel */}
          <div className="col-lg-3">
            <div className="panel panel--rejected h-100">
              <div className="panel-header">
                <div className="panel-title">
                  <span className="icon-badge">
                    <i className="ri-close-circle-line"></i>
                  </span>
                  <span>Rejected</span>
                </div>
                <span className="badge">
                  {rejected.length} tasks
                </span>
              </div>
              <div className="panel-body">
                {rejected.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon mb-3">
                      <i className="ri-shield-check-line" style={{ color: '#52a573' }}></i>
                    </div>
                    <div className="empty-state-text">
                      <h6>Perfect Record</h6>
                      <p>No rejected tasks</p>
                    </div>
                  </div>
                ) : (
                  <div className="tasks-list">
                    {rejected.map((task) => (
                      <div key={task.id} className="task">
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                          <div className="d-flex align-items-start gap-2 flex-grow-1">
                            <i className="ri-close-line" style={{ color: '#d67171', fontSize: '18px', marginTop: '2px' }}></i>
                            <div className="flex-grow-1">
                              <div className="task-title">{task.title}</div>
                              <div className="task-subtitle">{task.subtitle}</div>
                            </div>
                          </div>
                          <span className="status-badge">Rejected</span>
                        </div>
                        {task.rejection_reason && (
                          <div className="rejection-alert">
                            <div className="d-flex align-items-start gap-2">
                              <i className="ri-information-line" style={{ color: '#d67171', fontSize: '14px', marginTop: '2px' }}></i>
                              <span className="task-subtitle" style={{ lineHeight: '1.4' }}>
                                {task.rejection_reason}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
