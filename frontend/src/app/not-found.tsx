import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="heading-serif mt-3 text-5xl">Page not found</h1>
      <p className="mt-4 text-taupe">The page you are looking for has moved or no longer exists.</p>
      <Link href="/" className="btn-primary mt-8">Back to home</Link>
    </div>
  );
}
