'use client';

import { useId, useState } from 'react';
import { supabase } from '@/lib/supabase';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInForm() {
  const id = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // Success - the user will be redirected by the auth state change
        console.log('Sign in successful:', data);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Implement Google Sign In when OAuth is configured
  // const handleGoogleSignIn = async () => {
  //   setIsLoading(true);
  //   setError('');
  //   try {
  //     const { error } = await supabase.auth.signInWithOAuth({
  //       provider: 'google',
  //       options: {
  //         redirectTo: `${window.location.origin}/admin`,
  //       },
  //     });
  //     if (error) {
  //       setError(error.message);
  //     }
  //   } catch (err) {
  //     setError('An unexpected error occurred');
  //     console.error('Google sign in error:', err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex flex-col items-center gap-2 mb-4">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <Image
              src="/ark-logo.svg"
              alt="Ark Dumpster Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <CardTitle>Admin Dashboard</CardTitle>
          <p className="text-muted-foreground text-sm">Please sign in to access the admin panel.</p>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSignIn}>
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${id}-email`}>Email</Label>
              <Input
                id={`${id}-email`}
                placeholder="admin@arkdumpster.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-password`}>Password</Label>
              <Input
                id={`${id}-password`}
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox id={`${id}-remember`} />
              <Label htmlFor={`${id}-remember`} className="text-muted-foreground font-normal">
                Remember me
              </Label>
            </div>
            <a className="text-sm underline hover:no-underline" href="#">
              Forgot password?
            </a>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Signing in...
              </div>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        {/* <div className="before:bg-border after:bg-border flex items-center gap-3 before:h-px before:flex-1 after:h-px after:flex-1 my-4">
          <span className="text-muted-foreground text-xs">Or</span>
        </div>

        <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Loading...
            </div>
          ) : (
            'Login with Google'
          )}
        </Button> */}
      </CardContent>
    </Card>
  );
}
