'use client';

import PageHeader from '@/components/shared/PageHeader';
import DepartmentCard from '@/components/departments/DepartmentCard';
import { mockDepartments } from '@/lib/data';
import { Building } from 'lucide-react';

export default function DepartmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="University Departments" 
        description="Explore the various academic departments at CoTBE."
        icon={Building}
      />
      {mockDepartments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockDepartments.map((dept) => (
            <DepartmentCard key={dept.department_id} department={dept} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">No departments to display at the moment.</p>
        </div>
      )}
    </div>
  );
}
