import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import type { Analytics, DailyViews } from '../analytics/analyticsApi';
import { useMyAnalytics } from '../analytics/useMyAnalytics';
import SubscriberCount from '../components/SubscriberCount';
import { toMediaUrl } from '../videos/videosApi';
import './AnalyticsPage.css';

const numberFormat = new Intl.NumberFormat('en-GB');
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
// Days of the chart come as UTC dates (2026-11-17): format them in UTC so they do not move a day
const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

const formatDay = (day: string) => dayFormat.format(new Date(`${day}T00:00:00Z`));
const percentage = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 1000) / 10);

/**
 * US-11: analytics of the videos of the logged-in user at /analytics: totals, authenticated vs anonymous views, the
 * views of the last 30 days and one row per video. Users without videos see an empty state with a link to upload one.
 * Visitors who are not logged in are sent to the login page (the backend also answers 401).
 */
const AnalyticsPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <MyAnalytics />;
};

const MyAnalytics = () => {
  const { analytics, status, retry } = useMyAnalytics();

  return (
    <section className="analytics-page text-start">
      <header className="analytics-header">
        <h1>Analytics</h1>
        <p className="text-muted mb-0">See how your videos are performing.</p>
      </header>

      {status === 'loading' && (
        <p role="status" className="text-muted">
          Loading analytics...
        </p>
      )}
      {status === 'unauthorized' && (
        <div role="alert" className="alert alert-warning d-flex align-items-center gap-3">
          <span>Your session has expired. Log in again to see your analytics.</span>
          <Link to="/login" state={{ from: '/analytics' }} className="btn btn-primary btn-sm">
            Log in
          </Link>
        </div>
      )}
      {status === 'error' && (
        <div role="alert" className="alert alert-danger d-flex align-items-center gap-3">
          <span>Could not load your analytics.</span>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={retry}>
            Retry
          </button>
        </div>
      )}
      {status === 'success' &&
        analytics &&
        (analytics.totalVideos === 0 ? <EmptyAnalytics /> : <AnalyticsDashboard analytics={analytics} />)}
    </section>
  );
};

const EmptyAnalytics = () => (
  <div className="analytics-empty">
    <span className="analytics-empty-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="40" height="40">
        <path fill="currentColor" d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
      </svg>
    </span>
    <h2>No analytics yet</h2>
    <p className="text-muted">Upload your first video and its views, comments and likes will appear here.</p>
    <Link to="/upload" className="btn btn-primary">
      Upload a video
    </Link>
  </div>
);

const AnalyticsDashboard = ({ analytics }: { analytics: Analytics }) => {
  const authenticatedShare = percentage(analytics.authenticatedViews, analytics.totalViews);
  const anonymousShare = analytics.totalViews === 0 ? 0 : Math.round((100 - authenticatedShare) * 10) / 10;

  return (
    <>
      <ul className="analytics-cards" aria-label="Totals">
        <StatCard label="Videos" value={analytics.totalVideos} />
        <StatCard label="Total views" value={analytics.totalViews} accent="views" />
        <StatCard label="Comments" value={analytics.totalComments} />
        <StatCard label="Comment likes" value={analytics.totalCommentLikes} />
        {/* US-13: users subscribed to my channel */}
        <SubscriberCount />
      </ul>

      <div className="analytics-row">
        <section className="analytics-panel" aria-labelledby="audience-title">
          <h2 id="audience-title" className="section-label">
            Audience
          </h2>
          <dl className="analytics-audience">
            <div>
              <dt>Authenticated users</dt>
              <dd className="is-authenticated">{numberFormat.format(analytics.authenticatedViews)}</dd>
            </div>
            <div>
              <dt>Anonymous users</dt>
              <dd className="is-anonymous">{numberFormat.format(analytics.anonymousViews)}</dd>
            </div>
          </dl>
          {analytics.totalViews > 0 ? (
            <>
              <div className="analytics-split" aria-hidden="true">
                <span className="is-authenticated" style={{ width: `${authenticatedShare}%` }} />
                <span className="is-anonymous" style={{ width: `${anonymousShare}%` }} />
              </div>
              <p className="analytics-split-legend mb-0">
                Authenticated: {authenticatedShare}% · Anonymous: {anonymousShare}%
              </p>
            </>
          ) : (
            <p className="text-muted mb-0">Nobody has watched your videos yet.</p>
          )}
        </section>

        <ViewsOverTime days={analytics.dailyViews} />
      </div>

      <section className="analytics-panel" aria-labelledby="videos-title">
        <h2 id="videos-title" className="section-label">
          Your videos
        </h2>
        <div className="table-responsive">
          <table className="table analytics-table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Video</th>
                <th scope="col">Published</th>
                <th scope="col" className="text-end">
                  Views
                </th>
                <th scope="col" className="text-end">
                  Comments
                </th>
                <th scope="col" className="text-end">
                  Comment likes
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.videos.map((video) => (
                <tr key={video.id}>
                  <td>
                    <Link to={`/videos/${video.id}`} className="analytics-video">
                      <img src={toMediaUrl(video.thumbnailUrl)} alt="" />
                      <span>{video.title}</span>
                    </Link>
                  </td>
                  <td className="text-muted text-nowrap">
                    <time dateTime={video.publishedAt}>{dateFormat.format(new Date(video.publishedAt))}</time>
                  </td>
                  <td className="text-end">{numberFormat.format(video.views)}</td>
                  <td className="text-end">{numberFormat.format(video.comments)}</td>
                  <td className="text-end">{numberFormat.format(video.commentLikes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

const StatCard = ({ label, value, accent }: { label: string; value: number; accent?: 'views' }) => (
  <li className="analytics-card">
    <span className="analytics-card-label">{label}</span>
    <strong className={`analytics-card-value${accent ? ` is-${accent}` : ''}`}>{numberFormat.format(value)}</strong>
  </li>
);

/**
 * Bar chart of the views of the last days, drawn with CSS so no chart library is needed. Each bar has a hidden text
 * with its day and views for screen readers.
 */
const ViewsOverTime = ({ days }: { days: DailyViews[] }) => {
  const max = Math.max(1, ...days.map((day) => day.views));

  return (
    <section className="analytics-panel analytics-chart-panel" aria-labelledby="views-title">
      <h2 id="views-title" className="section-label">
        Views in the last {days.length} days
      </h2>
      <ol className="analytics-chart">
        {days.map((day) => (
          <li key={day.date} title={`${formatDay(day.date)}: ${day.views} views`}>
            <span className="analytics-bar" style={{ height: `${(day.views / max) * 100}%` }} />
            <span className="visually-hidden">
              {formatDay(day.date)}: {day.views} {day.views === 1 ? 'view' : 'views'}
            </span>
          </li>
        ))}
      </ol>
      {days.length > 0 && (
        <div className="analytics-chart-axis" aria-hidden="true">
          <span>{formatDay(days[0].date)}</span>
          <span>{formatDay(days[days.length - 1].date)}</span>
        </div>
      )}
    </section>
  );
};

export default AnalyticsPage;
