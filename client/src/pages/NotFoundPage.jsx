import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-center mt-16">
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <Link to="/" className="underline">Back to the library</Link>
    </div>
  );
}
