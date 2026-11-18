import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import type { Analytics, DailyViews } from '../analytics/analyticsApi';
import { useMyAnalytics } from '../analytics/useMyAnalytics';
import { useTranslation } from '../i18n/i18nContext';
import type { Language } from '../settings/settings';
import { toMediaUrl } from '../videos/videosApi';
import './AnalyticsPage.css';

// British English for dates and numbers in English (10 Nov 2026), the language itself otherwise
const locale = (language: Language) => (language === 'en' ? 'en-GB' : language);

/**
 * Number and date formats of the current language.
 */
const useFormats = () => {
  const { language } = useTranslation();
  const numberFormat = new Intl.NumberFormat(locale(language));
  const dateFormat = new Intl.DateTimeFormat(locale(language), { day: 'numeric', month: 'short', year: 'numeric' });
  // Days of the chart come as UTC dates (2026-11-17): format them in UTC so they do not move a day
  const dayFormat = new Intl.DateTimeFormat(locale(language), { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return {
    formatNumber: (value: number) => numberFormat.format(value),
    formatDate: (isoDate: string) => dateFormat.format(new Date(isoDate)),
    formatDay: (day: string) => dayFormat.format(new Date(`${day}T00:00:00Z`)),
  };
};

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
  const { t } = useTranslation();

  return (
    <section className="analytics-page text-start">
      <header className="analytics-header">
        <h1>{t('analytics.title')}</h1>
        <p className="text-muted mb-0">{t('analytics.subtitle')}</p>
      </header>

      {status === 'loading' && (
        <p role="status" className="text-muted">
          {t('analytics.loading')}
        </p>
      )}
      {status === 'unauthorized' && (
        <div role="alert" className="alert alert-warning d-flex align-items-center gap-3">
          <span>{t('analytics.sessionExpired')}</span>
          <Link to="/login" state={{ from: '/analytics' }} className="btn btn-primary btn-sm">
            {t('analytics.logIn')}
          </Link>
        </div>
      )}
      {status === 'error' && (
        <div role="alert" className="alert alert-danger d-flex align-items-center gap-3">
          <span>{t('analytics.loadError')}</span>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={retry}>
            {t('analytics.retry')}
          </button>
        </div>
      )}
      {status === 'success' &&
        analytics &&
        (analytics.totalVideos === 0 ? <EmptyAnalytics /> : <AnalyticsDashboard analytics={analytics} />)}
    </section>
  );
};

const EmptyAnalytics = () => {
  const { t } = useTranslation();
  return (
    <div className="analytics-empty">
      <span className="analytics-empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path fill="currentColor" d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
        </svg>
      </span>
      <h2>{t('analytics.emptyTitle')}</h2>
      <p className="text-muted">{t('analytics.emptyText')}</p>
      <Link to="/upload" className="btn btn-primary">
        {t('analytics.uploadVideo')}
      </Link>
    </div>
  );
};

const AnalyticsDashboard = ({ analytics }: { analytics: Analytics }) => {
  const { t } = useTranslation();
  const { formatNumber, formatDate } = useFormats();
  const authenticatedShare = percentage(analytics.authenticatedViews, analytics.totalViews);
  const anonymousShare = analytics.totalViews === 0 ? 0 : Math.round((100 - authenticatedShare) * 10) / 10;

  return (
    <>
      <ul className="analytics-cards" aria-label={t('analytics.totals')}>
        <StatCard label={t('analytics.videos')} value={analytics.totalVideos} />
        <StatCard label={t('analytics.totalViews')} value={analytics.totalViews} accent="views" />
        <StatCard label={t('analytics.comments')} value={analytics.totalComments} />
        <StatCard label={t('analytics.commentLikes')} value={analytics.totalCommentLikes} />
      </ul>

      <div className="analytics-row">
        <section className="analytics-panel" aria-labelledby="audience-title">
          <h2 id="audience-title" className="section-label">
            {t('analytics.audience')}
          </h2>
          <dl className="analytics-audience">
            <div>
              <dt>{t('analytics.authenticatedUsers')}</dt>
              <dd className="is-authenticated">{formatNumber(analytics.authenticatedViews)}</dd>
            </div>
            <div>
              <dt>{t('analytics.anonymousUsers')}</dt>
              <dd className="is-anonymous">{formatNumber(analytics.anonymousViews)}</dd>
            </div>
          </dl>
          {analytics.totalViews > 0 ? (
            <>
              <div className="analytics-split" aria-hidden="true">
                <span className="is-authenticated" style={{ width: `${authenticatedShare}%` }} />
                <span className="is-anonymous" style={{ width: `${anonymousShare}%` }} />
              </div>
              <p className="analytics-split-legend mb-0">
                {t('analytics.split', { authenticated: authenticatedShare, anonymous: anonymousShare })}
              </p>
            </>
          ) : (
            <p className="text-muted mb-0">{t('analytics.noViews')}</p>
          )}
        </section>

        <ViewsOverTime days={analytics.dailyViews} />
      </div>

      <section className="analytics-panel" aria-labelledby="videos-title">
        <h2 id="videos-title" className="section-label">
          {t('analytics.yourVideos')}
        </h2>
        <div className="table-responsive">
          <table className="table analytics-table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">{t('analytics.video')}</th>
                <th scope="col">{t('analytics.published')}</th>
                <th scope="col" className="text-end">
                  {t('analytics.views')}
                </th>
                <th scope="col" className="text-end">
                  {t('analytics.comments')}
                </th>
                <th scope="col" className="text-end">
                  {t('analytics.commentLikes')}
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
                    <time dateTime={video.publishedAt}>{formatDate(video.publishedAt)}</time>
                  </td>
                  <td className="text-end">{formatNumber(video.views)}</td>
                  <td className="text-end">{formatNumber(video.comments)}</td>
                  <td className="text-end">{formatNumber(video.commentLikes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

const StatCard = ({ label, value, accent }: { label: string; value: number; accent?: 'views' }) => {
  const { formatNumber } = useFormats();
  return (
    <li className="analytics-card">
      <span className="analytics-card-label">{label}</span>
      <strong className={`analytics-card-value${accent ? ` is-${accent}` : ''}`}>{formatNumber(value)}</strong>
    </li>
  );
};

/**
 * Bar chart of the views of the last days, drawn with CSS so no chart library is needed. Each bar has a hidden text
 * with its day and views for screen readers.
 */
const ViewsOverTime = ({ days }: { days: DailyViews[] }) => {
  const max = Math.max(1, ...days.map((day) => day.views));
  const { t } = useTranslation();
  const { formatDay } = useFormats();

  return (
    <section className="analytics-panel analytics-chart-panel" aria-labelledby="views-title">
      <h2 id="views-title" className="section-label">
        {t('analytics.viewsInLastDays', { count: days.length })}
      </h2>
      <ol className="analytics-chart">
        {days.map((day) => (
          <li key={day.date} title={t('analytics.dayViews', { day: formatDay(day.date), count: day.views })}>
            <span className="analytics-bar" style={{ height: `${(day.views / max) * 100}%` }} />
            <span className="visually-hidden">
              {t('analytics.dayViews', { day: formatDay(day.date), count: day.views })}
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
