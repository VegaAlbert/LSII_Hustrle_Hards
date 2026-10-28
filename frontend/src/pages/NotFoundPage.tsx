import { Link } from 'react-router-dom';

type Props = {
  title?: string;
};

/**
 * Shown for unknown routes and for videos that do not exist (US-05), instead of a broken page.
 */
const NotFoundPage = ({ title = 'Page not found' }: Props) => (
  <section className="text-center py-5">
    <h1 className="h3">{title}</h1>
    <p className="text-muted">It may have been removed or the link is wrong.</p>
    <Link to="/" className="btn btn-primary">
      Back to home
    </Link>
  </section>
);

export default NotFoundPage;
