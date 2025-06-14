// src/app/(main)/departments/page.tsx
import PageHeader from '@/components/shared/PageHeader';
import DepartmentCard from '@/components/departments/DepartmentCard';
import { Building } from 'lucide-react';
import { getAllDepartments } from '@/actions/departmentActions';
import type { Department } from '@prisma/client';

export default async function DepartmentsPage() {
  const departments: Department[] = await getAllDepartments();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="University Departments" 
        description="Explore the various academic departments at CoTBE."
        icon={Building}
      />
      {departments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <DepartmentCard key={dept.department_id} department={dept} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">No departments found in the database.</p>
          <p className="text-sm text-muted-foreground mt-1">If this is unexpected, please check the database or contact an administrator.</p>
        </div>
      )}
    </div>
  );
}
