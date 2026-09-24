import { getCurrentUser } from '@/lib/utils/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.userType !== 'official') {
    redirect('/officiallogin');
  }

  return <>{children}</>;
}
