// src/components/departments/DepartmentCard.tsx
import type { Department } from '@prisma/client'; // Updated import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

interface DepartmentCardProps {
  department: Department;
}

export default function DepartmentCard({ department }: DepartmentCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="p-2 bg-accent/20 rounded-md">
         <Building2 className="h-6 w-6 text-accent" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-lg font-headline">{department.name}</CardTitle>
          {/* For now, department details page is not implemented, so no Link here */}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {department.description || 'No description available for this department.'}
        </p>
      </CardContent>
    </Card>
  );
}
