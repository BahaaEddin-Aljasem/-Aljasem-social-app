import { Outlet } from 'react-router-dom';
import Authintro from '../../componat/Authintro/Authintro';

export default function AuthLayout() {
  return (
    <main className="min-h-screen bg-second px-4 py-8 md:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full items-start gap-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-12">
          <section className="order-1 lg:order-2">
            <h1 className="text-5xl font-bold tracking-tight text-[#002a8c] md:text-6xl">Route Posts</h1>
            <p className="mt-2 max-w-md text-2xl leading-snug text-slate-800">
              Connect with friends and the world around you on Route Posts.
            </p>
            <div className="mt-6">
              <Outlet />
            </div>
          </section>
          <div className="order-2 lg:order-1">
            <Authintro />
          </div>
        </div>
      </div>
    </main>
  );
}