import React from 'react';
import { Loader2, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AuthLoaderProps {
  message?: string;
}

export const AuthLoader: React.FC<AuthLoaderProps> = ({ 
  message = "Checking authentication..." 
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Shield className="h-16 w-16 text-primary/20" />
                <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-4 left-4" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">
                {message}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Please wait while we verify your authentication status and load your data...
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
