import './globals.css';
import Navbar from './components/Navbar';
import { ToastProvider } from './context/ToastContext';

export const metadata = {
  title: 'PrimeWave Reserve – Resource Reservation System',
  description: 'Centralized resource and reservation management platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#2e0b10] bg-[radial-gradient(1200px_700px_at_80%_-10%,#5b1a22,transparent_60%),linear-gradient(160deg,#5b1a22,#2e0b10_70%)] bg-fixed text-[#fbeff0] antialiased">
        <ToastProvider>
          <div className="mx-auto max-w-6xl px-5 pt-6 pb-20">
            <Navbar />
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}