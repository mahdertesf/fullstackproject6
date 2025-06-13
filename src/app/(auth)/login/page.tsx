import LoginForm from '@/components/auth/LoginForm';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4 sm:p-6">
      <div className="w-full max-w-md rounded-xl bg-card shadow-2xl overflow-hidden">
        <div className="bg-primary p-6 text-center">
           <Image src="https://placehold.co/150x50.png?text=CoTBE+Logo" alt="CoTBE Portal Logo" width={150} height={50} className="mx-auto mb-4" data-ai-hint="university logo" />
          <h1 className="text-3xl font-bold text-primary-foreground font-headline">
            CoTBE Portal
          </h1>
          <p className="text-primary-foreground/80 mt-1">Addis Ababa University</p>
        </div>
        <div className="p-6 sm:p-8">
          <LoginForm />
        </div>
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Addis Ababa University CoTBE. All rights reserved.
      </p>
    </div>
  );
}
