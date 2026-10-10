import { redirect } from 'next/navigation';

/** Legacy ops panel — product moved to /open-banking/console */
export default function OpenBankingOpsRedirect() {
  redirect('/open-banking/console');
}
