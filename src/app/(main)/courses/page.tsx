// src/app/(main)/courses/page.tsx

'use client';

import { useState, useMemo, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import CourseCard from '@/components/courses/CourseCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Search, Filter, Loader2 } from 'lucide-react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { getAllCoursesWithDetails, type CourseWithDepartment } from '@/actions/courseActions';
import { getAllDepartments } from '@/actions/departmentActions';
import type { Department as PrismaDepartment } from '@prisma/client';


const ITEMS_PER_PAGE = 9;

export default function CourseCatalogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(''); 
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const [allCourses, setAllCourses] = useState<CourseWithDepartment[]>([]);
  const [allDepartments, setAllDepartments] = useState<PrismaDepartment[]>([]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [coursesData, departmentsData] = await Promise.all([
          getAllCoursesWithDetails(),
          getAllDepartments()
        ]);
        setAllCourses(coursesData);
        setAllDepartments(departmentsData);
      } catch (error) {
        console.error("Failed to fetch course catalog data:", error);
        // Potentially set an error state here to show to the user
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);


  const filteredCourses = useMemo(() => {
    return allCourses.filter(course => {
      const matchesSearchTerm = 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const isFilteringBySpecificDepartment = selectedDepartmentId !== '' && selectedDepartmentId !== 'all';
      const matchesDepartment = isFilteringBySpecificDepartment
        ? (course.department_id != null && course.department_id === parseInt(selectedDepartmentId))
        : true; 
      
      return matchesSearchTerm && matchesDepartment;
    });
  }, [allCourses, searchTerm, selectedDepartmentId]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading Course Catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Course Catalog" 
        description="Explore all available courses at CoTBE." 
        icon={BookOpen} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg shadow-sm bg-card">
        <div className="md:col-span-2">
          <label htmlFor="search-courses" className="block text-sm font-medium text-foreground mb-1">Search Courses</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="search-courses"
              type="text"
              placeholder="Search by title, code, or description..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <label htmlFor="filter-department" className="block text-sm font-medium text-foreground mb-1">Filter by Department</label>
          <Select value={selectedDepartmentId} onValueChange={(value) => { setSelectedDepartmentId(value); setCurrentPage(1); }}>
            <SelectTrigger id="filter-department" className="w-full">
               <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {allDepartments.map((dept) => (
                <SelectItem key={dept.department_id} value={String(dept.department_id)}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {paginatedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCourses.map((course) => (
            <CourseCard key={course.course_id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">No courses found matching your criteria.</p>
        </div>
      )}

      {totalPages > 1 && (
         <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined} 
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1 || (currentPage <= 2 && page <=3) || (currentPage >= totalPages -1 && page >= totalPages -2 )) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); handlePageChange(page);}}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                 return <PaginationEllipsis key={`ellipsis-${page}`} />;
              }
              return null;
            })}
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
