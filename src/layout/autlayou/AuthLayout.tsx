import { Outlet } from 'react-router-dom';
import Authintro from '../../componat/Authintro/Authintro';

export default function AuthLayout() {
  return (
    <main className="min-h-screen bg-second px-4 py-8 md:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-start justify-center">
        <div className="w-full max-w-2xl space-y-8">
          <section>
            <h1 className="text-5xl font-bold tracking-tight text-[#002a8c] md:text-6xl">Social</h1>
            <p className="mt-2 max-w-md text-2xl leading-snug text-slate-800">
              Connect with friends and the world around you on Social.
            </p>
            <div className="mt-6">
              <Outlet />
            </div>
          </section>
          <Authintro />
        </div>
      </div>
    </main>
  );
}