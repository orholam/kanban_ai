import { Navigate } from 'react-router-dom';

/** Legacy URL: send people to real sign-in instead of the old waitlist flow. */
export default function Waitlist() {
  return <Navigate to="/login" replace />;
}
