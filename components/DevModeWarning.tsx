'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Database, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function DevModeWarning() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="bg-yellow-900/20 border-yellow-500/50 text-yellow-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <div className="font-medium mb-2">⚠️ Setup Required</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <Database className="h-3 w-3" />
              <span>MongoDB: Not configured</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-3 w-3" />
              <span>SMTP: Not configured</span>
            </div>
          </div>
          <div className="mt-2 text-xs">
            See <strong>QUICK_SETUP.md</strong> for instructions
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 h-6 px-2 text-xs hover:bg-yellow-800/20"
            onClick={() => setIsDismissed(true)}
          >
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
