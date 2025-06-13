
'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { HardHat, ShieldAlert, PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { mockBuildings } from '@/lib/data';
import type { Building } from '@/types';
import AddBuildingForm from '@/components/infrastructure/buildings/AddBuildingForm';
import EditBuildingForm from '@/components/infrastructure/buildings/EditBuildingForm';
import { type BuildingFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 10;

export default function InfrastructureManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [buildingsList, setBuildingsList] = useState<Building[]>(mockBuildings);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const paginatedBuildings = useMemo(() => {
    return buildingsList.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [buildingsList, currentPage]);

  const totalPages = Math.ceil(buildingsList.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleOpenEditDialog = (building: Building) => {
    setEditingBuilding(building);
    setIsEditDialogOpen(true);
  };

  const handleDeleteBuilding = (buildingId: number) => {
    const buildingToDelete = buildingsList.find(b => b.building_id === buildingId);
    if (!buildingToDelete) return;

    setBuildingsList(prev => prev.filter(b => b.building_id !== buildingId));
    toast({ title: 'Building Deleted (Mock)', description: `Building "${buildingToDelete.name}" has been removed.` });
  };
  
  const handleAddBuildingSubmit = async (data: BuildingFormData) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    const newBuildingId = Math.max(...buildingsList.map(b => b.building_id), 0) + 1;
    const newBuilding: Building = {
      building_id: newBuildingId,
      name: data.name,
      address: data.address || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setBuildingsList(prev => [newBuilding, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
    
    toast({
      title: 'Building Created (Mock)',
      description: `Building "${data.name}" has been created.`,
    });
    setIsSubmitting(false);
    setIsAddDialogOpen(false);
  };

  const handleEditBuildingSubmit = async (data: BuildingFormData) => {
    if (!editingBuilding) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    setBuildingsList(prev => 
      prev.map(b => 
        b.building_id === editingBuilding.building_id 
          ? { 
              ...b, 
              name: data.name,
              address: data.address || null,
              updated_at: new Date().toISOString(),
            } 
          : b
      ).sort((a,b) => a.name.localeCompare(b.name))
    );
    
    toast({
      title: 'Building Updated (Mock)',
      description: `Building "${data.name}" has been updated.`,
    });
    setIsSubmitting(false);
    setIsEditDialogOpen(false);
    setEditingBuilding(null);
  };

  if (!user || !user.isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Campus Infrastructure" 
        description="Manage university buildings and facilities (Admin)."
        icon={HardHat}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Building
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Building</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new campus building.
                </DialogDescription>
              </DialogHeader>
              <AddBuildingForm
                onSubmit={handleAddBuildingSubmit}
                onCancel={() => setIsAddDialogOpen(false)}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Manage Buildings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBuildings.length > 0 ? (
                paginatedBuildings.map((building) => (
                  <TableRow key={building.building_id}>
                    <TableCell className="font-medium">{building.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{building.address || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(building)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteBuilding(building.building_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    No buildings found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="self-center px-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {editingBuilding && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) setEditingBuilding(null);
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Building: {editingBuilding.name}</DialogTitle>
              <DialogDescription>
                Modify the building details below.
              </DialogDescription>
            </DialogHeader>
            <EditBuildingForm
              buildingToEdit={editingBuilding}
              onSubmit={handleEditBuildingSubmit}
              onCancel={() => { setIsEditDialogOpen(false); setEditingBuilding(null); }}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      )}

       <Card className="mt-8">
        <CardHeader>
            <CardTitle>Manage Rooms</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Room management functionality (listing, adding, editing rooms within these buildings) will be implemented here in a future update.</p>
        </CardContent>
       </Card>
    </div>
  );
}
